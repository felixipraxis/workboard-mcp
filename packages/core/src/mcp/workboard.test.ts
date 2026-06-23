import { afterEach, describe, expect, it, vi } from "vitest";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

describe("Workboard MCP tools", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("returns only the Workboard response body to MCP clients", async () => {
    const handlerRef: {
      current?: (args: unknown, extra: Record<string, unknown>) => Promise<unknown>;
    } = {};
    const registerTool = vi.fn((_name, _config, handler) => {
      handlerRef.current = handler;
    });
    const output = {
      success: true,
      message: "",
      data: {
        totalCount: 1,
        activity: [{ ai_id: "15180100", ai_description: "Ship the fix" }],
      },
    };

    vi.doMock("../db/workboard-token", () => ({
      getWorkboardCredential: vi.fn(async () => ({
        userId: "user_123",
        token: "workboard-token",
        baseUrl: "https://workboard.example.test/wb/apis",
        v2BaseUrl: "https://workboard.example.test/wb/apis/v2",
        lastVerifiedAt: null,
      })),
    }));
    vi.doMock("../workboard/client", () => ({
      callWorkboardOperation: vi.fn(async () => output),
      WorkboardApiError: class WorkboardApiError extends Error {},
    }));
    vi.doMock("../workboard/json-schema-to-zod", () => ({
      jsonSchemaToZod: vi.fn(() => ({})),
    }));
    vi.doMock("../workboard/operations", () => ({
      workboardOperations: [
        {
          name: "v1_get_activity",
          version: "v1",
          method: "GET",
          path: "/activity",
          title: "Get activity",
          description: "GET /activity",
          tags: [],
          requiredScope: "workboard:read",
          inputSchema: { type: "object" },
          outputSchema: { type: "object" },
          annotations: {
            title: "Get activity",
            readOnlyHint: true,
            destructiveHint: false,
            idempotentHint: true,
            openWorldHint: true,
          },
        },
      ],
    }));

    const { registerWorkboardTools } = await import("./workboard");
    registerWorkboardTools({ registerTool } as unknown as McpServer);

    expect(registerTool).toHaveBeenCalledWith(
      "v1_get_activity",
      expect.objectContaining({
        inputSchema: {},
      }),
      expect.any(Function),
    );
    expect(registerTool.mock.calls[0]?.[1]).not.toHaveProperty("outputSchema");

    const result = await handlerRef.current?.(
      {},
      {
        authInfo: {
          scopes: ["workboard:read"],
          extra: { userId: "user_123" },
        },
        signal: undefined,
      },
    );

    expect(result).toEqual({
      structuredContent: output,
      content: [
        {
          type: "text",
          text: JSON.stringify(output, null, 2),
        },
      ],
    });
    expect(JSON.stringify(result)).not.toContain("\"headers\"");
    expect(JSON.stringify(result)).not.toContain("\"url\"");
    expect(JSON.stringify(result)).not.toContain("\"ok\"");
    expect(JSON.stringify(result)).not.toContain("\"status\"");
  });
});
