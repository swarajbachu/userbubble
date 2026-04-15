import { canVoteOnPost, removeVote, voteOnPost } from "@userbubble/db/queries";
import type { NextRequest } from "next/server";
import { ApiAuthError, resolveOrgAndUser } from "../../_lib/auth";
import { corsOptions, jsonWithCors } from "../../_lib/cors";

export function OPTIONS() {
  return corsOptions();
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await resolveOrgAndUser(request);
    const body = await request.json();

    const { postId, value } = body;
    if (!postId || value === undefined) {
      return jsonWithCors(
        {
          error: {
            code: "BAD_REQUEST",
            message: "postId and value are required",
          },
        },
        400
      );
    }

    const allowed = await canVoteOnPost(postId, userId);
    if (!allowed) {
      return jsonWithCors(
        {
          error: {
            code: "FORBIDDEN",
            message: "Not allowed to vote on this post",
          },
        },
        403
      );
    }

    if (value === 0) {
      await removeVote(postId, userId);
    } else {
      await voteOnPost({ postId, userId, value: 1 });
    }

    return jsonWithCors({ data: { success: true } });
  } catch (error) {
    if (error instanceof ApiAuthError) {
      return jsonWithCors(
        { error: { code: "UNAUTHORIZED", message: error.message } },
        error.status
      );
    }
    return jsonWithCors(
      { error: { code: "INTERNAL_ERROR", message: "Internal server error" } },
      500
    );
  }
}
