import type { ToolAnnotations } from "@modelcontextprotocol/sdk/types.js";

export type WorkboardVersion = "v1" | "v2";
export type WorkboardScope = "workboard:read" | "workboard:write";

export interface WorkboardOperation {
  name: string;
  version: WorkboardVersion;
  method: string;
  path: string;
  title: string;
  description: string;
  tags: readonly string[];
  requiredScope: WorkboardScope;
  contentType?: string;
  sdkMethodName?: string;
  inputSchema: JsonSchema;
  outputSchema: JsonSchema;
  annotations: ToolAnnotations;
}

export type JsonSchema = {
  type?: string | readonly string[];
  description?: string;
  enum?: readonly unknown[];
  const?: unknown;
  example?: unknown;
  examples?: readonly unknown[] | Record<string, unknown>;
  format?: string;
  readOnly?: boolean;
  writeOnly?: boolean;
  deprecated?: boolean;
  oneOf?: readonly JsonSchema[];
  anyOf?: readonly JsonSchema[];
  allOf?: readonly JsonSchema[];
  items?: JsonSchema;
  properties?: Record<string, JsonSchema>;
  required?: readonly string[];
  additionalProperties?: boolean | JsonSchema;
  default?: unknown;
  nullable?: boolean;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
};

export interface WorkboardToolInput {
  path?: Record<string, unknown>;
  query?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  body?: unknown;
}

export type WorkboardToolOutput = Record<string, unknown>;

export interface WorkboardToolError extends Record<string, unknown> {
  error: string;
  status: number;
  details?: unknown;
}
