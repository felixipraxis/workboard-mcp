import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const generatedPackages = ["workboard-v1", "workboard-v2"];

await Promise.all(
  generatedPackages.map((identifier) =>
    fs.rm(path.join(root, ".api/apis", identifier, "node_modules"), {
      force: true,
      recursive: true,
    }),
  ),
);
