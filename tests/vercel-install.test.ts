import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { expect, it } from "vitest";

it("all Vercel projects select the requested icon edition and propagate install failures", () => {
  const bin = mkdtempSync(join(tmpdir(), "userbubble-install-"));
  const root = resolve(import.meta.dirname, "..");
  try {
    writeFileSync(
      join(bin, "pnpm"),
      `#!/usr/bin/env node
console.log(JSON.stringify({args: process.argv.slice(2), cwd: process.cwd()}));
process.exit(Number(process.env.TEST_INSTALL_STATUS || 0));
`,
      { mode: 0o755 }
    );
    for (const app of ["application", "docs", "landing"]) {
      const cwd = join(root, "apps", app);
      const config = JSON.parse(readFileSync(join(cwd, "vercel.json"), "utf8"));
      for (const token of ["", "   ", "test-token-not-a-real-credential"]) {
        for (const status of [0, 7]) {
          const result = spawnSync(config.installCommand, {
            cwd,
            shell: true,
            encoding: "utf8",
            env: {
              ...process.env,
              PATH: `${bin}:${process.env.PATH}`,
              HUGEICONS_TOKEN: token,
              TEST_INSTALL_STATUS: String(status),
            },
          });
          expect(result.status).toBe(status);
          expect(result.stderr).toBe("");
          expect(JSON.parse(result.stdout)).toEqual({
            args: [
              "install",
              token.trim() ? "--no-frozen-lockfile" : "--frozen-lockfile",
            ],
            cwd: root,
          });
          expect(result.stdout).not.toContain("test-token");
        }
      }
    }
  } finally {
    rmSync(bin, { recursive: true, force: true });
  }
});
