import pg from "pg";
import { getDatabaseConfig } from "../config";

const { Pool } = pg;

let pool: pg.Pool | undefined;

export function getPool() {
  if (!pool) {
    pool = new Pool({
      ...getDatabaseConfig(),
      max: 1,
      idleTimeoutMillis: 1_000,
      connectionTimeoutMillis: 30_000,
    });
  }

  return pool;
}

export async function closePool() {
  if (!pool) return;
  await pool.end();
  pool = undefined;
}
