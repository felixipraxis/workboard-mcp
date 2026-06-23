import { describe, expect, it } from "vitest";
import type { JsonSchema } from "./types";
import { jsonSchemaToZod } from "./json-schema-to-zod";
import { workboardOperations } from "./operations";

describe("workboardOperations", () => {
  const eveConnectionPrefix = "workboard__";

  it("wraps every documented Workboard v1 and v2 operation", () => {
    expect(workboardOperations).toHaveLength(63);
    expect(workboardOperations.filter((operation) => operation.version === "v1")).toHaveLength(45);
    expect(workboardOperations.filter((operation) => operation.version === "v2")).toHaveLength(18);
  });

  it("has stable MCP metadata for every generated tool", () => {
    const names = new Set<string>();

    for (const operation of workboardOperations) {
      expect(operation.name).toMatch(/^v[12]_[a-z0-9_-]+$/);
      expect(`${eveConnectionPrefix}${operation.name}`.length).toBeLessThanOrEqual(64);
      expect(names.has(operation.name)).toBe(false);
      names.add(operation.name);

      expect(operation.sdkMethodName).toEqual(expect.any(String));
      expect(operation.description).toContain(`${operation.method} ${operation.path}`);
      expect(operation.requiredScope).toMatch(/^workboard:(read|write)$/);
      expect(operation.inputSchema.type).toBe("object");
      expect(operation.outputSchema.type).toBe("object");
      const outputSchema = operation.outputSchema as JsonSchema;
      expect(outputSchema.required).not.toEqual(["ok", "status", "url"]);
      expect(outputSchema.properties?.ok).toBeUndefined();
      expect(outputSchema.properties?.url).toBeUndefined();
      expect(outputSchema.properties?.headers).toBeUndefined();
      expect(outputSchema.properties?.body).toBeUndefined();
      expect(operation.annotations.title).toEqual(operation.title);
      expect(operation.annotations.openWorldHint).toBe(true);
      expect(operation.annotations.readOnlyHint).toBe(operation.method === "GET");
    }
  });

  it("validates the direct Workboard activity response body, not the old transport envelope", () => {
    const operation = workboardOperations.find(
      (item) => item.name === "v1_get_activity",
    );

    expect(operation).toBeDefined();
    const outputSchema = jsonSchemaToZod(operation!.outputSchema);

    expect(() =>
      outputSchema.parse({
        success: true,
        message: "",
        data: {
          totalCount: 37,
          activity: [
            {
              ai_id: "15180100",
              ai_description: "eDiary Admin SOP VV-0011102",
              ai_note: "Extra field present in real Workboard responses.",
              ai_column: { id: "416255", name: "Core Goals Sprint" },
            },
          ],
          next_page_token: "offset-token",
        },
      }),
    ).not.toThrow();
  });
});
