import {
  oauthProviderAuthServerMetadata,
  oauthProviderOpenIdConfigMetadata,
} from "@better-auth/oauth-provider";
import { auth } from "@workboard-mcp/core/auth/auth";
import { getAuthIssuer, getPublicBaseUrl } from "@workboard-mcp/core/config";
import {
  authenticatedMcpHandler,
  workboardProtectedResourceHandler,
} from "@workboard-mcp/core/mcp/handler";
import { upsertWorkboardCredential } from "@workboard-mcp/core/db/workboard-token";
import { verifyWorkboardToken } from "@workboard-mcp/core/workboard/client";
import { handle } from "hono/aws-lambda";
import { Hono } from "hono";
import { metadataCorsOptionsRequestHandler } from "mcp-handler";

export const app = new Hono();

const authMetadata = oauthProviderAuthServerMetadata(auth);
const openIdMetadata = oauthProviderOpenIdConfigMetadata(auth);
const metadataOptions = metadataCorsOptionsRequestHandler();

app.get("/", (c) =>
  c.json({
    ok: true,
    service: "workboard-mcp",
    issuer: getAuthIssuer(),
    mcp: `${getPublicBaseUrl()}/mcp`,
  }),
);

app.get("/health", (c) => c.json({ ok: true }));

app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.options("/.well-known/oauth-authorization-server", (c) =>
  metadataOptions(),
);
app.get("/.well-known/oauth-authorization-server", (c) =>
  authMetadata(c.req.raw),
);
app.options("/.well-known/oauth-authorization-server/*", (c) =>
  metadataOptions(),
);
app.get("/.well-known/oauth-authorization-server/*", (c) =>
  authMetadata(c.req.raw),
);
app.options("/.well-known/openid-configuration", (c) =>
  metadataOptions(),
);
app.get("/.well-known/openid-configuration", (c) =>
  openIdMetadata(c.req.raw),
);
app.options("/.well-known/openid-configuration/*", (c) =>
  metadataOptions(),
);
app.get("/.well-known/openid-configuration/*", (c) =>
  openIdMetadata(c.req.raw),
);
app.options("/.well-known/oauth-protected-resource", (c) =>
  metadataOptions(),
);
app.get("/.well-known/oauth-protected-resource", (c) =>
  workboardProtectedResourceHandler(c.req.raw),
);
app.options("/.well-known/oauth-protected-resource/*", (c) =>
  metadataOptions(),
);
app.get("/.well-known/oauth-protected-resource/*", (c) =>
  workboardProtectedResourceHandler(c.req.raw),
);

app.get("/oauth/login", (c) =>
  c.html(loginPage(oauthQueryString(c.req.raw), oauthError(c.req.raw))),
);

app.get("/oauth/workboard-token", async (c) => {
  const session = await getSession(c.req.raw.headers);
  if (!session) return c.redirect(`/oauth/login?${oauthQueryString(c.req.raw)}`);

  return c.html(workboardTokenPage(oauthQueryString(c.req.raw)));
});

