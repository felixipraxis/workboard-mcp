import { publicBaseUrlForStage, publicDomainForStage } from "./stage";

export const publicDomain = publicDomainForStage($app.stage);
export const publicBaseUrl = $dev
  ? "http://localhost:3000"
  : publicBaseUrlForStage($app.stage);
export const originDomain = `origin.${publicDomain}`;

export const vpc = new sst.aws.Vpc("WorkboardVpc", {
  bastion: true,
});

export const database = new sst.aws.Aurora("WorkboardPostgres", {
  engine: "postgres",
  version: "17",
  database: "workboard_mcp",
  dataApi: true,
  scaling: {
    min: "1 ACU",
    max: "10 ACU",
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

export const cluster = new sst.aws.Cluster("WorkboardCluster", { vpc });

export const api = new sst.aws.Service(
  "WorkboardApi",
  {
    cluster,
    cpu: "1 vCPU",
    memory: "2 GB",
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
    image: {
      context: ".",
      dockerfile: "packages/functions/Dockerfile",
    },
    loadBalancer: {
      ...($dev
        ? {}
        : {
            domain: {
              name: originDomain,
              dns: sst.cloudflare.dns(),
            },
          }),
      rules: $dev
        ? [{ listen: "80/http", forward: "3000/http" }]
        : [
            { listen: "80/http", redirect: "443/https" },
            { listen: "443/https", forward: "3000/http" },
          ],
      health: {
        "3000/http": {
          path: "/health",
          successCodes: "200",
        },
      },
    },
    health: {
      command: [
        "CMD-SHELL",
        "node -e \"fetch('http://localhost:3000/health').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))\"",
      ],
      interval: "30 seconds",
      timeout: "5 seconds",
      retries: 3,
      startPeriod: "30 seconds",
    },
    dev: {
      command: "npm run dev",
      url: "http://localhost:3000",
    },
  },
  migration ? { dependsOn: [migration] } : undefined,
);

export const router = $dev
  ? undefined
  : new sst.aws.Router("WorkboardRouter", {
      domain: {
        name: publicDomain,
        dns: sst.cloudflare.dns(),
      },
      routes: {
        "/*": {
          url: api.url,
        },
      },
      waf: {
        rateLimitPerIp: 2000,
        managedRules: {
          coreRuleSet: true,
          knownBadInputs: true,
          sqlInjection: true,
        },
        logging: {
          include: "blocked",
          retention: "1 week",
        },
      },
    });

export const apiUrl = router?.url ?? api.url;
