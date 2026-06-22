import { publicBaseUrlForStage, publicDomainForStage } from "./stage";

export const publicDomain = publicDomainForStage($app.stage);
export const publicBaseUrl = publicBaseUrlForStage($app.stage);

export const vpc = new sst.aws.Vpc("WorkboardVpc", {
  bastion: true,
});

export const database = new sst.aws.Aurora("WorkboardPostgres", {
  engine: "postgres",
  version: "17",
  database: "workboard_mcp",
  dataApi: true,
  scaling: {
    min: "0 ACU",
    max: "4 ACU",
    pauseAfter: "5 minutes",
  },
  dev: {
    username: "postgres",
    password: "password",
    database: "workboard_mcp",
    host: "localhost",
    port: 5432,
  },
  vpc,
});

export const betterAuthSecret = new sst.Secret("BetterAuthSecret");
export const workboardTokenEncryptionKey = new sst.Secret(
  "WorkboardTokenEncryptionKey",
);
export const entraClientId = new sst.Secret("EntraClientId");
export const entraClientSecret = new sst.Secret("EntraClientSecret");
export const entraTenantId = new sst.Secret("EntraTenantId");

export const router = new sst.aws.Router("WorkboardRouter", {
  domain: {
    name: publicDomain,
    dns: sst.cloudflare.dns(),
  },
});

export const migrator = new sst.aws.Function("WorkboardDatabaseMigrator", {
  handler: "packages/functions/src/migrator.handler",
  runtime: "nodejs22.x",
  memory: "1024 MB",
  timeout: "5 minutes",
  link: [database],
  copyFiles: [
    {
      from: "drizzle",
      to: "./drizzle",
    },
  ],
});

export const migration = $dev
  ? undefined
  : new aws.lambda.Invocation("WorkboardDatabaseMigration", {
      input: Date.now().toString(),
      functionName: migrator.name,
    });

export const api = new sst.aws.Function("WorkboardApi", {
  handler: "packages/functions/src/api.handler",
  runtime: "nodejs22.x",
  memory: "1024 MB",
  timeout: "60 seconds",
  link: [
    database,
    betterAuthSecret,
    workboardTokenEncryptionKey,
    entraClientId,
    entraClientSecret,
    entraTenantId,
  ],
  environment: {
    NODE_ENV: $dev ? "development" : "production",
    APP_STAGE: $app.stage,
    PUBLIC_BASE_URL: publicBaseUrl,
    BETTER_AUTH_URL: publicBaseUrl,
    WORKBOARD_DEFAULT_BASE_URL: "https://www.myworkboard.com/wb/apis",
    WORKBOARD_V2_BASE_URL: "https://www.myworkboard.com/wb/apis/v2",
  },
  url: {
    router: {
      instance: router,
      path: "/",
      readTimeout: "60 seconds",
      keepAliveTimeout: "10 seconds",
    },
  },
}, migration ? { dependsOn: [migration] } : undefined);
