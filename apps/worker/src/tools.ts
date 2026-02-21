import { execSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { tool } from "ai";
import { z } from "zod";

function safePath(workDir: string, filePath: string): string {
  const resolved = resolve(workDir, filePath);
  if (!resolved.startsWith(workDir)) {
    throw new Error(`Path traversal detected: ${filePath}`);
  }
  return resolved;
}

export function createTools(workDir: string) {
  return {
    read: tool({
      description:
        "Read a file's contents with line numbers. Returns up to 2000 lines by default.",
      parameters: z.object({
        filePath: z
          .string()
          .describe("Path to the file (relative to repo root)"),
        offset: z
          .number()
          .optional()
          .describe("Line number to start reading from (1-indexed)"),
        limit: z
          .number()
          .optional()
          .describe("Maximum number of lines to read (default 2000)"),
      }),
      execute: async ({ filePath, offset, limit }) => {
        const absPath = safePath(workDir, filePath);
        const content = readFileSync(absPath, "utf-8");
        const lines = content.split("\n");
        const start = (offset ?? 1) - 1;
        const end = start + (limit ?? 2000);
        const slice = lines.slice(start, end);
        const numbered = slice.map(
          (line, i) => `${String(start + i + 1).padStart(6, " ")}\t${line}`
        );
        return numbered.join("\n");
      },
    }),

    write: tool({
      description:
        "Write content to a file. Creates parent directories if needed.",
      parameters: z.object({
        filePath: z
          .string()
          .describe("Path to the file (relative to repo root)"),
        content: z.string().describe("The content to write to the file"),
      }),
      execute: async ({ filePath, content }) => {
        const absPath = safePath(workDir, filePath);
        mkdirSync(dirname(absPath), { recursive: true });
        writeFileSync(absPath, content, "utf-8");
        return `Wrote ${content.split("\n").length} lines to ${filePath}`;
      },
    }),

    edit: tool({
      description:
        "Replace an exact string in a file. The old_string must appear exactly once in the file.",
      parameters: z.object({
        filePath: z
          .string()
          .describe("Path to the file (relative to repo root)"),
        oldString: z.string().describe("The exact text to find and replace"),
        newString: z.string().describe("The replacement text"),
      }),
      execute: async ({ filePath, oldString, newString }) => {
        const absPath = safePath(workDir, filePath);
        const content = readFileSync(absPath, "utf-8");
        const count = content.split(oldString).length - 1;
        if (count === 0) {
          throw new Error(
            `old_string not found in ${filePath}. Make sure it matches exactly.`
          );
        }
        if (count > 1) {
          throw new Error(
            `old_string found ${count} times in ${filePath}. It must be unique. Provide more surrounding context.`
          );
        }
        const updated = content.replace(oldString, newString);
        writeFileSync(absPath, updated, "utf-8");
        return `Edited ${filePath}: replaced 1 occurrence`;
      },
    }),

    bash: tool({
      description:
        "Execute a shell command in the repository. Use for git operations, running builds, installing packages, etc.",
      parameters: z.object({
        command: z.string().describe("The shell command to execute"),
        timeout: z
          .number()
          .optional()
          .describe("Timeout in milliseconds (default 120000)"),
      }),
      execute: async ({ command, timeout }) => {
        const output = execSync(command, {
          cwd: workDir,
          timeout: timeout ?? 120_000,
          maxBuffer: 1024 * 1024 * 10,
          encoding: "utf-8",
          stdio: ["pipe", "pipe", "pipe"],
        });
        const result = output as string;
        if (result.length > 30_000) {
          return `${result.slice(0, 30_000)}\n... (output truncated)`;
        }
        return result || "(no output)";
      },
    }),

    glob: tool({
      description:
        "Find files matching a glob pattern. Returns file paths sorted by modification time.",
      parameters: z.object({
        pattern: z
          .string()
          .describe('Glob pattern (e.g. "**/*.ts", "src/**/*.tsx")'),
        path: z
          .string()
          .optional()
          .describe(
            "Directory to search in (relative to repo root, default is root)"
          ),
      }),
      execute: async ({ pattern, path }) => {
        const searchDir = path ? safePath(workDir, path) : workDir;
        // Use find + shell glob as a portable fallback
        const _cmd = `find ${searchDir} -path '*/node_modules' -prune -o -path '*/.git' -prune -o -name '${pattern.includes("/") ? pattern.split("/").pop() : pattern}' -print 2>/dev/null | head -200`;

        // Prefer using the glob pattern directly via shell
        const globCmd = `cd ${searchDir} && ls -d ${pattern} 2>/dev/null | head -200`;
        try {
          const output = execSync(globCmd, {
            cwd: searchDir,
            encoding: "utf-8",
            timeout: 30_000,
            stdio: ["pipe", "pipe", "pipe"],
          });
          return output.trim() || "No matching files found";
        } catch {
          // Fallback: use find for recursive patterns
          try {
            const output = execSync(
              `find . -path '*/node_modules' -prune -o -path '*/.git' -prune -o -type f -name '${pattern.replace(/\*\*\//g, "")}' -print 2>/dev/null | head -200`,
              {
                cwd: searchDir,
                encoding: "utf-8",
                timeout: 30_000,
                stdio: ["pipe", "pipe", "pipe"],
              }
            );
            return output.trim() || "No matching files found";
          } catch {
            return "No matching files found";
          }
        }
      },
    }),

    grep: tool({
      description:
        "Search file contents for a regex pattern. Returns matching lines with file paths and line numbers.",
      parameters: z.object({
        pattern: z.string().describe("Regex pattern to search for"),
        path: z
          .string()
          .optional()
          .describe("File or directory to search in (relative to repo root)"),
        include: z
          .string()
          .optional()
          .describe('File pattern to include (e.g. "*.ts", "*.tsx")'),
      }),
      execute: async ({ pattern, path, include }) => {
        const searchPath = path ? safePath(workDir, path) : workDir;
        const parts = ["grep", "-rn", "--color=never"];
        parts.push("--exclude-dir=node_modules");
        parts.push("--exclude-dir=.git");
        parts.push("--exclude-dir=dist");
        if (include) {
          parts.push(`--include='${include}'`);
        }
        parts.push(`'${pattern.replace(/'/g, "'\\''")}'`);
        parts.push(searchPath);
        parts.push("| head -100");

        try {
          const output = execSync(parts.join(" "), {
            cwd: workDir,
            encoding: "utf-8",
            timeout: 30_000,
            stdio: ["pipe", "pipe", "pipe"],
          });
          return output.trim() || "No matches found";
        } catch {
          return "No matches found";
        }
      },
    }),

    list_directory: tool({
      description:
        "List files and directories at a given path. Useful for exploring project structure.",
      parameters: z.object({
        path: z
          .string()
          .optional()
          .describe("Directory path (relative to repo root, default is root)"),
      }),
      execute: async ({ path }) => {
        const dir = path ? safePath(workDir, path) : workDir;
        const entries = readdirSync(dir, { withFileTypes: true });
        const lines = entries
          .filter((e) => e.name !== "node_modules" && e.name !== ".git")
          .map((e) => `${e.isDirectory() ? "d" : "f"} ${e.name}`);
        return lines.join("\n") || "(empty directory)";
      },
    }),
  };
}
