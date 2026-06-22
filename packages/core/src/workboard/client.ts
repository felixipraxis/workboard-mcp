import { getWorkboardBaseUrl } from "../config";
import type { WorkboardCredential } from "../db/workboard-token";
import type {
  WorkboardOperation,
  WorkboardToolInput,
  WorkboardToolOutput,
} from "./types";

export class WorkboardApiError extends Error {
  constructor(
    message: string,
    readonly output: WorkboardToolOutput,
  ) {
    super(message);
    this.name = "WorkboardApiError";
  }
}

export async function callWorkboardOperation(input: {
  operation: WorkboardOperation;
  args: WorkboardToolInput;
  credential: WorkboardCredential;
  signal?: AbortSignal;
}): Promise<WorkboardToolOutput> {
  const url = buildUrl(input.operation, input.args, input.credential);
  const headers = new Headers();
  headers.set("Accept", "application/json");

  for (const [key, value] of Object.entries(input.args.headers ?? {})) {
    if (value === undefined || value === null) continue;
    headers.set(key, String(value));
  }

  headers.set("Authorization", `Bearer ${input.credential.token}`);

  const init: RequestInit = {
    method: input.operation.method,
    headers,
    signal: input.signal,
  };

  if (input.args.body !== undefined) {
    headers.set("Content-Type", input.operation.contentType ?? "application/json");
    init.body =
      input.operation.contentType === "application/json" ||
      input.operation.contentType === undefined
        ? JSON.stringify(input.args.body)
        : String(input.args.body);
  }

  const response = await fetch(url, init);
  const output = await responseToOutput(response, url.toString());

  if (!response.ok) {
    throw new WorkboardApiError(
      `Workboard ${input.operation.method} ${input.operation.path} failed with ${response.status}`,
      output,
    );
  }

  return output;
}

export async function verifyWorkboardToken(input: {
  token: string;
  baseUrl?: string;
  signal?: AbortSignal;
}) {
  const output = await callWorkboardOperation({
    operation: {
      name: "workboard_v1_get_user",
      version: "v1",
      method: "GET",
      path: "/user",
      title: "Verify Workboard token",
      description: "GET /user",
      tags: ["User"],
      requiredScope: "workboard:read",
      sdkMethodName: "getUser",
      inputSchema: {
        type: "object",
        additionalProperties: false,
        properties: {},
      },
      outputSchema: {
        type: "object",
        additionalProperties: true,
        properties: {},
      },
      annotations: {
        title: "Verify Workboard token",
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    args: {},
    credential: {
      userId: "__verification__",
      token: input.token,
      baseUrl: input.baseUrl ?? getWorkboardBaseUrl("v1"),
      v2BaseUrl: getWorkboardBaseUrl("v2"),
      lastVerifiedAt: null,
    },
    signal: input.signal,
  });

  return output;
}

function buildUrl(
  operation: WorkboardOperation,
  args: WorkboardToolInput,
  credential: WorkboardCredential,
) {
  const base =
    operation.version === "v2"
      ? credential.v2BaseUrl || getWorkboardBaseUrl("v2")
      : credential.baseUrl || getWorkboardBaseUrl("v1");
  let pathname = operation.path;

  for (const [key, value] of Object.entries(args.path ?? {})) {
    pathname = pathname.replace(
      `{${key}}`,
      encodeURIComponent(String(value)),
    );
  }

  const url = new URL(`${base.replace(/\/$/, "")}${pathname}`);
  for (const [key, value] of Object.entries(args.query ?? {})) {
    appendQueryValue(url.searchParams, key, value);
  }

  return url;
}

function appendQueryValue(params: URLSearchParams, key: string, value: unknown) {
  if (value === undefined || value === null) return;

  if (Array.isArray(value)) {
    for (const item of value) appendQueryValue(params, key, item);
    return;
  }

  if (typeof value === "object") {
    params.append(key, JSON.stringify(value));
    return;
  }

  params.append(key, String(value));
}

async function responseToOutput(
  response: Response,
  url: string,
): Promise<WorkboardToolOutput> {
  const headers = Object.fromEntries(response.headers.entries());
  const text = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  const body =
    text.length === 0
      ? undefined
      : contentType.includes("json")
        ? safeJson(text)
        : text;

  return {
    ok: response.ok,
    status: response.status,
    url,
    headers,
    ...(body !== undefined ? { body } : {}),
  };
}

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
