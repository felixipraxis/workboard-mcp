import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "../../..");
const schemaPath = path.join(root, "packages/core/src/db/schema/auth.ts");
const generatedImport = `import { relations } from "drizzle-orm";`;
const rcImport = `import { relations } from "drizzle-orm/_relations";`;

const schema = await fs.readFile(schemaPath, "utf8");

if (schema.includes(rcImport)) {
  process.exit(0);
}

if (!schema.includes(generatedImport)) {
  throw new Error(
    `Could not find the Better Auth generated relations import in ${schemaPath}`,
  );
}

await fs.writeFile(schemaPath, schema.replace(generatedImport, rcImport));
