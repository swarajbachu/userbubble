import { execSync } from "node:child_process";
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";
import { resolveAnyModelOrThrow } from "@userbubble/ai";
import {
  automationApiKeyQueries,
  githubConfigQueries,
} from "@userbubble/db/queries";
import { streamText } from "ai";

const KEY_FILES = [
  "README.md",
  "package.json",
  "tsconfig.json",
  "CLAUDE.md",
  ".claude/CLAUDE.md",
  "biome.json",
  "docker-compose.yml",
  "docker-compose.yaml",
  "Dockerfile",
  ".env.example",
  "turbo.json",
  "pnpm-workspace.yaml",
  "nx.json",
  "vite.config.ts",
  "next.config.js",
  "next.config.ts",
  "tailwind.config.ts",
  "tailwind.config.js",
];

const MAX_FILE_CHARS = 10_000;
const MAX_TREE_DEPTH = 3;

function readFileSafe(filePath: string, maxChars: number): string | null {
  try {
    if (!existsSync(filePath)) {
      return null;
    }
    const content = readFileSync(filePath, "utf-8");
    return content.slice(0, maxChars);
  } catch {
    return null;
  }
}

function getDirectoryTree(dir: string, depth: number): string {
  try {
    const result = execSync(
      `find . -maxdepth ${depth} -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/dist/*' -not -path '*/.next/*' | head -200 | sort`,
      { cwd: dir, timeout: 10_000 }
    );
    return result.toString().trim();
  } catch {
    return "(failed to read directory tree)";
  }
}

const ANALYSIS_SYSTEM_PROMPT = `You are a senior software engineer analyzing a codebase. Given key files and directory structure from a repository, generate a comprehensive project summary.

Your summary should cover:
1. **Project Overview**: What is this project? What does it do?
2. **Tech Stack**: Languages, frameworks, libraries, build tools
3. **Architecture**: How is the code organized? Monorepo? What are the key packages/modules?
4. **Key Patterns**: Coding conventions, state management, API patterns, database patterns
5. **What fits**: Types of features/changes that would naturally fit this codebase
6. **What doesn't fit**: Types of changes that would be out of scope or conflict with the architecture

Be concise but thorough. This summary will be used by an AI to understand the project context when triaging user feedback and generating PRs. Focus on actionable details.`;

export async function executeRepoAnalysis(
  organizationId: string
): Promise<void> {
  const config = await githubConfigQueries.get(organizationId);
  if (!config) {
    throw new Error("GitHub repository not configured");
  }

  await githubConfigQueries.updateAnalysisStatus(organizationId, "analyzing");

  const workDir = join("/tmp", `analysis-${organizationId}-${Date.now()}`);

  try {
    const githubToken = await automationApiKeyQueries.getDecrypted(
      organizationId,
      "github"
    );
    if (!githubToken) {
      throw new Error("GitHub token not configured");
    }

    // Resolve AI provider: prefer Anthropic key, fall back to Codex OAuth
    const model = await resolveAnyModelOrThrow(organizationId);

    // Shallow clone
    const cloneUrl = `https://x-access-token:${githubToken}@github.com/${config.repoFullName}.git`;
    execSync(`git clone --depth 1 ${cloneUrl} ${workDir}`, {
      timeout: 120_000,
    });

    // Read key files
    const fileContents: string[] = [];
    for (const fileName of KEY_FILES) {
      const content = readFileSafe(join(workDir, fileName), MAX_FILE_CHARS);
      if (content) {
        fileContents.push(`### ${fileName}\n\`\`\`\n${content}\n\`\`\``);
      }
    }

    // Read directory tree
    const tree = getDirectoryTree(workDir, MAX_TREE_DEPTH);

    // Build prompt
    const prompt = [
      "Analyze this codebase and generate a project summary.",
      "",
      "## Directory Structure",
      "```",
      tree,
      "```",
      "",
      "## Key Files",
      ...fileContents,
    ].join("\n");

    // Generate summary with whichever AI provider is available
    // Use streamText because the Codex backend always returns SSE streams
    const result = streamText({
      model,
      system: ANALYSIS_SYSTEM_PROMPT,
      prompt,
      maxTokens: 4000,
    });

    const chunks: string[] = [];
    let charCount = 0;
    for await (const chunk of result.textStream) {
      chunks.push(chunk);
      charCount += chunk.length;
      if (charCount % 500 < chunk.length) {
        console.log(`[analyze-repo] Streaming... ${charCount} chars received`);
      }
    }
    const text = chunks.join("");
    console.log(`[analyze-repo] Stream complete: ${text.length} chars total`);

    // Store result
    await githubConfigQueries.updateProjectContext(organizationId, text);

    console.log(`[analyze-repo] Analysis completed for org ${organizationId}`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    await githubConfigQueries.updateAnalysisStatus(
      organizationId,
      "failed",
      errorMessage
    );
    console.error(
      `[analyze-repo] Analysis failed for org ${organizationId}:`,
      error
    );
  } finally {
    if (existsSync(workDir)) {
      rmSync(workDir, { recursive: true, force: true });
    }
  }
}
