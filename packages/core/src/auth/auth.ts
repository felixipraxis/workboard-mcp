import { oauthProvider } from "@better-auth/oauth-provider";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { genericOAuth, jwt, microsoftEntraId } from "better-auth/plugins";
import {
  getAuthBasePath,
  getBetterAuthSecret,
  getEntraRedirectUri,
  getEntraConfig,
  getMcpResourceUrl,
  getPublicBaseUrl,
} from "../config";
import { hasWorkboardCredential } from "../db/workboard-token";
import { getDb } from "../db/drizzle";
import * as authSchema from "../db/schema/auth";

const publicBaseUrl = getPublicBaseUrl();
const mcpResourceUrl = getMcpResourceUrl();
const workboardTokenClaim = `${publicBaseUrl}/claims/workboard-token`;
const entra = getEntraConfig();

export const auth = betterAuth({
  appName: "Workboard MCP",
  baseURL: publicBaseUrl,
  basePath: getAuthBasePath(),
  secret: getBetterAuthSecret(),
  database: drizzleAdapter(getDb(), {
    provider: "pg",
    schema: authSchema,
  }),
  trustedOrigins: [publicBaseUrl, "http://localhost:3000"],
  account: {
    encryptOAuthTokens: true,
    storeStateStrategy: "database",
  },
  session: {
    expiresIn: 60 * 60,
    updateAge: 5 * 60,
    cookieCache: {
      enabled: true,
      maxAge: 60,
    },
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 60,
    storage: "database",
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
  },
  plugins: [
    genericOAuth({
      config: [
        microsoftEntraId({
          clientId: entra.clientId,
          clientSecret: entra.clientSecret,
          tenantId: entra.tenantId,
          scopes: ["openid", "profile", "email"],
          pkce: true,
          redirectURI: getEntraRedirectUri(),
        }),
      ],
    }),
    jwt(),
    oauthProvider({
      loginPage: "/oauth/login",
      consentPage: "/oauth/consent",
      scopes: [
        "openid",
        "profile",
        "email",
        "offline_access",
        "workboard:read",
        "workboard:write",
      ],
      validAudiences: [mcpResourceUrl, publicBaseUrl],
      accessTokenExpiresIn: 60 * 60,
      allowDynamicClientRegistration: true,
      allowUnauthenticatedClientRegistration: true,
      silenceWarnings: {
        oauthAuthServerConfig: true,
        openidConfig: true,
      },
      postLogin: {
        page: "/oauth/workboard-token",
        consentReferenceId: async ({ user }) => user.id,
        shouldRedirect: async ({ user }) => {
          return !(await hasWorkboardCredential(user.id));
        },
      },
      customAccessTokenClaims: async ({ user }) => {
        if (!user) return {};

        return {
          [workboardTokenClaim]: await hasWorkboardCredential(user.id),
        };
      },
    }),
  ],
});

export type Auth = typeof auth;
