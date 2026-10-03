import { createRequire } from "node:module";
import { afterEach, expect, it, vi } from "vitest";

const require = createRequire(import.meta.url);
const { hooks } = require("../.pnpmfile.cjs");
afterEach(() => vi.unstubAllEnvs());

it("resolves all Pro styles to free aliases without a registry token", () => {
  vi.stubEnv("HUGEICONS_TOKEN", "");
  const config = hooks.updateConfig({ overrides: { vite: "7.1.12" } });
  expect(config.overrides).toEqual({
    vite: "7.1.12",
    "@hugeicons-pro/core-bulk-rounded": "npm:@hugeicons/core-free-icons@^3.0.0",
    "@hugeicons-pro/core-duotone-rounded":
      "npm:@hugeicons/core-free-icons@^3.0.0",
    "@hugeicons-pro/core-solid-rounded":
      "npm:@hugeicons/core-free-icons@^3.0.0",
  });
});

it("selects Pro v4 with a token without copying the credential into dependency metadata", () => {
  vi.stubEnv("HUGEICONS_TOKEN", "test-token-not-a-real-credential");
  const config = hooks.updateConfig({});
  expect(Object.values(config.overrides)).toEqual([
    "^4.0.0",
    "^4.0.0",
    "^4.0.0",
  ]);
  expect(JSON.stringify(config.overrides)).not.toContain("test-token");
});
