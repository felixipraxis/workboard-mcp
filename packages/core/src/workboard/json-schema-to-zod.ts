import { z } from "zod";
import type { JsonSchema } from "./types";

export function jsonSchemaToZod(schema: JsonSchema): z.ZodType {
  const converted = convert(schema);
  return schema.description ? converted.describe(schema.description) : converted;
}

function convert(schema: JsonSchema | undefined): z.ZodType {
  if (!schema || Object.keys(schema).length === 0) return z.unknown();

  if (schema.const !== undefined) return z.literal(schema.const as never);

  if (schema.enum?.length) {
    const literals = schema.enum.map((value) => z.literal(value as never));
    return literals.length === 1
      ? literals[0]!
      : z.union(
          literals as unknown as [
            z.ZodLiteral,
            z.ZodLiteral,
            ...z.ZodLiteral[],
          ],
        );
  }

  if (schema.oneOf?.length) return union(schema.oneOf);
  if (schema.anyOf?.length) return union(schema.anyOf);
  if (schema.allOf?.length) {
    return schema.allOf
      .map(convert)
      .reduce((left, right) => z.intersection(left, right));
  }

  const schemaType = Array.isArray(schema.type) ? schema.type[0] : schema.type;
  let value: z.ZodType;

  switch (schemaType) {
    case "string":
      value = withStringChecks(z.string(), schema);
      break;
    case "integer":
      value = withNumberChecks(z.number().int(), schema);
      break;
    case "number":
      value = withNumberChecks(z.number(), schema);
      break;
    case "boolean":
      value = z.boolean();
      break;
    case "array":
      value = z.array(convert(schema.items));
      break;
    case "object":
      value = objectSchema(schema);
      break;
    default:
      value = schema.properties ? objectSchema(schema) : z.unknown();
      break;
  }

  if (schema.nullable) value = value.nullable();
  if (schema.default !== undefined) value = value.default(schema.default);
  return schema.description ? value.describe(schema.description) : value;
}

function objectSchema(schema: JsonSchema) {
  const required = new Set(schema.required ?? []);
  const shape = Object.fromEntries(
    Object.entries(schema.properties ?? {}).map(([key, value]) => {
      const converted = convert(value);
      return [key, required.has(key) ? converted : converted.optional()];
    }),
  );

  let object = z.object(shape);
  if (schema.additionalProperties === true) return object.catchall(z.unknown());
  if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
    return object.catchall(convert(schema.additionalProperties));
  }
  return object.strict();
}

function union(schemas: readonly JsonSchema[]) {
  const converted = schemas.map(convert);
  if (converted.length === 0) return z.unknown();
  if (converted.length === 1) return converted[0]!;
  return z.union(converted as [z.ZodType, z.ZodType, ...z.ZodType[]]);
}

function withStringChecks(schema: z.ZodString, source: JsonSchema) {
  let value = schema;
  if (source.minLength !== undefined) value = value.min(source.minLength);
  if (source.maxLength !== undefined) value = value.max(source.maxLength);
  if (source.pattern) value = value.regex(new RegExp(source.pattern));
  return value;
}

function withNumberChecks<T extends z.ZodNumber>(schema: T, source: JsonSchema) {
  let value = schema;
  if (source.minimum !== undefined) value = value.min(source.minimum) as T;
  if (source.maximum !== undefined) value = value.max(source.maximum) as T;
  return value;
}
