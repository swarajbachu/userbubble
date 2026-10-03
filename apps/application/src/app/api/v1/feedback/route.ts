import {
  executeOperation,
  feedbackOperations,
} from "@userbubble/api/management";
import type { NextRequest } from "next/server";
import { corsOptions, jsonWithCors } from "../_lib/cors";
import { sdkContext, sdkError } from "../_lib/operations";

export function OPTIONS() {
  return corsOptions();
}

export async function GET(request: NextRequest) {
  try {
    const { organization, context } = await sdkContext(request);
    const params = request.nextUrl.searchParams;
    const status = params.get("status");
    const posts = await executeOperation(feedbackOperations.getAll, context, {
      organizationId: organization.id,
      sortBy: params.get("sortBy") ?? "recent",
      status: status ? [status] : undefined,
      category: params.get("category") ?? undefined,
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
    return sdkError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { organization, context } = await sdkContext(request, true);
    const body: unknown = await request.json();
    const input = body && typeof body === "object" ? body : {};
    const post = await executeOperation(feedbackOperations.create, context, {
      ...input,
      organizationId: organization.id,
      category: "category" in input ? input.category : "feature_request",
      isPublic: true,
    });
    return jsonWithCors({ data: post }, 201);
  } catch (error) {
    return sdkError(error);
  }
}
