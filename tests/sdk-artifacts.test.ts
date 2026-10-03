import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";

const COMMONJS_EXTENSION = /\.cjs$/;
const execute = promisify(execFile);
describe("built SDK package contracts", () => {
  for (const name of ["core", "web", "legacy"]) {
    it(`loads ${name} using both Node ESM and CommonJS exports`, async () => {
      const directory =
        name === "legacy" ? resolve("packages/sdk") : resolve("sdks", name);
      const pkg = JSON.parse(
        await readFile(`${directory}/package.json`, "utf8")
      );
      const exported = {
        web: "Userbubble",
        core: "identify",
        legacy: "UserbubbleSDK",
      }[name];
      for (const entry of Object.values(pkg.exports) as {
        import: string;
        require: string;
      }[]) {
        const { stdout } = await execute(process.execPath, [
          "--input-type=module",
          "-e",
          `import { createRequire } from 'node:module'; const esm = await import(${JSON.stringify(resolve(directory, entry.import))}); const cjs = createRequire(import.meta.url)(${JSON.stringify(resolve(directory, entry.require))}); if (!Object.keys(esm).length || !Object.keys(cjs).length) throw Error('Empty exports'); console.log(JSON.stringify(JSON.stringify(Object.keys(esm).sort()) === JSON.stringify(Object.keys(cjs).sort())));`,
        ]);
        expect(stdout.trim()).toBe("true");
      }
      const { stdout: exportedType } = await execute(process.execPath, [
        "-e",
        `const sdk = require(${JSON.stringify(directory)}); console.log(typeof sdk[${JSON.stringify(exported)}]);`,
      ]);
      expect(exportedType.trim()).toBe(name === "web" ? "object" : "function");
    });
  }
  it("does not ship build-only TypeScript configuration as an SDK runtime dependency", async () => {
    for (const name of ["core", "web", "react-native"]) {
      const pkg = JSON.parse(
        await readFile(`sdks/${name}/package.json`, "utf8")
      );
      expect(pkg.dependencies?.["@userbubble/tsconfig"]).toBeUndefined();
      expect(pkg.exports["."].require).toMatch(COMMONJS_EXTENSION);
    }
  });
});

it.each(["custom", "expo", "async-storage"])(
  "loads the React Native artifact with only %s storage available",
  async (storage) => {
    const { stdout } = await execute(process.execPath, [
      "-e",
      `
      const Module = require("node:module");
      const original = Module._load;
      const effects = [];
      const loaded = [];
      let reads = 0;
      const adapter = {
        getItem: async () => { reads++; return null; },
        setItem: async () => {}, removeItem: async () => {}, clear: async () => {},
      };
      Module._load = function(name, ...args) {
        if (name === "react") return {
          createContext: () => ({Provider: {}}),
          createElement: () => null,
          useState: (value) => [value, () => {}],
          useMemo: (fn) => fn(),
          useCallback: (fn) => fn,
          useEffect: (fn) => effects.push(fn),
        };
        if (name === "expo-web-browser") return {};
        if (["expo-secure-store", "@react-native-async-storage/async-storage"].includes(name)) {
          loaded.push(name);
          if (name === "expo-secure-store" && ${JSON.stringify(storage)} === "expo") {
            return {getItemAsync: adapter.getItem, setItemAsync: adapter.setItem, deleteItemAsync: adapter.removeItem};
          }
          if (name.includes("async-storage") && ${JSON.stringify(storage)} === "async-storage") {
            return {default: adapter};
          }
          throw Object.assign(new Error("Optional dependency absent"), {code: "MODULE_NOT_FOUND"});
        }
        return original.call(this, name, ...args);
      };
      const sdk = require(${JSON.stringify(resolve("sdks/react-native"))});
      if (loaded.length) throw new Error("Optional storage was eagerly imported");
      sdk.UserbubbleProvider({
        config: {apiKey: "fixture", storageType: "auto", ...(${JSON.stringify(storage)} === "custom" ? {customStorage: adapter} : {})},
        children: null,
      });
      effects.forEach((effect) => effect());
      setImmediate(() => console.log(JSON.stringify({reads, loaded})));
      `,
    ]);
    const result = JSON.parse(stdout);
    expect(result.reads).toBe(4);
    if (storage === "custom") {
      expect(result.loaded).toEqual([]);
    } else if (storage === "expo") {
      expect(result.loaded).toEqual(["expo-secure-store"]);
    } else {
      expect(result.loaded).toEqual([
        "expo-secure-store",
        "@react-native-async-storage/async-storage",
      ]);
    }
  }
);

it("rejects a missing installation key before any network request", async () => {
  const { stdout } = await execute(process.execPath, [
    "--input-type=module",
    "-e",
    `const { identify } = await import(${JSON.stringify(resolve("sdks/core/dist/index.esm.js"))});
     globalThis.fetch = () => { throw Error('Unexpected network request'); };
     for (const apiKey of ['', '   ']) {
       try { await identify({ id: 'fixture', email: 'fixture@example.test', name: 'Fixture' }, { apiKey }); throw Error('Accepted missing key'); }
       catch (error) { if (!error.message.includes('Configure an SDK installation API key')) throw error; }
     }
     console.log('validated');`,
  ]);
  expect(stdout.trim()).toBe("validated");
});
