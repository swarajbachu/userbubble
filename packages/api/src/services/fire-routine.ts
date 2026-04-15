import {
  automationApiKeyQueries,
  getFeedbackPost,
  getPostComments,
  githubConfigQueries,
} from "@userbubble/db/queries";

type RoutineFireResponse = {
  type: "routine_fire";
  claude_code_session_id: string;
  claude_code_session_url: string;
};

function buildRoutineText(params: {
  title: string;
  description: string;
  conversationContext?: string;
  additionalContext?: string;
  projectContext?: string;
  callbackUrl: string;
  callbackSecret: string;
  jobId: string;
}): string {
  const parts: string[] = [];

  if (params.projectContext) {
    parts.push("## Project Context", "", params.projectContext, "");
  }

  parts.push(
    "## Feature Request",
    "",
    `### ${params.title}`,
    "",
    params.description
  );

  if (params.conversationContext) {
    parts.push("", "## Discussion", "", params.conversationContext);
  }

  if (params.additionalContext) {
    parts.push("", "## Additional Context", "", params.additionalContext);
  }

  parts.push(
    "",
    "## When Done",
    "",
    "After creating the pull request, report results by running:",
    "",
    `curl -X POST ${params.callbackUrl} \\`,
    `  -H "Authorization: Bearer ${params.callbackSecret}" \\`,
    `  -H "Content-Type: application/json" \\`,
    `  -d '{"jobId": "${params.jobId}", "status": "completed", "prUrl": "<the PR URL you created>", "branchName": "<the branch name>"}'`,
    "",
    'If you fail or cannot implement the feature, send status "failed" with an "error" field explaining why.'
  );

  return parts.join("\n");
}

export async function fireRoutine(params: {
  organizationId: string;
  feedbackPostId: string;
  additionalContext?: string | null;
  jobId: string;
}): Promise<{ sessionId: string; sessionUrl: string }> {
  // Decrypt routine credentials
  const [routineUrl, routineToken] = await Promise.all([
    automationApiKeyQueries.getDecrypted(params.organizationId, "routine_url"),
    automationApiKeyQueries.getDecrypted(
      params.organizationId,
      "routine_token"
    ),
  ]);

  if (!(routineUrl && routineToken)) {
    throw new Error("Claude Code Routine credentials not configured");
  }

  // Fetch feedback post
  const post = await getFeedbackPost(params.feedbackPostId);
  if (!post) {
    throw new Error("Feedback post not found");
  }

  // Fetch comments for conversation context
  const comments = await getPostComments(
    params.feedbackPostId,
    params.organizationId
  );
  const conversationContext = comments
    .map((c) => {
      const author = c.comment.isAiGenerated
        ? "AI Assistant"
        : (c.author?.name ?? c.comment.authorName ?? "User");
      return `${author}: ${c.comment.content}`;
    })
    .join("\n\n");

  // Fetch project context
  const githubConfig = await githubConfigQueries.get(params.organizationId);
  const projectContext = githubConfig?.projectContext ?? undefined;

  // Build callback URL
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? process.env.APP_URL;
  if (!appUrl) {
    throw new Error("APP_URL not configured");
  }
  const callbackUrl = `${appUrl}/api/routine-callback`;
  const callbackSecret = process.env.ROUTINE_CALLBACK_SECRET;
  if (!callbackSecret) {
    throw new Error("ROUTINE_CALLBACK_SECRET not configured");
  }

  // Assemble text payload
  const text = buildRoutineText({
    title: post.post.title,
    description: post.post.description,
    conversationContext: conversationContext || undefined,
    additionalContext: params.additionalContext ?? undefined,
    projectContext,
    callbackUrl,
    callbackSecret,
    jobId: params.jobId,
  });

  // Fire the routine
  const response = await fetch(routineUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${routineToken}`,
      "anthropic-beta": "experimental-cc-routine-2026-04-01",
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Routine API returned ${response.status}: ${body.slice(0, 500)}`
    );
  }

  const data = (await response.json()) as RoutineFireResponse;

  return {
    sessionId: data.claude_code_session_id,
    sessionUrl: data.claude_code_session_url,
  };
}
