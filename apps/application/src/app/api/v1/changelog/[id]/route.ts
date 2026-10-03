import {
  changelogOperations,
  executeOperation,
} from "@userbubble/api/management";
import type { NextRequest } from "next/server";
import { auth } from "~/auth/server";
import { resolveOrg } from "../../_lib/auth";
import { corsOptions, jsonWithCors } from "../../_lib/cors";
import { sdkError } from "../../_lib/operations";

export function OPTIONS() {
  return corsOptions();
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { organization } = await resolveOrg(request);
    const { id } = await params;

    const entry = await executeOperation(
      changelogOperations.getById,
      {
        authApi: auth.api,
        session: null,
        identifiedOrgId: null,
        isIdentified: false,
      },
      { id, organizationId: organization.id }
    );
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
    return sdkError(error);
  }
}
