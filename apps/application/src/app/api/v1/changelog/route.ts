import { getChangelogEntries } from "@userbubble/db/queries";
import type { NextRequest } from "next/server";
import { ApiAuthError, resolveOrg } from "../_lib/auth";
import { corsOptions, jsonWithCors } from "../_lib/cors";

export function OPTIONS() {
  return corsOptions();
}

export async function GET(request: NextRequest) {
  try {
    const { organization } = await resolveOrg(request);
    const params = request.nextUrl.searchParams;

    const limit = Number(params.get("limit")) || 20;
    const offset = Number(params.get("offset")) || 0;

    const entries = await getChangelogEntries(organization.id, {
      published: true,
      limit,
      offset,
    });

    return jsonWithCors({
      data: entries.map((entry) => ({
        id: entry.id,
        title: entry.title,
        description: entry.description,
        version: entry.version,
        coverImageUrl: entry.coverImageUrl,
        tags: entry.tags,
        publishedAt: entry.publishedAt,
        author: entry.author,
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
