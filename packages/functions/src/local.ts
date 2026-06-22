import "dotenv/config";
import { serve } from "@hono/node-server";
import { app } from "./api";

const port = Number(process.env.PORT ?? 3000);

serve(
  {
    fetch: app.fetch,
    port,
  },
  (info) => {
    console.log(`Workboard MCP listening on http://localhost:${info.port}`);
  },
);
