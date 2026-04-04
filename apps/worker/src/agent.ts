/** biome-ignore-all lint/suspicious/noEvolvingTypes: expected */
/** biome-ignore-all lint/suspicious/noImplicitAnyLet: expected */
/** biome-ignore-all lint/nursery/noIncrementDecrement: expected */
/** biome-ignore-all lint/nursery/noShadow: expected */
/** biome-ignore-all lint/nursery/useMaxParams: expected */
import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { resolveModel } from "@userbubble/ai";
import {
  automationApiKeyQueries,
  getFeedbackPost,
  getPostComments,
  githubConfigQueries,
  prJobQueries,
} from "@userbubble/db/queries";
import { generateText, streamText } from "ai";
import { createTools } from "./tools.js";

const SYSTEM_PROMPT = [
  "You are implementing a feature request for a software project.",
  "Read the codebase to understand the existing patterns and conventions.",
  "Implement the requested feature with minimal, focused changes.",
  "Follow existing code style and conventions exactly.",
  "Write clean, well-structured code.",
  "After implementing, stage and commit your changes with a clear commit message.",
  "Do NOT push to the remote - that will be handled separately.",
  "",
  "CRITICAL: You MUST use the provided tools (write, edit, bash) to make actual file changes.",
  "Do NOT just describe what you would change — actually use the tools to modify files.",
  "Every implementation must result in real file modifications detected by git.",
].join("\n");

const MAX_AGENT_TURNS = 6;
const MAX_AGENT_STEPS = 50;
const IDLE_TIMEOUT_MS = 120_000;
const RETRY_INITIAL_DELAY_MS = 2000;
const RETRY_MAX_DELAY_MS = 30_000;

type AgentMessage = {
  role: "user" | "assistant";
  content: string;
};

/**
 * Execute a PR generation job.
 * This function is called by the webhook handler when a job is triggered.
 */
