import "dotenv/config";
import { serve } from "@hono/node-server";
import { app } from "./api";
import { closePool } from "@workboard-mcp/core/db/pool";

const port = Number(process.env.PORT ?? 3000);

const server = serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Workboard MCP listening on http://localhost:${info.port}`);
  },
);

async function shutdown(signal: NodeJS.Signals) {
  console.log(`Received ${signal}; shutting down Workboard MCP`);
  server.close(async (error) => {
    if (error) {
      console.error(error);
      process.exitCode = 1;
    }

    try {
      await closePool();
    } catch (poolError) {
      console.error(poolError);
      process.exitCode = 1;
    } finally {
      process.exit();
    }
  });
}

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
