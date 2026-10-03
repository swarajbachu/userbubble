import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { KVStorage } from "@userbubble/client";

export function credentialStorage(
  directory = process.env.USERBUBBLE_CONFIG_DIR ??
    join(homedir(), ".config", "userbubble")
) {
  const filename = (key: string) =>
    join(directory, `${createHash("sha256").update(key).digest("hex")}.json`);
  return new KVStorage(
    {
      get: async (key) => {
        try {
          return await readFile(filename(key), "utf8");
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code === "ENOENT") {
            return null;
          }
          throw error;
        }
      },
      set: async (key, value) => {
        await mkdir(directory, { recursive: true, mode: 0o700 });
        const target = filename(key);
        const temporary = `${target}.${randomUUID()}.tmp`;
        await writeFile(temporary, value, { mode: 0o600 });
        await rename(temporary, target);
      },
      del: async (key) => {
        try {
          await unlink(filename(key));
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
            throw error;
          }
        }
      },
    },
    { prefix: "userbubble" }
  );
}
