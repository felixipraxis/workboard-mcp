import { migrate as migrateDataApi } from "drizzle-orm/aws-data-api/pg/migrator";
import { migrate as migrateNodePostgres } from "drizzle-orm/node-postgres/migrator";
import { closePool } from "@workboard-mcp/core/db/pool";
import { getDatabaseDriver, getDb } from "@workboard-mcp/core/db/drizzle";

const migrationConfig = {
  migrationsFolder: "./drizzle",
};

export const handler = async () => {
  console.log("Starting Drizzle migrations");

  try {
    const db = getDb();

    if (getDatabaseDriver() === "data-api") {
      await migrateDataApi(
        db as Parameters<typeof migrateDataApi>[0],
        migrationConfig,
      );
    } else {
      await migrateNodePostgres(
        db as Parameters<typeof migrateNodePostgres>[0],
        migrationConfig,
      );
    }

    console.log("Drizzle migrations complete");
  } finally {
    await closePool();
  }
};