export async function executeJob(jobId: string): Promise<void> {
  const job = await prJobQueries.getById(jobId);
  if (!job) {
    throw new Error(`Job ${jobId} not found`);
  }

  if (job.status !== "pending") {
    throw new Error(
      `Job ${jobId} is not in pending state (status: ${job.status})`
    );
  }

  const workDir = join("/tmp", jobId);

  try {
    // Get feedback post details
    const post = await getFeedbackPost(job.feedbackPostId);
    if (!post) {
      throw new Error("Feedback post not found");
    }

    // Get GitHub token (always needed)
    const githubToken = await automationApiKeyQueries.getDecrypted(
      job.organizationId,
      "github"
    );
    if (!githubToken) {
      throw new Error("GitHub token not configured");
    }

    // Resolve AI provider via plugin registry
    const providerId = job.aiProvider ?? "anthropic";
    await prJobQueries.appendProgress(
      jobId,
      `Using AI provider: ${providerId}`
    );

    const model = await resolveModel(job.organizationId, providerId);
    await prJobQueries.appendProgress(jobId, "Model resolved successfully");

    // Get GitHub config (includes project context)
    const githubConfig = await githubConfigQueries.get(job.organizationId);
    if (!githubConfig) {
      throw new Error("GitHub repository not configured");
    }

    // Fetch comments for conversation context
    const comments = await getPostComments(
      job.feedbackPostId,
      job.organizationId
    );
    const conversationContext = comments
      .map((c) => {
        const author = c.comment.isAiGenerated
          ? "AI Assistant"
          : (c.author?.name ?? c.comment.authorName ?? "User");
        return `${author}: ${c.comment.content}`;
      })
      .join("\n\n");

    // --- Step 1: Clone ---
    await prJobQueries.updateStatus(jobId, "cloning");
    await prJobQueries.appendProgress(jobId, "Cloning repository...");

    const cloneUrl = `https://x-access-token:${githubToken}@github.com/${githubConfig.repoFullName}.git`;
    execSync(`git clone --depth 50 ${cloneUrl} ${workDir}`, {
      timeout: 120_000,
    });

    // Create branch
    const slugifiedTitle = post.post.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40);
    const branchName = `ai/${slugifiedTitle}`;

    execSync(`git checkout -b ${branchName}`, { cwd: workDir });
    await prJobQueries.updateStatus(jobId, "cloning", { branchName });
    await prJobQueries.appendProgress(jobId, `Created branch: ${branchName}`);

    // --- Step 2: Analyze ---
    await prJobQueries.updateStatus(jobId, "analyzing");
    await prJobQueries.appendProgress(jobId, "Analyzing codebase...");

    // --- Step 3: Implement ---
    await prJobQueries.updateStatus(jobId, "implementing");
    await prJobQueries.appendProgress(
      jobId,
      "AI agent is implementing the feature..."
    );

    // Build the prompt
    const prompt = buildPrompt(
      post.post.title,
      post.post.description,
      job.additionalContext,
      githubConfig.projectContext,
      conversationContext || undefined
    );

    // Run AI agent with tool loop (streamText handles SSE from Codex backend)
    await prJobQueries.appendProgress(jobId, "Calling AI model...");
    const { steps, finalText } = await runAgentUntilComplete({
      jobId,
      model,
      prompt,
      workDir,
    });
    await prJobQueries.appendProgress(
      jobId,
      `Agent completed in ${steps.length} steps`
    );
    if (finalText.trim()) {
      await prJobQueries.appendProgress(jobId, `AI: ${finalText.trim()}`);
    }

    // Check if the job was cancelled while running
    const currentJob = await prJobQueries.getById(jobId);
    if (currentJob?.status === "cancelled") {
      await prJobQueries.appendProgress(jobId, "Job was cancelled");
      return;
    }

    // --- Step 4: Create PR ---
    await prJobQueries.updateStatus(jobId, "creating_pr");
    await prJobQueries.appendProgress(
      jobId,
      "Pushing changes and creating PR..."
    );

    // Configure git for pushing
    execSync('git config user.name "UserBubble AI"', { cwd: workDir });
    execSync('git config user.email "ai@userbubble.com"', { cwd: workDir });

    // Check if there are changes to commit
    let status = execSync("git status --porcelain", { cwd: workDir })
      .toString()
      .trim();
    let diffFromMain = status
      ? ""
      : execSync(`git diff ${githubConfig.defaultBranch}..HEAD --stat`, {
          cwd: workDir,
        })
          .toString()
          .trim();

    // Retry: model may have described changes without using tools
    if (!(status || diffFromMain)) {
      await prJobQueries.appendProgress(
        jobId,
        "No file changes detected — retrying with corrective prompt..."
      );

      const retryResult = await generateText({
        model,
        system: SYSTEM_PROMPT,
        messages: [
          { role: "user", content: prompt },
          { role: "assistant", content: finalText },
          {
            role: "user",
            content:
              "IMPORTANT: git status shows ZERO file changes. You described changes in text but never actually used the tools to modify files. You MUST use the write, edit, or bash tools NOW to implement the feature. Do not describe — do it.",
          },
        ],
        tools: createTools(workDir),
        maxSteps: 50,
        onStepFinish: async ({ toolCalls }) => {
          if (toolCalls) {
            for (const tc of toolCalls) {
              await prJobQueries.appendProgress(
                jobId,
                `Retry tool: ${tc.toolName}`
              );
            }
          }
        },
      });

      await prJobQueries.appendProgress(
        jobId,
        `Retry completed in ${retryResult.steps.length} steps`
      );

      // Re-check
      status = execSync("git status --porcelain", { cwd: workDir })
        .toString()
        .trim();
      diffFromMain = status
        ? ""
        : execSync(`git diff ${githubConfig.defaultBranch}..HEAD --stat`, {
            cwd: workDir,
          })
            .toString()
            .trim();
    }

    if (status) {
      // Stage and commit any remaining changes
      execSync("git add -A", { cwd: workDir });
      execSync(
        `git commit -m "feat: ${post.post.title}\n\nImplemented via AI from UserBubble feedback."`,
        { cwd: workDir }
      );
    } else if (!diffFromMain) {
      throw new Error("No changes were made by the AI agent");
    }

    // Push branch
    execSync(`git push origin ${branchName}`, { cwd: workDir });

    // Create PR via GitHub API
    const prBody = [
      "## Feature Request",
      "",
      `**Title:** ${post.post.title}`,
      "",
      `**Description:** ${post.post.description}`,
      "",
      job.additionalContext
        ? `**Additional Context:** ${job.additionalContext}\n`
        : "",
      "---",
      "*This PR was automatically generated by [UserBubble](https://userbubble.com) AI from a user feedback post.*",
    ].join("\n");

    const prResponse = await fetch(
      `https://api.github.com/repos/${githubConfig.repoFullName}/pulls`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${githubToken}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: `feat: ${post.post.title}`,
          body: prBody,
          head: branchName,
          base: githubConfig.defaultBranch,
        }),
      }
    );

    if (!prResponse.ok) {
      const errorData = (await prResponse.json()) as { message?: string };
      throw new Error(
        `Failed to create PR: ${errorData.message ?? prResponse.statusText}`
      );
    }

    const prData = (await prResponse.json()) as { html_url: string };

    // --- Step 5: Complete ---
    await prJobQueries.updateStatus(jobId, "completed", {
      prUrl: prData.html_url,
      branchName,
    });
    await prJobQueries.appendProgress(jobId, `PR created: ${prData.html_url}`);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    await prJobQueries.updateStatus(jobId, "failed", {
      errorMessage,
    });
    await prJobQueries.appendProgress(jobId, `Error: ${errorMessage}`);
  } finally {
    // Cleanup cloned repo
    if (existsSync(workDir)) {
      rmSync(workDir, { recursive: true, force: true });
    }
  }
}

