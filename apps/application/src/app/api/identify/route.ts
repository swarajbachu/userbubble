import { isValidApiKeyFormat, validateApiKeyWithOrg } from "@userbubble/auth";
import { apiKeyQueries, identifiedUserQueries } from "@userbubble/db/queries";
import { generateId } from "better-auth";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const identifySchema = z.object({
  id: z.string().min(1, "User ID is required"),
  email: z.string().email("Valid email is required"),
  name: z.string().optional(),
  avatar: z.string().optional(),
});

/**
 * Platform-Agnostic Identify Endpoint
 * POST /api/identify
 *
 * Works for ALL platforms: React Native, Web, Desktop, APIs!
 * Authenticates users using API keys and creates identified user records
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Extract and validate API key from header
    const apiKeyHeader = request.headers.get("X-API-Key");
    console.log(apiKeyHeader, "api");

    if (!apiKeyHeader) {
      return NextResponse.json(
        { error: "Missing X-API-Key header" },
        { status: 401 }
      );
    }

    // 2. Validate API key format
    if (!isValidApiKeyFormat(apiKeyHeader)) {
      return NextResponse.json(
        { error: "Invalid API key format" },
        { status: 401 }
      );
    }

    // 3. Parse request body
    const body = await request.json();
    console.log("[identify] Request body:", body);
    const validation = identifySchema.safeParse(body);

    if (!validation.success) {
      console.error(
        "[identify] Validation failed:",
        validation.error.flatten()
      );
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { id: externalId, email, name, avatar } = validation.data;

    // 4. Validate API key efficiently using HMAC hash (O(1) lookup!)
    const validated = await validateApiKeyWithOrg(apiKeyHeader);

    if (!validated) {
      return NextResponse.json(
        { error: "Invalid or expired API key" },
        { status: 401 }
      );
    }

    // 5. Update lastUsedAt timestamp (async, don't block)
    void apiKeyQueries.updateLastUsed(validated.apiKey.id);

    // 6. Create or update identified user
    const identifiedUserRecord = await identifiedUserQueries.upsert({
      id: generateId(),
      organizationId: validated.organization.id,
      externalId,
      email,
      name: name ?? email.split("@")[0] ?? "User",
      avatar: avatar ?? null,
      userId: null, // Not linked to real user
    });

    if (!identifiedUserRecord) {
      return NextResponse.json(
        { error: "Failed to create identified user record" },
        { status: 500 }
      );
    }

    // 7. Return success (no sessions, no cookies!)
    return NextResponse.json({
      success: true,
      user: {
        id: identifiedUserRecord.externalId,
        email: identifiedUserRecord.email,
        name: identifiedUserRecord.name,
        avatar: identifiedUserRecord.avatar,
      },
      organizationSlug: validated.organization.slug,
    });
  } catch (error) {
    console.error("[identify] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
