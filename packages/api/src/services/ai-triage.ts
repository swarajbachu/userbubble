import { resolveAnyModel } from "@userbubble/ai";
import {
  automationApiKeyQueries,
  createComment,
  getFeedbackPost,
  getPostComments,
  githubConfigQueries,
  incrementTriageCount,
  oauthConnectionQueries,
  organizationQueries,
  prJobQueries,
  updateAiTriageStatus,
} from "@userbubble/db/queries";
import {
  type OrganizationSettings,
  parseOrganizationSettings,
} from "@userbubble/db/schema";
import { type LanguageModelV1, streamText } from "ai";

const MAX_TRIAGE_ATTEMPTS = 3;
const MAX_DAILY_JOBS = 10;

const CODE_BLOCK_START_RE = /^```(?:json)?\n?/;
const CODE_BLOCK_END_RE = /\n?```$/;

type TriageResult = {
  action: "ask_more" | "implement" | "skip";
  comment?: string;
  reasoning: string;
};

const TRIAGE_SYSTEM_PROMPT = `You are an AI assistant that triages user feedback for a software product. Given the project context and a feedback post (with any existing conversation), decide what to do.

You MUST respond with valid JSON matching this schema:
{
  "action": "ask_more" | "implement" | "skip",
  "comment": "string (required for ask_more and implement, omit for skip)",
  "reasoning": "string (brief internal reasoning)"
}

Decision criteria:
- **ask_more**: The feedback is potentially actionable but needs clarification. Ask specific questions to understand what the user wants. Be friendly and concise.
- **implement**: The feedback is clear, specific, and actionable. The comment should briefly acknowledge what you'll implement. Only choose this if you have enough detail to create a meaningful PR.
- **skip**: The feedback is too vague, out of scope for this project, spam, or not actionable even with clarification. Do NOT comment.

Guidelines:
- Be helpful and encouraging in your comments
- Keep comments concise (2-4 sentences max)
- For "ask_more", ask 1-2 specific questions, not a laundry list
- For "implement", summarize what you understand the feature to be
- Consider the project's tech stack and architecture when deciding if something fits
- If there's conversation history, use it to make better decisions`;

/**
 * Core triage function — calls AI to decide what to do with a feedback post.
 */
async function triageFeedbackPost(params: {
  model: LanguageModelV1;
  projectContext: string | null;
  title: string;
  description: string;
  category: string;
  comments: Array<{
    content: string;
    authorName: string | null;
    isAiGenerated: boolean;
  }>;
}): Promise<TriageResult | null> {
  const conversationHistory = params.comments
    .map((c) => {
      const author = c.isAiGenerated
        ? "AI Assistant"
        : (c.authorName ?? "User");
      return `${author}: ${c.content}`;
    })
    .join("\n\n");

  const prompt = [
    params.projectContext
      ? `## Project Context\n${params.projectContext}\n`
      : "",
    "## Feedback Post",
    `**Title:** ${params.title}`,
    `**Category:** ${params.category}`,
    `**Description:** ${params.description}`,
    conversationHistory
      ? `\n## Conversation History\n${conversationHistory}`
      : "",
    "\nDecide what to do with this feedback. Respond with JSON only.",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    // Use streamText because the Codex backend always returns SSE streams
    const result = streamText({
      model: params.model,
      system: TRIAGE_SYSTEM_PROMPT,
      prompt,
      maxTokens: 1000,
    });
    const fullText = await result.text;

    // Parse JSON from response (handle markdown code blocks)
    let jsonText = fullText.trim();
    if (jsonText.startsWith("```")) {
      jsonText = jsonText
        .replace(CODE_BLOCK_START_RE, "")
        .replace(CODE_BLOCK_END_RE, "");
    }

    const parsed = JSON.parse(jsonText) as TriageResult;

    if (!["ask_more", "implement", "skip"].includes(parsed.action)) {
      console.error("[triage] Invalid action:", parsed.action);
      return null;
    }

    return parsed;
  } catch (error) {
    console.error("[triage] Failed to triage feedback:", error);
    return null;
  }
}

/**
 * Get organization settings from metadata.
 */
async function getOrgSettings(
  organizationId: string
): Promise<OrganizationSettings | null> {
  const org = await organizationQueries.findById(organizationId);
  if (!org) {
    return null;
  }
  return parseOrganizationSettings(org.metadata);
}

/**
 * Main entry point: fire-and-forget triage for a feedback post.
 */
