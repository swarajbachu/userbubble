import {
  canCreatePost,
  createFeedbackPost,
  getFeedbackPosts,
} from "@userbubble/db/queries";
import type { FeedbackCategory, FeedbackStatus } from "@userbubble/db/schema";
import type { NextRequest } from "next/server";
import { ApiAuthError, resolveOrg, resolveOrgAndUser } from "../_lib/auth";
import { corsOptions, jsonWithCors } from "../_lib/cors";

export function OPTIONS() {
  return corsOptions();
}

export async function GET(request: NextRequest) {
  try {
    const { organization } = await resolveOrg(request);
    const params = request.nextUrl.searchParams;

    const sortBy = params.get("sortBy") as "votes" | "recent" | null;
    const status = params.get("status") as FeedbackStatus | null;
    const category = params.get("category") as FeedbackCategory | null;

    // Try to extract user from Bearer token (optional for GET)
    let userId: string | undefined;
    const authHeader = request.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const result = await resolveOrgAndUser(request);
        userId = result.userId;
      } catch {
        // Token invalid — proceed without user context
      }
    }

    const statusFilter = status ? [status] : undefined;

    const posts = await getFeedbackPosts(organization.id, {
      sortBy: sortBy ?? "recent",
      status: statusFilter,
      category: category ?? undefined,
      userId,
    });

    return jsonWithCors({
      data: posts.map((row) => ({
        id: row.post.id,
        title: row.post.title,
        description: row.post.description,
        status: row.post.status,
        category: row.post.category,
        voteCount: row.post.voteCount,
        createdAt: row.post.createdAt,
        author: row.author,
        hasUserVoted: row.hasUserVoted,
      })),
    });
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

export async function POST(request: NextRequest) {
  try {
    const { organization, userId } = await resolveOrgAndUser(request);
    const body = await request.json();

    const { title, description, category } = body;
    if (!(title && description)) {
      return jsonWithCors(
        {
          error: {
            code: "BAD_REQUEST",
            message: "title and description are required",
          },
        },
        400
      );
    }

    const allowed = await canCreatePost(organization.id, userId);
    if (!allowed) {
      return jsonWithCors(
        {
          error: {
            code: "FORBIDDEN",
            message: "Not allowed to create feedback",
          },
        },
        403
      );
    }

    const post = await createFeedbackPost({
      organizationId: organization.id,
      authorId: userId,
      title,
      description,
      category: category ?? "feature_request",
    });

    return jsonWithCors({ data: post }, 201);
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
