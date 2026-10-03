import {
  changelogOperations,
  executeOperation,
} from "@userbubble/api/management";
import type { NextRequest } from "next/server";
import { auth } from "~/auth/server";
import { resolveOrg } from "../_lib/auth";
import { corsOptions, jsonWithCors } from "../_lib/cors";
import { sdkError } from "../_lib/operations";

export function OPTIONS() {
  return corsOptions();
}

export async function GET(request: NextRequest) {
  try {
    const { organization } = await resolveOrg(request);
    const params = request.nextUrl.searchParams;

    const limit = Number(params.get("limit")) || 20;
    const offset = Number(params.get("offset")) || 0;

    const entries = await executeOperation(
      changelogOperations.getAll,
      {
        authApi: auth.api,
        session: null,
        identifiedOrgId: null,
        isIdentified: false,
      },
      {
        organizationId: organization.id,
        published: true,
        limit,
        offset,
      }
    );

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
    return sdkError(error);
  }
}
