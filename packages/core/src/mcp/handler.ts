import { mcpHandler as betterAuthMcpHandler } from "@better-auth/oauth-provider";
import { oauthProviderResourceClient } from "@better-auth/oauth-provider/resource-client";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import type { JWTPayload } from "jose";
import { auth } from "../auth/auth";
import { getAuthIssuer, getMcpResourceUrl } from "../config";
import { registerWorkboardTools } from "./workboard";

export const workboardMcpResourceMetadataPath =
  "/.well-known/oauth-protected-resource/mcp";

const resourceClient = oauthProviderResourceClient(auth).getActions();
const workboardMcpScopes = ["workboard:read", "workboard:write"];
const serverInfo = {
  name: "workboard-mcp",
  version: "0.1.0",
};

export async function workboardProtectedResourceHandler() {
  const metadata = await resourceClient.getProtectedResourceMetadata({
    resource: getMcpResourceUrl(),
    authorization_servers: [getAuthIssuer()],
    bearer_methods_supported: ["header"],
    scopes_supported: workboardMcpScopes,
  });

  return new Response(JSON.stringify(metadata), {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "application/json",
    },
  });
}

export const authenticatedMcpHandler = betterAuthMcpHandler(
  {
    jwksUrl: `${getAuthIssuer()}/jwks`,
    verifyOptions: {
      audience: getMcpResourceUrl(),
      issuer: getAuthIssuer(),
    },
    scopes: ["workboard:read"],
  },
  (request, payload) => {
    const authInfo = authInfoFromJwtPayload(request, payload);
    (request as Request & { auth?: AuthInfo }).auth = authInfo;
    return workboardMcpHandler(request, authInfo);
  },
);

async function workboardMcpHandler(request: Request, authInfo: AuthInfo) {
  const server = new McpServer(serverInfo);
  registerWorkboardTools(server);

  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: true,
    sessionIdGenerator: undefined,
  });

  transport.onerror = (error) => {
    if (process.env.MCP_VERBOSE_LOGS === "true") {
      console.error("[workboard-mcp-transport-error]", error);
    }
  };

  await server.connect(transport);
  return transport.handleRequest(request, { authInfo });
}

function authInfoFromJwtPayload(
  request: Request,
  payload: JWTPayload,
): AuthInfo {
  const userId = stringClaim(payload.sub);

  return {
    token: bearerToken(request.headers.get("authorization")) ?? "",
    clientId:
      stringClaim(payload.client_id) ??
      stringClaim(payload.azp) ??
      "unknown-client",
    scopes: stringClaim(payload.scope)?.split(/\s+/).filter(Boolean) ?? [],
    expiresAt: typeof payload.exp === "number" ? payload.exp : undefined,
    resource: new URL(getMcpResourceUrl()),
    extra: userId ? { userId } : {},
  };
}

function stringClaim(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function bearerToken(value: string | null) {
  if (!value) return undefined;
  const match = /^Bearer\s+(.+)$/i.exec(value);
  return match?.[1];
}
