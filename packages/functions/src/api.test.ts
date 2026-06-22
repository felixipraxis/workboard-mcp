import vm from "node:vm";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("OAuth browser pages", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("continues OAuth when Better Auth returns a url redirect payload", async () => {
    vi.doMock("@better-auth/oauth-provider", () => ({
      oauthProviderAuthServerMetadata: () => () => new Response("{}"),
      oauthProviderOpenIdConfigMetadata: () => () => new Response("{}"),
    }));
    vi.doMock("@workboard-mcp/core/auth/auth", () => ({
      auth: {
        handler: vi.fn(),
        api: {
          getSession: vi.fn(async () => ({
            session: { id: "session_123" },
            user: { id: "user_123" },
          })),
        },
      },
    }));
    vi.doMock("@workboard-mcp/core/config", () => ({
      getAuthIssuer: () => "http://localhost:3000/api/auth",
      getPublicBaseUrl: () => "http://localhost:3000",
    }));
    vi.doMock("@workboard-mcp/core/db/workboard-token", () => ({
      upsertWorkboardCredential: vi.fn(async () => undefined),
    }));
    vi.doMock("@workboard-mcp/core/workboard/client", () => ({
      verifyWorkboardToken: vi.fn(async () => undefined),
    }));
    vi.doMock("@workboard-mcp/core/mcp/handler", () => ({
      authenticatedMcpHandler: () => new Response("{}"),
      workboardProtectedResourceHandler: () => new Response("{}"),
    }));
    vi.doMock("mcp-handler", () => ({
      metadataCorsOptionsRequestHandler: () => () => new Response(null, { status: 204 }),
    }));

    const { app } = await import("./api");
    const response = await app.request(
      "http://localhost:3000/oauth/workboard-token?client_id=client_123",
      {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ token: "wb-token" }),
      },
    );
    const html = await response.text();
    const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
    expect(script).toBeDefined();

    const errorElement = { hidden: true, textContent: "" };
    const context = {
      document: {
        getElementById: vi.fn(() => errorElement),
      },
      fetch: vi.fn(async () => ({
        ok: true,
        json: async () => ({
          redirect: true,
          url: "https://client.example.test/callback?code=abc",
        }),
      })),
      JSON,
      window: { location: { href: "" } },
    };

    vm.runInNewContext(script!, context);
    await new Promise((resolve) => setImmediate(resolve));

    expect(context.window.location.href).toBe(
      "https://client.example.test/callback?code=abc",
    );
    expect(errorElement.textContent).toBe("");
    expect(errorElement.hidden).toBe(true);
  });
});
