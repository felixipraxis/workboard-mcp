import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getWorkboardCredential } from "../db/workboard-token";
import { callWorkboardOperation, WorkboardApiError } from "../workboard/client";
import { jsonSchemaToZod } from "../workboard/json-schema-to-zod";
import { workboardOperations } from "../workboard/operations";
import type {
  WorkboardOperation,
  WorkboardScope,
  WorkboardToolInput,
} from "../workboard/types";

export function registerWorkboardTools(server: McpServer) {
  for (const operation of workboardOperations) {
    server.registerTool(
      operation.name,
      {
        title: operation.title,
        description: operation.description,
        inputSchema: jsonSchemaToZod(operation.inputSchema),
        outputSchema: jsonSchemaToZod(operation.outputSchema),
        annotations: operation.annotations,
        _meta: {
          "workboard/version": operation.version,
          "workboard/method": operation.method,
          "workboard/path": operation.path,
          "workboard/requiredScope": operation.requiredScope,
        },
      },
      async (args, extra) => {
        const authInfo = extra.authInfo;
        const userId = authInfo?.extra?.userId;

        if (typeof userId !== "string" || !userId) {
          return toolError("Missing authenticated Better Auth user context.");
        }

        if (!hasRequiredScope(authInfo?.scopes ?? [], operation.requiredScope)) {
          return toolError(`Missing required OAuth scope: ${operation.requiredScope}`);
        }

        const credential = await getWorkboardCredential(userId);
        if (!credential) {
          return toolError(
            "No Workboard token is stored for this user. Re-run the OAuth flow and add a personal Workboard token.",
          );
        }

        try {
          const output = await callWorkboardOperation({
            operation: operation as WorkboardOperation,
            args: args as WorkboardToolInput,
            credential,
            signal: extra.signal,
          });

          return {
            structuredContent: output,
            content: [
              {
                type: "text" as const,
                text: formatToolText(output.body ?? output),
              },
            ],
          };
        } catch (error) {
          if (error instanceof WorkboardApiError) {
            return {
              isError: true,
              structuredContent: error.output,
              content: [
                {
                  type: "text" as const,
                  text: formatToolText(error.output.body ?? error.output),
                },
              ],
            };
          }

          throw error;
        }
      },
    );
  }
}

function hasRequiredScope(scopes: readonly string[], required: WorkboardScope) {
  if (required === "workboard:read") {
    return scopes.includes("workboard:read") || scopes.includes("workboard:write");
  }

  return scopes.includes(required);
}

function toolError(message: string) {
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: message,
      },
    ],
  };
}

function formatToolText(value: unknown) {
  if (typeof value === "string") return value;
  return JSON.stringify(value, null, 2);
}