async function runAgentUntilComplete(input: {
  jobId: string;
  model: Awaited<ReturnType<typeof resolveModel>>;
  prompt: string;
  workDir: string;
}) {
  const messages: AgentMessage[] = [{ role: "user", content: input.prompt }];
  let turn = 0;
  let allSteps: Array<{ [key: string]: unknown }> = [];
  let lastText = "";

  while (turn < MAX_AGENT_TURNS) {
    turn++;
    await prJobQueries.appendProgress(
      input.jobId,
      `Starting agent turn ${turn}/${MAX_AGENT_TURNS}...`
    );

    const { finishReason, steps, text } = await runAgentTurn({
      jobId: input.jobId,
      model: input.model,
      messages,
      workDir: input.workDir,
      turn,
    });

    allSteps = [...allSteps, ...steps];
    lastText = text.trim();

    if (lastText) {
      await prJobQueries.appendProgress(input.jobId, `AI: ${lastText}`);
    }

    messages.push({ role: "assistant", content: text });

    if (isTerminalFinishReason(finishReason)) {
      return { steps: allSteps, finalText: text };
    }

    await prJobQueries.appendProgress(
      input.jobId,
      `Agent paused with finish reason "${finishReason}". Continuing from current repo state...`
    );
    messages.push({
      role: "user",
      content: [
        "Continue from the current repository state and finish the task.",
        "Do not restart the analysis from scratch.",
        "If implementation is complete, verify the result, commit any remaining changes, and give a brief summary.",
      ].join(" "),
    });
  }

  throw new Error(
    `Agent did not reach a terminal finish reason after ${MAX_AGENT_TURNS} turns`
  );
}

async function runAgentTurn(input: {
  jobId: string;
  model: Awaited<ReturnType<typeof resolveModel>>;
  messages: AgentMessage[];
  workDir: string;
  turn: number;
}) {
  let attempt = 0;

  while (true) {
    attempt++;
    let lastActivityAt = Date.now();
    let idleTimer: ReturnType<typeof setInterval> | undefined;
    const controller = new AbortController();

    try {
      console.log(
        `[agent] Starting streamText turn=${input.turn} attempt=${attempt}...`
      );
      const result = streamText({
        model: input.model,
        system: SYSTEM_PROMPT,
        messages: input.messages,
        tools: createTools(input.workDir),
        maxSteps: MAX_AGENT_STEPS,
        abortSignal: controller.signal,
        onStepFinish: async ({ toolCalls, text, finishReason }) => {
          lastActivityAt = Date.now();
          console.log(
            `[agent] Step finished: reason=${finishReason} toolCalls=${toolCalls?.length ?? 0} textLen=${text?.length ?? 0}`
          );
          if (toolCalls) {
            for (const tc of toolCalls) {
              console.log(`[agent] Tool call: ${tc.toolName}`);
              await prJobQueries.appendProgress(
                input.jobId,
                `Used tool: ${tc.toolName}`
              );
            }
          }
          const currentJob = await prJobQueries.getById(input.jobId);
          if (currentJob?.status === "cancelled") {
            controller.abort("Job cancelled");
            throw new Error("Job cancelled");
          }
        },
        onChunk: ({ chunk }) => {
          lastActivityAt = Date.now();
          if (chunk.type === "text-delta") {
            process.stdout.write(".");
          }
        },
      });

      idleTimer = setInterval(() => {
        if (Date.now() - lastActivityAt > IDLE_TIMEOUT_MS) {
          console.error(
            `[agent] turn=${input.turn} attempt=${attempt} idle for ${IDLE_TIMEOUT_MS}ms, aborting`
          );
          controller.abort(`Agent idle for ${IDLE_TIMEOUT_MS}ms`);
        }
      }, 5000);

      const [text, steps, finishReason] = await Promise.all([
        result.text,
        result.steps,
        result.finishReason,
      ]);

      console.log(
        `[agent] Stream consumed. turn=${input.turn} attempt=${attempt} finishReason=${finishReason} textLen=${text.length}`
      );
      return {
        text,
        steps: steps as Array<{ [key: string]: unknown }>,
        finishReason,
      };
    } catch (aiError) {
      const errorDetails = formatAiError(aiError);
      await prJobQueries.appendProgress(
        input.jobId,
        `AI turn ${input.turn} attempt ${attempt} failed: ${errorDetails}`
      );

      if (!isRetryableAiError(aiError) || attempt >= 4) {
        throw aiError;
      }

      const delayMs = getRetryDelayMs(attempt, aiError);
      await prJobQueries.appendProgress(
        input.jobId,
        `Retrying AI turn ${input.turn} in ${Math.ceil(delayMs / 1000)}s...`
      );
      await sleep(delayMs);
    } finally {
      if (idleTimer) {
        clearInterval(idleTimer);
      }
    }
  }
}

