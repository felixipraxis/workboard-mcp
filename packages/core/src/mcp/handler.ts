import { verifyAccessToken } from "better-auth/oauth2";
import {
  createMcpHandler,
  protectedResourceHandler,
  withMcpAuth,
} from "mcp-handler";
import type { AuthInfo } from "@modelcontextprotocol/sdk/server/auth/types.js";
import { getAuthIssuer, getMcpResourceUrl } from "../config";
import { registerWorkboardTools } from "./workboard";

export const workboardProtectedResourceHandler = protectedResourceHandler({
  authServerUrls: [getAuthIssuer()],
  resourceUrl: getMcpResourceUrl(),
});

const mcpHandler = createMcpHandler(
  (server) => {
    registerWorkboardTools(server);
  },
  {
    serverInfo: {
      name: "workboard-mcp",
      version: "0.1.0",
    },
  },
  {
    basePath: "",
    disableSse: true,
    maxDuration: 60,
    verboseLogs: process.env.MCP_VERBOSE_LOGS === "true",
  },
);

export const authenticatedMcpHandler = withMcpAuth(
  mcpHandler,
  verifyMcpBearerToken,
  {
    required: true,
    resourceMetadataPath: "/.well-known/oauth-protected-resource",
    resourceUrl: new URL(getMcpResourceUrl()).origin,
  },
);

async function verifyMcpBearerToken(
  _request: Request,
  bearerToken?: string,
): Promise<AuthInfo | undefined> {
  if (!bearerToken) return undefined;

  const payload = await verifyAccessToken(bearerToken, {
    jwksUrl: `${getAuthIssuer()}/jwks`,
    verifyOptions: {
      issuer: getAuthIssuer(),
      audience: getMcpResourceUrl(),
    },
  });

  const userId = typeof payload.sub === "string" ? payload.sub : undefined;
  if (!userId) return undefined;

  return {
    token: bearerToken,
    clientId:
      stringClaim(payload.client_id) ??
      stringClaim(payload.azp) ??
      "unknown-client",
    scopes: stringClaim(payload.scope)?.split(/\s+/).filter(Boolean) ?? [],
    expiresAt: typeof payload.exp === "number" ? payload.exp : undefined,
    resource: new URL(getMcpResourceUrl()),
    extra: { userId },
  };
}

function stringClaim(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}
