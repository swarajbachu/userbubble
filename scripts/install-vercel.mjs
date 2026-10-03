import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// The public lockfile contains community icon aliases. Pro deployments must
// resolve the licensed packages in their disposable checkout before building.
const pro = Boolean(process.env.HUGEICONS_TOKEN?.trim());
const result = spawnSync(
  "pnpm",
  ["install", pro ? "--no-frozen-lockfile" : "--frozen-lockfile"],
  { cwd: fileURLToPath(new URL("..", import.meta.url)), stdio: "inherit" }
);
if (result.error) {
  console.error("Could not start pnpm:", result.error.message);
}
process.exit(result.status ?? 1);
