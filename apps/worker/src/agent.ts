/** biome-ignore-all lint/suspicious/noEvolvingTypes: <explanation> */
/** biome-ignore-all lint/suspicious/noImplicitAnyLet: <explanation> */
import { execSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import {
  automationApiKeyQueries,
  getFeedbackPost,
  githubConfigQueries,
  oauthConnectionQueries,
  prJobQueries,
} from "@userbubble/db/queries";
import { type LanguageModelV1, streamText } from "ai";
import { getProvider } from "./providers/registry.js";
import type { AiProvider } from "./providers/types.js";
import { createTools } from "./tools.js";

const SYSTEM_PROMPT = [
  "You are implementing a feature request for a software project.",
  "Read the codebase to understand the existing patterns and conventions.",
  "Implement the requested feature with minimal, focused changes.",
  "Follow existing code style and conventions exactly.",
  "Write clean, well-structured code.",
  "After implementing, stage and commit your changes with a clear commit message.",
  "Do NOT push to the remote - that will be handled separately.",
].join("\n");

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
    const provider = getProvider(providerId);

    const model = await resolveModel(provider, job.organizationId, providerId);
    await prJobQueries.appendProgress(jobId, "Model resolved successfully");

    // Get GitHub config
    const githubConfig = await githubConfigQueries.get(job.organizationId);
    if (!githubConfig) {
      throw new Error("GitHub repository not configured");
    }

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
      job.additionalContext
    );

    // Run AI agent with tool loop (streamText handles SSE from Codex backend)
    await prJobQueries.appendProgress(jobId, "Calling AI model...");
    let result;
    try {
      console.log("[agent] Starting streamText...");
      result = streamText({
        model,
        system: SYSTEM_PROMPT,
        prompt,
        tools: createTools(workDir),
        maxSteps: 50,
        // biome-ignore lint/nursery/noShadow: <its all right man>
        onStepFinish: async ({ toolCalls, text, finishReason }) => {
          console.log(
            `[agent] Step finished: reason=${finishReason} toolCalls=${toolCalls?.length ?? 0} textLen=${text?.length ?? 0}`
          );
          if (toolCalls) {
            for (const tc of toolCalls) {
              console.log(`[agent] Tool call: ${tc.toolName}`);
              await prJobQueries.appendProgress(
                jobId,
                `Used tool: ${tc.toolName}`
              );
            }
          }
          const currentJob = await prJobQueries.getById(jobId);
          if (currentJob?.status === "cancelled") {
            throw new Error("Job cancelled");
          }
        },
        onChunk: ({ chunk }) => {
          if (chunk.type === "text-delta") {
            process.stdout.write(".");
          }
        },
      });

      console.log("[agent] streamText created, consuming stream...");

      // Race the stream against a timeout to detect hangs
      const textPromise = result.text;
      const timeoutPromise = new Promise<string>((_, reject) => {
        setTimeout(
          () => reject(new Error("streamText hung for 120s")),
          120_000
        );
      });

      // Also log partial stream consumption
      result.textStream
        .pipeTo(
          new WritableStream({
            write(_chunk) {
              process.stdout.write(".");
            },
            close() {
              console.log("\n[agent] textStream closed");
            },
            abort(err) {
              console.error(`[agent] textStream aborted: ${err}`);
            },
          })
        )
        .catch((err) => {
          console.error(`[agent] textStream pipe error: ${err}`);
        });

      const finalText = await Promise.race([textPromise, timeoutPromise]);
      console.log(
        `[agent] Stream consumed. Final text length: ${finalText.length}`
      );
      const finishReason = await result.finishReason;
      console.log(`[agent] Finish reason: ${finishReason}`);
    } catch (aiError) {
      const msg = aiError instanceof Error ? aiError.message : String(aiError);
      const statusCode =
        aiError && typeof aiError === "object" && "statusCode" in aiError
          ? (aiError as { statusCode: number }).statusCode
          : undefined;
      const responseBody =
        aiError && typeof aiError === "object" && "responseBody" in aiError
          ? JSON.stringify(
              (aiError as { responseBody: unknown }).responseBody
            ).slice(0, 500)
          : undefined;
      await prJobQueries.appendProgress(
        jobId,
        `AI call failed: ${msg}${statusCode ? ` (status: ${statusCode})` : ""}${responseBody ? ` body: ${responseBody}` : ""}`
      );
      throw aiError;
    }

    const steps = await result.steps;
    const finalText = await result.text;
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
    const status = execSync("git status --porcelain", { cwd: workDir })
      .toString()
      .trim();

    if (status) {
      // Stage and commit any remaining changes
      execSync("git add -A", { cwd: workDir });
      execSync(
        `git commit -m "feat: ${post.post.title}\n\nImplemented via AI from UserBubble feedback."`,
        { cwd: workDir }
      );
    } else {
      // Agent may have already committed
      const diffFromMain = execSync(
        `git diff ${githubConfig.defaultBranch}..HEAD --stat`,
        { cwd: workDir }
      )
        .toString()
        .trim();

      if (!diffFromMain) {
        throw new Error("No changes were made by the AI agent");
      }
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

function buildPrompt(
  title: string,
  description: string,
  additionalContext?: string | null
): string {
  const parts = [
    "Implement the following feature request:",
    "",
    `## ${title}`,
    "",
    description,
  ];

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

async function resolveModel(
  provider: AiProvider,
  organizationId: string,
  providerId: string
): Promise<LanguageModelV1> {
  if (provider.authType === "api_key") {
    const apiKey = await automationApiKeyQueries.getDecrypted(
      organizationId,
      providerId
    );
    if (!apiKey) {
      throw new Error(`API key for "${providerId}" not configured`);
    }
    return provider.createModel(apiKey);
  }

  const creds = await oauthConnectionQueries.getDecryptedTokens(
    organizationId,
    providerId
  );
  if (!creds) {
    throw new Error(`OAuth credentials for "${providerId}" not found`);
  }
  return provider.createModel(creds);
}
