import { spawnSync } from "node:child_process";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import ts from "typescript";
import {
  describeOperations,
  operationCatalog,
} from "../packages/api/src/application/catalog";

const TYPESCRIPT_FILE = /\.tsx?$/;
const root = process.cwd();
const destination = path.join(root, "docs/capability-inventory.json");
const queryMethods = new Set([
  "queryOptions",
  "infiniteQueryOptions",
  "mutationOptions",
]);
const exceptions: Record<string, string> = {
  "approval.get":
    "Interactive agent-connection approval; deliberately cannot be approved by an agent itself.",
  "approval.respond":
    "Interactive user authorization ceremony; not a delegable product action.",
  "auth.getSession":
    "Current transport session projection, not a product mutation.",
};
const authMappings: Record<string, string> = {
  "signUp.email": "Interactive account registration",
  "signIn.email": "Interactive sign-in",
  "signIn.social": "Interactive OAuth sign-in",
  signInSocial: "Interactive OAuth sign-in",
  signOut: "Interactive session termination",
  getSession: "Current transport session projection",
  useSession: "Current transport session projection",
  useActiveOrganization: "Current dashboard workspace selection",
  "organization.setActive": "Current dashboard workspace selection",
  setActiveOrganization: "Current dashboard workspace selection",
  "organization.list": "organization.list",
  listOrganizations: "organization.list",
  getFullOrganization: "organization.get",
  getAgentConfiguration: "Agent protocol capability discovery",
  embedAuthSession: "Existing SDK authentication ceremony",
};
const references = new Map<string, Set<string>>();
const authReferences = new Map<string, Set<string>>();
const serverActions: string[] = [];
const databaseImports: { file: string; module: string; symbols: string[] }[] =
  [];
const gaps: string[] = [];
const operations = describeOperations();
const ids = new Set(operations.map((operation) => operation.id));
function add(target: Map<string, Set<string>>, id: string, file: string) {
  const sources = target.get(id) ?? new Set<string>();
  sources.add(file);
  target.set(id, sources);
}
async function files(directory: string): Promise<string[]> {
  const entries = await readdir(path.join(root, directory), {
    withFileTypes: true,
  });
  const result: string[] = [];
  for (const entry of entries) {
    const file = `${directory}/${entry.name}`;
    if (entry.isDirectory()) {
      result.push(...(await files(file)));
    } else if (TYPESCRIPT_FILE.test(entry.name)) {
      result.push(file);
    }
  }
  return result.sort();
}
function chain(node: ts.Expression): string[] {
  if (ts.isIdentifier(node)) {
    return [node.text];
  }
  if (ts.isPropertyAccessExpression(node)) {
    return [...chain(node.expression), node.name.text];
  }
  return [];
}
for (const file of await files("apps/application/src")) {
  const contents = await readFile(path.join(root, file), "utf8");
  const source = ts.createSourceFile(
    file,
    contents,
    ts.ScriptTarget.Latest,
    true
  );
  if (contents.includes('"use server"') || contents.includes("'use server'")) {
    serverActions.push(file);
  }
  function visit(node: ts.Node) {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier) &&
      !node.importClause?.isTypeOnly
    ) {
      const module = node.moduleSpecifier.text;
      if (
        [
          "@userbubble/db",
          "@userbubble/db/client",
          "@userbubble/db/queries",
        ].includes(module)
      ) {
        const bindings = node.importClause?.namedBindings;
        const symbols =
          bindings && ts.isNamedImports(bindings)
            ? bindings.elements
                .filter((item) => !item.isTypeOnly)
                .map((item) => item.propertyName?.text ?? item.name.text)
            : ["*"];
        if (symbols.length) {
          databaseImports.push({ file, module, symbols: symbols.sort() });
        }
      }
    }

    if (ts.isCallExpression(node)) {
      const parts = chain(node.expression);
      if (
        parts[0] === "trpc" &&
        parts.length === 4 &&
        queryMethods.has(parts[3] ?? "")
      ) {
        const id = `${parts[1]}.${parts[2]}`;
        add(references, id, file);
        if (!(ids.has(id) || exceptions[id])) {
          gaps.push(`${file}: unmapped dashboard operation ${id}`);
        }
      }
      if (
        parts[0] === "authClient" ||
        (parts[0] === "auth" && parts[1] === "api")
      ) {
        const id = parts.slice(parts[0] === "authClient" ? 1 : 2).join(".");
        add(authReferences, id, file);
        if (!authMappings[id]) {
          gaps.push(`${file}: unclassified direct auth call ${id}`);
        }
      }
      // Server actions invoke the same tRPC caller rather than query options.
      if (
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isPropertyAccessExpression(node.expression.expression)
      ) {
        const parent = node.expression.expression;
        if (parent.expression.getText(source) === "(await caller())") {
          const id = `${parent.name.text}.${node.expression.name.text}`;
          add(references, id, file);
          if (!ids.has(id)) {
            gaps.push(`${file}: unmapped server action ${id}`);
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
}
const report = {
  scope:
    "Application source call-site inventory. This detects declared tRPC, Better Auth and server-action paths; it does not prove behavior, authorization, dynamic-call coverage or visual completion.",
  operations: operations
    .map(({ id, access, readOnly, destructive, outputSchema }) => ({
      id,
      access,
      readOnly,
      destructive,
      outputValidated: outputSchema !== null,
      effectInput: Boolean(operationCatalog[id]?.inputContract),
      dashboardSources: [...(references.get(id) ?? [])].sort(),
      verification:
        "Behavior and cross-interface evidence must be reviewed separately; catalog presence is not acceptance coverage.",
    }))
    .sort((a, b) => a.id.localeCompare(b.id)),
  interactiveAndSessionReads: Object.entries(exceptions).map(
    ([id, reason]) => ({
      id,
      reason,
      sources: [...(references.get(id) ?? [])].sort(),
    })
  ),
  directAuthCalls: [...authReferences]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([id, sources]) => ({
      id,
      classification: authMappings[id] ?? "UNMAPPED",
      sources: [...sources].sort(),
    })),
  serverActionFiles: serverActions.sort(),
  directDatabaseImportsRequiringReview: databaseImports,
};
const existing = await readFile(destination, "utf8")
  .then((value) => JSON.parse(value) as unknown)
  .catch(() => null);
const serialized = `${JSON.stringify(report, null, 2)}\n`;
if (process.argv.includes("--write")) {
  const formatted = spawnSync(
    "pnpm",
    ["exec", "biome", "format", `--stdin-file-path=${destination}`],
    { input: serialized, encoding: "utf8" }
  );
  if (formatted.status !== 0) {
    throw new Error(formatted.stderr);
  }
  await writeFile(destination, formatted.stdout);
} else if (JSON.stringify(existing) !== JSON.stringify(report)) {
  gaps.push(
    "Inventory differs from source. Run pnpm capabilities:generate and review the diff."
  );
}
if (gaps.length) {
  process.stderr.write(`${gaps.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Checked ${operations.length} shared operations, ${references.size} dashboard/server-action operations, and ${authReferences.size} direct auth call types.\n`
  );
}
