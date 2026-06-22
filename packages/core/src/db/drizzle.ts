import { RDSDataClient } from "@aws-sdk/client-rds-data";
import { drizzle as drizzleDataApi } from "drizzle-orm/aws-data-api/pg";
import { drizzle as drizzleNodePostgres } from "drizzle-orm/node-postgres";
import { getDatabaseDataApiConfig } from "../config";
import { getPool } from "./pool";

type DatabaseDriver = "data-api" | "node-postgres";
type Database = ReturnType<typeof createDb>["db"];

let db: Database | undefined;
let driver: DatabaseDriver | undefined;

export function getDb() {
  if (!db) {
    const created = createDb();
    db = created.db;
    driver = created.driver;
  }

  return db;
}

export function getDatabaseDriver() {
  if (!driver) getDb();
  return driver;
}

function createDb() {
  const dataApi = getDatabaseDataApiConfig();

  if (dataApi) {
    return {
      driver: "data-api" as const,
      db: drizzleDataApi({
        client: new RDSDataClient({}),
        database: dataApi.database,
        resourceArn: dataApi.resourceArn,
        secretArn: dataApi.secretArn,
      }),
    };
  }

  return {
    driver: "node-postgres" as const,
    db: drizzleNodePostgres({
      client: getPool(),
    }),
  };
}
