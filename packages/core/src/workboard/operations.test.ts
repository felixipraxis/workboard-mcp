import { describe, expect, it } from "vitest";
import { workboardOperations } from "./operations";

describe("workboardOperations", () => {
  it("wraps every documented Workboard v1 and v2 operation", () => {
    expect(workboardOperations).toHaveLength(63);
    expect(workboardOperations.filter((operation) => operation.version === "v1")).toHaveLength(45);
    expect(workboardOperations.filter((operation) => operation.version === "v2")).toHaveLength(18);
  });

  it("has stable MCP metadata for every generated tool", () => {
    const names = new Set<string>();

    for (const operation of workboardOperations) {
      expect(operation.name).toMatch(/^workboard_v[12]_[a-z0-9_-]+$/);
      expect(names.has(operation.name)).toBe(false);
      names.add(operation.name);

      expect(operation.sdkMethodName).toEqual(expect.any(String));
      expect(operation.description).toContain(`${operation.method} ${operation.path}`);
      expect(operation.requiredScope).toMatch(/^workboard:(read|write)$/);
      expect(operation.inputSchema.type).toBe("object");
      expect(operation.outputSchema.type).toBe("object");
      expect(operation.annotations.title).toEqual(operation.title);
      expect(operation.annotations.openWorldHint).toBe(true);
      expect(operation.annotations.readOnlyHint).toBe(operation.method === "GET");
    }
  });
});