export async function triggerAsyncTriage(
  postId: string,
  organizationId: string
): Promise<void> {
  try {
    // Check org settings
    const settings = await getOrgSettings(organizationId);
    if (!settings?.automation?.enableAutoTriage) {
      return;
    }

    // Resolve AI model: prefer Anthropic key, fall back to Codex OAuth
    const model = await resolveAnyModel(organizationId);
    if (!model) {
      return;
    }

    // Check GitHub config exists (needed for project context)
    const config = await githubConfigQueries.get(organizationId);
    if (!config) {
      return;
    }

    // Get current post state
    const postData = await getFeedbackPost(postId);
    if (!postData) {
      return;
    }

    // Loop guard
    if (postData.post.aiTriageCount >= MAX_TRIAGE_ATTEMPTS) {
      console.log(
        `[triage] Post ${postId} reached max triage attempts (${MAX_TRIAGE_ATTEMPTS})`
      );
      return;
    }

    // Set pending + increment count
    await updateAiTriageStatus(postId, "pending");
    await incrementTriageCount(postId);

    // Fetch comments for conversation context
    const comments = await getPostComments(postId, organizationId);
    const commentData = comments.map((c) => ({
      content: c.comment.content,
      authorName: c.comment.authorName ?? c.author?.name ?? null,
      isAiGenerated: c.comment.isAiGenerated,
    }));

    // Call triage
    const result = await triageFeedbackPost({
      model,
      projectContext: config.projectContext,
      title: postData.post.title,
      description: postData.post.description,
      category: postData.post.category,
      comments: commentData,
    });

    if (!result) {
      await updateAiTriageStatus(postId, "skipped");
      return;
    }

    switch (result.action) {
      case "ask_more": {
        if (result.comment) {
          await createComment({
            postId,
            authorId: null,
            authorName: "AI Assistant",
            content: result.comment,
            isAiGenerated: true,
          });
        }
        await updateAiTriageStatus(postId, "asked_more");
        break;
      }
      case "implement": {
        if (result.comment) {
          await createComment({
            postId,
            authorId: null,
            authorName: "AI Assistant",
            content: result.comment,
            isAiGenerated: true,
          });
        }
        await updateAiTriageStatus(postId, "implementing");

        // Auto-trigger PR generation if enabled
        if (settings.automation.enableAutoImplement) {
          await autoTriggerPrGeneration(organizationId, postId).catch((err) =>
            console.error("[triage] Auto-implement failed:", err)
          );
        }
        break;
      }
      case "skip": {
        await updateAiTriageStatus(postId, "skipped");
        break;
      }
      default:
        break;
    }

    console.log(
      `[triage] Post ${postId}: action=${result.action} reasoning="${result.reasoning}"`
    );
  } catch (error) {
    console.error("[triage] Error in triggerAsyncTriage:", error);
  }
}

/**
 * Auto-trigger PR generation (system-initiated, no user triggeredBy).
 */
async function autoTriggerPrGeneration(
  organizationId: string,
  feedbackPostId: string
): Promise<void> {
  // Check rate limits silently
  const hasRunning = await prJobQueries.hasRunningJob(organizationId);
  if (hasRunning) {
    return;
  }

  const todayCount = await prJobQueries.countTodayJobs(organizationId);
  if (todayCount >= MAX_DAILY_JOBS) {
    return;
  }

  // Check providers
  const [apiKeys, oauthConns, config] = await Promise.all([
    automationApiKeyQueries.getStatus(organizationId),
    oauthConnectionQueries.listActive(organizationId),
    githubConfigQueries.get(organizationId),
  ]);

  const hasGithub = apiKeys.some((k) => k.provider === "github");
  const hasAnthropic = apiKeys.some((k) => k.provider === "anthropic");
  const hasCodex = oauthConns.some((c) => c.provider === "codex");

  if (!(hasGithub && (hasAnthropic || hasCodex) && config)) {
    return;
  }

  // Select provider: prefer Codex, then Anthropic
  const aiProvider = hasCodex ? "codex" : "anthropic";

  // Create job (system-initiated — triggeredById is null)
  const job = await prJobQueries.create({
    organizationId,
    feedbackPostId,
    triggeredById: null,
    status: "pending",
    aiProvider,
    progressLog: [
      { ts: new Date().toISOString(), message: "Auto-triggered by AI triage" },
    ],
  });

  if (!job) {
    return;
  }

  // Trigger worker webhook
  const webhookSecret = process.env.MODAL_WEBHOOK_SECRET;
  const webhookUrl = process.env.MODAL_WEBHOOK_URL;

  if (webhookUrl && webhookSecret) {
    try {
      await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${webhookSecret}`,
        },
        body: JSON.stringify({ jobId: job.id }),
      });
    } catch {
      await prJobQueries.appendProgress(
        job.id,
        "Warning: Failed to notify worker, job will be picked up by polling"
      );
    }
  }
}
