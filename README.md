# Workboard MCP

Serverless MCP server for Workboard, built with SST, Hono, Better Auth, Postgres, Drizzle, and generated `npx api` Workboard clients.

## What Is Included

- SST `aws.Function` Hono API behind an SST `aws.Router` CloudFront distribution.
- Cloudflare DNS for `workboard-mcp.praxismedicines.dev` in production and `<stage>.workboard-mcp.praxismedicines.dev` for non-production stages.
- Aurora PostgreSQL Serverless v2 with `min: 0 ACU` and local Postgres dev settings.
- Drizzle ORM and Drizzle Kit migrations for Better Auth tables and application tables, with schemas split under `packages/core/src/db/schema/`.
- A deploy-time SST migrator Lambda that runs checked-in Drizzle migrations during non-dev deploys.
- Better Auth OAuth Provider for MCP OAuth 2.1, with internal Entra login through the generic OAuth plugin.
- A post-login Workboard token step that verifies the personal Workboard token and stores it encrypted with AES-256-GCM.
- Generated Workboard v1 and v2 SDKs under `.api/apis/*`, plus generated MCP tool metadata for all 63 documented operations.

## Local Setup

```bash
npm install
cp .env.example .env
npm run generate:workboard
```

Fill in `.env` with Entra credentials and strong local secrets.

Start Postgres:

```bash
npm run db:local
```

In another terminal, apply migrations and start Hono:

```bash
npm run migrate
npm run dev
```

The local API listens on `http://localhost:3000`.

## Useful Commands

```bash
npm run generate:workboard  # refresh Workboard specs, npx api SDKs, and MCP tool metadata
npm run auth:generate       # refresh the generated Better Auth Drizzle schema
npm run db:generate         # refresh auth schema, then create a Drizzle migration
npm run db:check            # verify Drizzle migration snapshots and SQL
npm run migrate             # apply Drizzle migrations for auth and app tables
npm run typecheck
npm test
```

## Deploy Prerequisites

Set SST secrets:

```bash
npx sst secret set BetterAuthSecret "..."
npx sst secret set WorkboardTokenEncryptionKey "..."
npx sst secret set EntraClientId "..."
npx sst secret set EntraClientSecret "..."
npx sst secret set EntraTenantId "..."
```

Append `--stage <stage>` to those commands when preparing a non-default SST stage.

Set Cloudflare provider environment variables before deploy:

```bash
export CLOUDFLARE_API_TOKEN=...
export CLOUDFLARE_DEFAULT_ACCOUNT_ID=...
```

Deploy:

```bash
npx sst deploy
```

Router URLs are stage-aware. `production` and `prod` use `https://workboard-mcp.praxismedicines.dev`; every other SST stage uses `https://<stage>.workboard-mcp.praxismedicines.dev` after the stage name is normalized for DNS.

Register an Entra redirect URI for each stage host: `<public-base-url>/api/auth/oauth2/callback/microsoft-entra-id`.

Non-dev deploys run the `WorkboardDatabaseMigrator` Lambda before the API update. It copies the checked-in `drizzle/` folder into the function package and applies unapplied migrations with Drizzle's node-postgres migrator. Drizzle migration metadata is stored in `drizzle.__drizzle_migrations`; the application and auth tables are created by the SQL migrations in the default PostgreSQL schema.

## OAuth Flow

MCP clients discover `/.well-known/oauth-protected-resource`, then use Better Auth’s OAuth Provider endpoints under `/api/auth/oauth2/*`.

The user flow is:

1. MCP OAuth redirects to `/oauth/login`.
2. `/oauth/login` starts generic OAuth with Microsoft Entra (`microsoft-entra-id`).
3. After Entra, Better Auth resumes `/api/auth/oauth2/authorize`.
4. If no Workboard token is stored, Better Auth redirects to `/oauth/workboard-token`.
5. The token is verified with Workboard `GET /user`, encrypted, and stored in Postgres.
6. Better Auth continues to `/oauth/consent`, then issues the OAuth code/token for the MCP client.

## References

- Workboard API docs: https://apidocs.myworkboard.com/
- SST Aurora: https://sst.dev/docs/component/aws/aurora/
- SST Router and custom domains: https://sst.dev/docs/component/aws/router/
- Better Auth OAuth Provider: https://www.better-auth.com/docs/plugins/oauth-provider
- Better Auth Drizzle adapter: https://www.better-auth.com/docs/adapters/drizzle
- Drizzle Kit migrations: https://orm.drizzle.team/docs/drizzle-kit-migrate
- SST Drizzle migrations in CI/CD: https://sst.dev/docs/examples/#drizzle-migrations-in-cicd
- MCP tools: https://modelcontextprotocol.io/specification/draft/server/tools