app.post("/oauth/workboard-token", async (c) => {
  const session = await getSession(c.req.raw.headers);
  if (!session) return c.redirect(`/oauth/login?${oauthQueryString(c.req.raw)}`);

  const body = await c.req.parseBody();
  const token = String(body.token ?? "").trim();

  if (!token) {
    return c.html(workboardTokenPage(oauthQueryString(c.req.raw), "Token is required."), 400);
  }

  try {
    await verifyWorkboardToken({ token, signal: c.req.raw.signal });
    await upsertWorkboardCredential({
      userId: session.user.id,
      token,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not verify that Workboard token.";
    return c.html(workboardTokenPage(oauthQueryString(c.req.raw), message), 400);
  }

  return c.html(continueOAuthPage(oauthQueryString(c.req.raw)));
});

app.get("/oauth/consent", (c) =>
  c.html(consentPage(oauthQueryString(c.req.raw))),
);

app.all("/mcp", (c) => authenticatedMcpHandler(c.req.raw));

export const handler = handle(app);

async function getSession(headers: Headers) {
  return auth.api.getSession({ headers });
}

function oauthQueryString(request: Request) {
  const params = new URL(request.url).searchParams;
  params.delete("error");
  params.delete("error_description");
  return params.toString();
}

function oauthError(request: Request) {
  const params = new URL(request.url).searchParams;
  const error = params.get("error");
  if (!error) return undefined;

  const description = params.get("error_description");
  return description ? `${error}: ${description}` : error;
}

function loginPage(oauthQuery: string, error?: string) {
  const callbackUrl = `/api/auth/oauth2/authorize${oauthQuery ? `?${oauthQuery}` : ""}`;
  const errorCallbackUrl = `/oauth/login${oauthQuery ? `?${oauthQuery}` : ""}`;

  return pageShell(
    "Sign in",
    `
      <main class="panel">
        <h1>Sign in</h1>
        <p>Use your Praxis Medicines Microsoft account to continue.</p>
        ${error ? `<p class="error">${escapeHtml(error)}</p>` : ""}
        <button id="sign-in">Continue with Microsoft</button>
        <p id="error" class="error" hidden></p>
      </main>
      <script>
        const button = document.getElementById("sign-in");
        const error = document.getElementById("error");

        button.addEventListener("click", async () => {
          button.disabled = true;
          error.hidden = true;

          const response = await fetch("/api/auth/sign-in/oauth2", {
            method: "POST",
            headers: { "content-type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
              providerId: "microsoft-entra-id",
              callbackURL: ${JSON.stringify(callbackUrl)},
              errorCallbackURL: ${JSON.stringify(errorCallbackUrl)}
            })
          });

          const result = await response.json().catch(() => ({}));
          if (response.ok && result.url) {
            window.location.href = result.url;
            return;
          }

          button.disabled = false;
          error.textContent = result.message || "Microsoft sign-in could not start.";
          error.hidden = false;
        });
      </script>
    `,
  );
}

function workboardTokenPage(oauthQuery: string, error?: string) {
  const action = `/oauth/workboard-token${oauthQuery ? `?${oauthQuery}` : ""}`;

  return pageShell(
    "Workboard token",
    `
      <main class="panel">
        <h1>Workboard token</h1>
        <p>Add your personal Workboard API token to finish authorization.</p>
        ${error ? `<p class="error">${escapeHtml(error)}</p>` : ""}
        <form method="post" action="${escapeHtml(action)}">
          <label>
            Token
            <input type="password" name="token" autocomplete="off" required autofocus />
          </label>
          <button type="submit">Verify token</button>
        </form>
      </main>
    `,
  );
}

function continueOAuthPage(oauthQuery: string) {
  return pageShell(
    "Continuing",
    `
      <main class="panel">
        <h1>Continuing</h1>
        <p>Returning to authorization...</p>
        <p id="error" class="error" hidden></p>
      </main>
      <script>
        const error = document.getElementById("error");
        (async () => {
          const response = await fetch("/api/auth/oauth2/continue", {
            method: "POST",
            headers: { "content-type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
              postLogin: true,
              oauth_query: ${JSON.stringify(oauthQuery)}
            })
          });

          const result = await response.json().catch(() => ({}));
          const redirectUrl = result.redirect_uri || result.url;
          if (response.ok && redirectUrl) {
            window.location.href = redirectUrl;
            return;
          }

          error.textContent = result.message || "Authorization could not continue.";
          error.hidden = false;
        })();
      </script>
    `,
  );
}

function consentPage(oauthQuery: string) {
  const scopes = new URLSearchParams(oauthQuery).get("scope") ?? "";

  return pageShell(
    "Authorize",
    `
      <main class="panel">
        <h1>Authorize</h1>
        <p>The MCP client is requesting access${scopes ? ` for ${escapeHtml(scopes)}` : ""}.</p>
        <div class="actions">
          <button id="allow">Allow</button>
          <button id="deny" class="secondary">Deny</button>
        </div>
        <p id="error" class="error" hidden></p>
      </main>
      <script>
        const error = document.getElementById("error");

        async function submitConsent(accept) {
          error.hidden = true;
          const response = await fetch("/api/auth/oauth2/consent", {
            method: "POST",
            headers: { "content-type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({
              accept,
              oauth_query: ${JSON.stringify(oauthQuery)}
            })
          });

          const result = await response.json().catch(() => ({}));
          const redirectUrl = result.redirect_uri || result.url;
          if (response.ok && redirectUrl) {
            window.location.href = redirectUrl;
            return;
          }

          error.textContent = result.message || "Authorization could not be completed.";
          error.hidden = false;
        }

        document.getElementById("allow").addEventListener("click", () => submitConsent(true));
        document.getElementById("deny").addEventListener("click", () => submitConsent(false));
      </script>
    `,
  );
}

function pageShell(title: string, body: string) {
  return `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(title)} | Workboard MCP</title>
        <style>
          :root {
            color-scheme: light;
            font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            background: #f6f8fb;
            color: #17202a;
          }
          body {
            margin: 0;
            min-height: 100vh;
            display: grid;
            place-items: center;
            padding: 24px;
          }
          .panel {
            width: min(100%, 420px);
            background: #ffffff;
            border: 1px solid #d8dee8;
            border-radius: 8px;
            box-shadow: 0 18px 48px rgb(34 48 73 / 12%);
            padding: 28px;
          }
          h1 {
            margin: 0 0 10px;
            font-size: 24px;
            line-height: 1.2;
          }
          p {
            margin: 0 0 18px;
            color: #4c5b6f;
            line-height: 1.5;
          }
          form, label {
            display: grid;
            gap: 10px;
          }
          input {
            width: 100%;
            box-sizing: border-box;
            border: 1px solid #b8c2d1;
            border-radius: 6px;
            font: inherit;
            padding: 11px 12px;
          }
          button {
            border: 0;
            border-radius: 6px;
            background: #1457d9;
            color: #ffffff;
            font: inherit;
            font-weight: 650;
            padding: 11px 14px;
            cursor: pointer;
          }
          button.secondary {
            background: #e8edf5;
            color: #223049;
          }
          button:disabled {
            cursor: wait;
            opacity: 0.72;
          }
          .actions {
            display: flex;
            gap: 10px;
          }
          .error {
            color: #b42318;
          }
        </style>
      </head>
      <body>${body}</body>
    </html>`;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}
