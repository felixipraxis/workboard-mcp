import { afterEach, describe, expect, it, vi } from "vitest";
import type { WorkboardCredential } from "../db/workboard-token";
import type { WorkboardOperation } from "./types";

describe("Workboard API client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("verifies tokens with a direct bearer request to the configured Workboard base URL", async () => {
    vi.doMock("@api/workboard-v1", () => ({ default: {} }));
    vi.doMock("@api/workboard-v2", () => ({ default: {} }));

    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ id: 123, email: "user@example.com" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { verifyWorkboardToken } = await import("./client");

    await expect(
      verifyWorkboardToken({
        token: "wb-token",
        baseUrl: "https://workboard.example.test/wb/apis",
      }),
    ).resolves.toEqual({
      id: 123,
      email: "user@example.com",
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      URL,
      RequestInit,
    ];
    expect(url.toString()).toBe("https://workboard.example.test/wb/apis/user");
    expect(new Headers(init.headers).get("authorization")).toBe("Bearer wb-token");
    expect(init.method).toBe("GET");
  });

  it("executes generated Workboard operations through the direct fetch wrapper", async () => {
    const fetchMock = vi.fn(async () => new Response(null, { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);

    const { callWorkboardOperation } = await import("./client");

    const operation = {
      name: "v2_update_thing",
      version: "v2",
      method: "PUT",
      path: "/things/{thingId}",
      title: "Update thing",
      description: "PUT /things/{thingId}",
      tags: [],
      requiredScope: "workboard:write",
      contentType: "application/json",
      sdkMethodName: "generatedMethodIsNotUsed",
      inputSchema: { type: "object" },
      outputSchema: { type: "object" },
      annotations: {
        title: "Update thing",
        readOnlyHint: false,
        destructiveHint: true,
        idempotentHint: true,
        openWorldHint: true,
      },
    } satisfies WorkboardOperation;
    const credential = {
      userId: "user_123",
      token: "real-token",
      baseUrl: "https://workboard.example.test/wb/apis",
      v2BaseUrl: "https://workboard.example.test/wb/apis/v2",
      lastVerifiedAt: null,
    } satisfies WorkboardCredential;

    await expect(
      callWorkboardOperation({
        operation,
        credential,
        args: {
          path: { thingId: "abc 123" },
          query: { tag: ["north", "south"], filter: { active: true } },
          headers: {
            authorization: "Bearer attacker-token",
            "x-request-source": "mcp-test",
          },
          body: { name: "Updated" },
        },
      }),
    ).resolves.toEqual({});

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [
      URL,
      RequestInit,
    ];
    expect(url.toString()).toBe(
      "https://workboard.example.test/wb/apis/v2/things/abc%20123?tag=north&tag=south&filter=%7B%22active%22%3Atrue%7D",
    );
    const headers = new Headers(init.headers);
    expect(headers.get("authorization")).toBe("Bearer real-token");
    expect(headers.get("x-request-source")).toBe("mcp-test");
    expect(headers.get("content-type")).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ name: "Updated" }));
  });

  it("returns only the parsed response body for Workboard tool calls", async () => {
    const fetchMock = vi.fn(async () => {
      return Response.json({
        success: true,
        message: "",
        data: {
          totalCount: 1,
          activity: [{ ai_id: "15180100", ai_description: "Ship the fix" }],
        },
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const { callWorkboardOperation } = await import("./client");

    await expect(
      callWorkboardOperation({
        operation: {
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
        credential: {
          userId: "user_123",
          token: "real-token",
          baseUrl: "https://workboard.example.test/wb/apis",
          v2BaseUrl: "https://workboard.example.test/wb/apis/v2",
          lastVerifiedAt: null,
        },
        args: {},
      }),
    ).resolves.toEqual({
      success: true,
      message: "",
      data: {
        totalCount: 1,
        activity: [{ ai_id: "15180100", ai_description: "Ship the fix" }],
      },
    });
  });

  it("throws compact errors with parsed Workboard details and no response headers", async () => {
    const fetchMock = vi.fn(async () => {
      return Response.json(
        { success: false, message: "Invalid activity owner" },
        {
          status: 400,
          headers: {
            "set-cookie": "PHPSESSID=do-not-return",
            "x-debug": "do-not-return",
          },
        },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const { callWorkboardOperation, WorkboardApiError } = await import("./client");

    const operation = {
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
    } satisfies WorkboardOperation;

    await expect(
      callWorkboardOperation({
        operation,
        credential: {
          userId: "user_123",
          token: "real-token",
          baseUrl: "https://workboard.example.test/wb/apis",
          v2BaseUrl: "https://workboard.example.test/wb/apis/v2",
          lastVerifiedAt: null,
        },
        args: {},
      }),
    ).rejects.toMatchObject({
      name: "WorkboardApiError",
      output: {
        error: "Workboard GET /activity failed with 400",
        status: 400,
        details: { success: false, message: "Invalid activity owner" },
      },
    } satisfies Partial<InstanceType<typeof WorkboardApiError>>);
  });
});
