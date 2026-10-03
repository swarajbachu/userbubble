import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const source = (path: string) => fileURLToPath(new URL(path, import.meta.url));
export default defineConfig({
  resolve: {
    alias: [
      {
        find: "@userbubble/client",
        replacement: source("./packages/client/src/index.ts"),
      },
      {
        find: /^@modelcontextprotocol\/sdk\/(.*)$/,
        replacement: source(
          "./packages/cli/node_modules/@modelcontextprotocol/sdk/dist/esm/$1"
        ),
      },
      {
        find: "@userbubble/db/queries",
        replacement: source("./packages/db/src/queries.ts"),
      },
      {
        find: "@userbubble/db/schema",
        replacement: source("./packages/db/src/schema.ts"),
      },
      {
        find: "@userbubble/db/client",
        replacement: source("./packages/db/src/client.ts"),
      },
      {
        find: "@userbubble/auth",
        replacement: source("./packages/auth/src/index.ts"),
      },
    ],
  },
  test: {
    // Never let dotenv select a deployed database in a unit-test process.
    env: {
      DATABASE_URL:
        process.env.TEST_DATABASE_URL ??
        "postgresql://127.0.0.1:1/userbubble-test-unconfigured",
    },
    fileParallelism: false,
    include: ["tests/**/*.test.ts"],
    environment: "node",
  },
});
