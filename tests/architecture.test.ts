import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import ts from "typescript";
import { expect, it } from "vitest";

const DATABASE_PACKAGE = /@userbubble\/db/;
const ASYNC_FUNCTION = /async\s/;
const SOURCE = /\.[cm]?[jt]sx?$/;
const HOSTED_EXECUTION =
  /@userbubble\/(?:ai|worker)|@ai-sdk\/|OPENAI_API_KEY|ANTHROPIC_API_KEY|api\.(?:openai|anthropic)\.com/;
const DIRECT_REPOSITORY =
  /from\s+["']@userbubble\/db(?:\/queries|\/client)?["']/;
const forbiddenDependency = (name: string) =>
  name === "ai" ||
  name.startsWith("@ai-sdk/") ||
  ["@userbubble/ai", "@userbubble/worker"].includes(name);

async function sources(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const result: string[] = [];
  for (const entry of entries) {
    const file = `${directory}/${entry.name}`;
    if (entry.isDirectory()) {
      result.push(...(await sources(file)));
    } else if (SOURCE.test(entry.name)) {
      result.push(file);
    }
  }
  return result;
}

it("keeps hosted model execution packages and imports out of runtime source", async () => {
  expect(existsSync("apps/worker")).toBe(false);
  expect(existsSync("packages/ai")).toBe(false);
  for (const parent of ["apps", "packages", "sdks"]) {
    for (const entry of await readdir(parent, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      const directory = `${parent}/${entry.name}`;
      const manifest = `${directory}/package.json`;
      if (existsSync(manifest)) {
        const pkg = JSON.parse(await readFile(manifest, "utf8"));
        const dependencies = Object.keys({
          ...pkg.dependencies,
          ...pkg.devDependencies,
          ...pkg.optionalDependencies,
        });
        expect(dependencies.filter(forbiddenDependency), manifest).toEqual([]);
      }
      if (existsSync(`${directory}/src`)) {
        for (const file of await sources(`${directory}/src`)) {
          expect(await readFile(file, "utf8"), file).not.toMatch(
            HOSTED_EXECUTION
          );
        }
      }
    }
  }
});

it("keeps SDK v1 transports behind application operations", async () => {
  for (const file of await sources("apps/application/src")) {
    expect(await readFile(file, "utf8"), file).not.toMatch(DIRECT_REPOSITORY);
  }
});

it("keeps product handlers and repositories independent of database infrastructure", async () => {
  for (const directory of [
    "packages/api/src/application",
    "packages/api/src/contracts",
  ]) {
    for (const file of await sources(directory)) {
      const source = await readFile(file, "utf8");
      expect(source, file).not.toMatch(DATABASE_PACKAGE);
      if (!file.endsWith("/runtime.ts")) {
        expect(source, file).not.toContain("runPromise");
        expect(source, file).not.toContain("/infrastructure/");
        expect(source, file).not.toMatch(ASYNC_FUNCTION);
      }
    }
  }
  for (const file of await sources(
    "packages/api/src/application/repositories"
  )) {
    const source = await readFile(file, "utf8");
    expect(source, file).not.toMatch(DIRECT_REPOSITORY);
    expect(source, file).not.toContain("/infrastructure/");
    expect(source, file).not.toContain("runPromise");
  }
});

it("keeps database modules and server Effect validation out of client components", async () => {
  for (const file of await sources("apps/application/src")) {
    const code = await readFile(file, "utf8");
    const source = ts.createSourceFile(
      file,
      code,
      ts.ScriptTarget.Latest,
      true
    );
    const clientDirective = source.statements.some(
      (statement) =>
        ts.isExpressionStatement(statement) &&
        ts.isStringLiteral(statement.expression) &&
        statement.expression.text === "use client"
    );
    if (!clientDirective) {
      continue;
    }
    for (const statement of source.statements) {
      if (
        !(
          ts.isImportDeclaration(statement) &&
          ts.isStringLiteral(statement.moduleSpecifier)
        )
      ) {
        continue;
      }
      const clause = statement.importClause;
      if (clause?.isTypeOnly) {
        continue;
      }
      const bindings = clause?.namedBindings;
      if (
        !clause?.name &&
        bindings &&
        ts.isNamedImports(bindings) &&
        bindings.elements.every((item) => item.isTypeOnly)
      ) {
        continue;
      }
      const name = statement.moduleSpecifier.text;
      expect(name.startsWith("@userbubble/db"), file).toBe(false);
      expect(name.startsWith("@userbubble/api"), file).toBe(false);
      expect(name === "effect" || name.startsWith("effect/"), file).toBe(false);
      expect(
        [
          "~/env",
          "@userbubble/validators",
          "@userbubble/validators/organization",
        ],
        file
      ).not.toContain(name);
    }
  }
});
