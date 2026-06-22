import "dotenv/config";
import { defineConfig } from "drizzle-kit";
import { getDatabaseConfig } from "./packages/core/src/config";

export default defineConfig({
  dialect: "postgresql",
  schema: [
    "./packages/core/src/db/schema/auth.ts",
    "./packages/core/src/db/schema/app.ts",
  ],
  out: "./drizzle",
  dbCredentials: getDatabaseConfig(),
  verbose: true,
  strict: true,
});
