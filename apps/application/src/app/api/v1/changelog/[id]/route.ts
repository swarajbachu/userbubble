import { getChangelogEntry } from "@userbubble/db/queries";
import type { NextRequest } from "next/server";
import { ApiAuthError, resolveOrg } from "../../_lib/auth";
import { corsOptions, jsonWithCors } from "../../_lib/cors";

export function OPTIONS() {
  return corsOptions();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await resolveOrg(request);
    const { id } = await params;

    const entry = await getChangelogEntry(id);
    if (!entry) {
      return jsonWithCors(
        { error: { code: "NOT_FOUND", message: "Changelog entry not found" } },
        404
      );
    }

    return jsonWithCors({
      data: {
        id: entry.id,
        title: entry.title,
        description: entry.description,
        version: entry.version,
        coverImageUrl: entry.coverImageUrl,
        tags: entry.tags,
        publishedAt: entry.publishedAt,
        author: entry.author,
        linkedFeedback: entry.linkedFeedback,
      },
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
