import { Resource } from "sst";

const fallbackPublicBaseUrl = "http://localhost:3000";
const fallbackDatabaseUrl =
  "postgres://postgres:password@localhost:5432/workboard_mcp";

type LinkedResource = Record<string, unknown>;
type DatabaseConfig = {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  ssl: false | { rejectUnauthorized: false };
};
type DatabaseDataApiConfig = {
  database: string;
  resourceArn: string;
  secretArn: string;
};

function linkedResource(name: string): LinkedResource | undefined {
  try {
    return (Resource as unknown as Record<string, LinkedResource | undefined>)[
      name
    ];
  } catch {
    return undefined;
  }
}

function linkedSecret(name: string): string | undefined {
  const resource = linkedResource(name);
  const value = resource?.value;
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function isProduction() {
  return process.env.NODE_ENV === "production";
}

export function getPublicBaseUrl() {
  return (
    process.env.PUBLIC_BASE_URL ??
    process.env.BETTER_AUTH_URL ??
    fallbackPublicBaseUrl
  ).replace(/\/$/, "");
}

export function getMcpResourceUrl() {
  return `${getPublicBaseUrl()}/mcp`;
}

export function getAuthBasePath() {
  return "/api/auth";
}

export function getAuthIssuer() {
  return `${getPublicBaseUrl()}${getAuthBasePath()}`;
}

export function getEntraRedirectUri() {
  return `${getAuthIssuer()}/oauth2/callback/microsoft-entra-id`;
}

export function getWorkboardBaseUrl(version: "v1" | "v2") {
  const envName =
    version === "v1" ? "WORKBOARD_DEFAULT_BASE_URL" : "WORKBOARD_V2_BASE_URL";
  const fallback =
    version === "v1"
      ? "https://www.myworkboard.com/wb/apis"
      : "https://www.myworkboard.com/wb/apis/v2";

  return (process.env[envName] ?? fallback).replace(/\/$/, "");
}

export function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const resource = getLinkedDatabaseResource();
  if (!resource) return fallbackDatabaseUrl;

  const username = String(resource.username);
  const password = String(resource.password);
  const host = String(resource.host);
  const port = String(resource.port);
  const database = String(resource.database);

  return `postgres://${encodeURIComponent(username)}:${encodeURIComponent(
    password,
  )}@${host}:${port}/${encodeURIComponent(database)}`;
}

export function getDatabaseConfig(): DatabaseConfig {
  const resource = getLinkedDatabaseResource();
  if (resource) {
    const host = String(resource.host);

    return {
      host,
      port: Number(resource.port),
      user: String(resource.username),
      password: String(resource.password),
      database: String(resource.database),
      ssl: sslForDatabaseHost(host),
    };
  }

  return databaseConfigFromUrl(process.env.DATABASE_URL ?? fallbackDatabaseUrl);
}

export function getDatabaseDataApiConfig(): DatabaseDataApiConfig | undefined {
  const resource = getLinkedDatabaseResource();
  if (!resource) return undefined;

  const host = String(resource.host);
  if (isLocalDatabaseHost(host)) return undefined;

  const resourceArn = stringValue(resource.clusterArn);
  const secretArn = stringValue(resource.secretArn);
  if (!resourceArn || !secretArn) return undefined;

  return {
    database: String(resource.database),
    resourceArn,
    secretArn,
  };
}

export function shouldUseDatabaseDataApi() {
  return getDatabaseDataApiConfig() !== undefined;
}

function getLinkedDatabaseResource() {
  return linkedResource("WorkboardPostgres") as
    | (LinkedResource & {
        clusterArn?: unknown;
        database: unknown;
        host: unknown;
        password: unknown;
        port: unknown;
        secretArn?: unknown;
        username: unknown;
      })
    | undefined;
}

function databaseConfigFromUrl(connectionString: string): DatabaseConfig {
  const url = new URL(connectionString);
  const host = url.hostname;

  return {
    host,
    port: url.port ? Number(url.port) : 5432,
    user: decodeURIComponent(url.username || "postgres"),
    password: decodeURIComponent(url.password || "password"),
    database: decodeURIComponent(url.pathname.replace(/^\//, "")),
    ssl: sslForDatabaseHost(host),
  };
}

function sslForDatabaseHost(host: string): DatabaseConfig["ssl"] {
  return isLocalDatabaseHost(host) ? false : { rejectUnauthorized: false };
}

function isLocalDatabaseHost(host: string) {
  return host === "localhost" || host === "127.0.0.1";
}

function stringValue(value: unknown) {
  if (typeof value !== "string") return undefined;
  if (value.length === 0 || value === "placeholder") return undefined;
  return value;
}

export function getSecret(name: string, devFallback: string) {
  const envValue = process.env[name];
  if (envValue && envValue.length > 0) return envValue;

  const resourceValue = linkedSecret(nameToResourceName(name));
  if (resourceValue) return resourceValue;

  if (!isProduction()) return devFallback;

  throw new Error(`Missing required secret ${name}`);
}

function nameToResourceName(name: string) {
  switch (name) {
    case "BETTER_AUTH_SECRET":
      return "BetterAuthSecret";
    case "WORKBOARD_TOKEN_ENCRYPTION_KEY":
      return "WorkboardTokenEncryptionKey";
    case "ENTRA_CLIENT_ID":
      return "EntraClientId";
    case "ENTRA_CLIENT_SECRET":
      return "EntraClientSecret";
    case "ENTRA_TENANT_ID":
      return "EntraTenantId";
    default:
      return name;
  }
}

export function getBetterAuthSecret() {
  return getSecret(
    "BETTER_AUTH_SECRET",
    "local-better-auth-secret-change-before-shipping-000000",
  );
}

export function getWorkboardTokenEncryptionKey() {
  return getSecret(
    "WORKBOARD_TOKEN_ENCRYPTION_KEY",
    "local-workboard-token-encryption-key-change-before-shipping-000000",
  );
}

export function getEntraConfig() {
  return {
    clientId: getSecret("ENTRA_CLIENT_ID", "local-entra-client-id"),
    clientSecret: getSecret("ENTRA_CLIENT_SECRET", "local-entra-client-secret"),
    tenantId: getSecret("ENTRA_TENANT_ID", "organizations"),
  };
}