function isTerminalFinishReason(finishReason: string | undefined) {
  return Boolean(
    finishReason && !["tool-calls", "unknown", "length"].includes(finishReason)
  );
}

function isRetryableAiError(error: unknown) {
  const statusCode =
    error && typeof error === "object" && "statusCode" in error
      ? (error as { statusCode?: number }).statusCode
      : undefined;
  if (statusCode === 408 || statusCode === 409 || statusCode === 429) {
    return true;
  }
  if (typeof statusCode === "number" && statusCode >= 500) {
    return true;
  }

  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();
  return (
    normalized.includes("rate limit") ||
    normalized.includes("overloaded") ||
    normalized.includes("temporarily unavailable") ||
    normalized.includes("timed out") ||
    normalized.includes("timeout") ||
    normalized.includes("econnreset") ||
    normalized.includes("socket hang up") ||
    normalized.includes("agent idle")
  );
}

function getRetryDelayMs(attempt: number, error: unknown) {
  const retryAfter =
    error && typeof error === "object" && "responseHeaders" in error
      ? (error as { responseHeaders?: Record<string, string> }).responseHeaders
      : undefined;

  const retryAfterMs = retryAfter?.["retry-after-ms"];
  if (retryAfterMs) {
    const parsed = Number.parseFloat(retryAfterMs);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  const retryAfterSeconds = retryAfter?.["retry-after"];
  if (retryAfterSeconds) {
    const parsed = Number.parseFloat(retryAfterSeconds);
    if (!Number.isNaN(parsed)) {
      return Math.ceil(parsed * 1000);
    }
  }

  return Math.min(
    RETRY_INITIAL_DELAY_MS * 2 ** (attempt - 1),
    RETRY_MAX_DELAY_MS
  );
}

function formatAiError(error: unknown) {
  const msg = error instanceof Error ? error.message : String(error);
  const statusCode =
    error && typeof error === "object" && "statusCode" in error
      ? (error as { statusCode?: number }).statusCode
      : undefined;
  const responseBody =
    error && typeof error === "object" && "responseBody" in error
      ? JSON.stringify(
          (error as { responseBody?: unknown }).responseBody
        ).slice(0, 500)
      : undefined;

  return `${msg}${statusCode ? ` (status: ${statusCode})` : ""}${responseBody ? ` body: ${responseBody}` : ""}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildPrompt(
  title: string,
  description: string,
  additionalContext?: string | null,
  projectContext?: string | null,
  conversationContext?: string
): string {
  const parts: string[] = [];

  if (projectContext) {
    parts.push("## Project Context", "", projectContext, "");
  }

  parts.push(
    "Implement the following feature request:",
    "",
    `## ${title}`,
    "",
    description
  );

  if (conversationContext) {
    parts.push("", "## Discussion", "", conversationContext);
  }

  if (additionalContext) {
    parts.push("", "## Additional Context", "", additionalContext);
  }

  parts.push(
    "",
    "## Instructions",
    "",
    "1. Read the codebase to understand the project structure and patterns",
    "2. Implement the feature with minimal, focused changes",
    "3. Follow existing code conventions exactly",
    "4. Stage and commit your changes with a descriptive commit message",
    "5. Do NOT push - pushing is handled separately"
  );

  return parts.join("\n");
}
