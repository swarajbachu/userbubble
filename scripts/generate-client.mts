import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { compile, type JSONSchema } from "json-schema-to-typescript";
import { describeOperations } from "../packages/api/src/application/catalog";

const destination = "packages/client/src/operations.ts";
const blocks = [
  "/** Generated from the Effect operation catalog. Run pnpm client:generate. */",
  "/** biome-ignore-all lint/style/noNamespace lint/style/useConsistentTypeDefinitions: generated type-only namespaces isolate schema definitions */",
];
const entries: string[] = [];
for (const operation of describeOperations()) {
  const name = operation.id.replaceAll(".", "_");
  for (const [kind, schema] of [
    ["Input", operation.inputSchema],
    ["Output", operation.outputSchema],
  ] as const) {
    if (!schema) {
      throw new Error(`Missing ${kind} for ${operation.id}`);
    }
    const declaration = await compile(
      { ...schema, title: kind } as JSONSchema,
      kind,
      { bannerComment: "", additionalProperties: true, unknownAny: true }
    );
    blocks.push(`export namespace ${name}_${kind} {\n${declaration}\n}`);
  }
  entries.push(
    `${JSON.stringify(operation.id)}: { input: ${name}_Input.Input; output: ${name}_Output.Output; supportsIdempotency: ${operation.supportsIdempotency} };`
  );
}
blocks.push(`export interface OperationTypes {\n${entries.join("\n")}\n}`);
blocks.push("export type OperationId = keyof OperationTypes;");
blocks.push(
  "export type OperationInput<K extends OperationId> = OperationTypes[K]['input'];"
);
blocks.push(
  "export type OperationOutput<K extends OperationId> = OperationTypes[K]['output'];"
);
const result = spawnSync(
  "pnpm",
  ["exec", "biome", "format", `--stdin-file-path=${destination}`],
  {
    input: blocks.join("\n\n"),
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  }
);
if (result.status !== 0) {
  throw new Error(result.stderr);
}
if (process.argv.includes("--write")) {
  await writeFile(destination, result.stdout);
} else if ((await readFile(destination, "utf8")) !== result.stdout) {
  throw new Error("Client types are stale. Run pnpm client:generate.");
}
console.log(
  `Verified typed client contracts for ${entries.length} operations.`
);
