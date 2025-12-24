import { isValidApiKeyFormat, verifyApiKey } from "@userbubble/auth";
import {
  apiKeyQueries,
  identifiedUserQueries,
  organizationQueries,
} from "@userbubble/db/queries";
import { generateId } from "better-auth";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "~/auth/server";

const identifySchema = z.object({
  id: z.string().min(1, "User ID is required"),
  email: z.string().email("Valid email is required"),
  name: z.string().optional(),
  avatar: z.string().optional(),
});

/**
 * Mobile SDK Identify Endpoint
 * POST /api/mobile/identify
 *
 * Authenticates mobile SDK users using API keys and creates identified user sessions
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Extract and validate API key from header
    const apiKeyHeader = request.headers.get("X-API-Key");

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
    const validation = identifySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { id: externalId, email, name, avatar } = validation.data;

    // 4. Find matching API key by verifying hash
    let matchedKeyId: string | null = null;
    let matchedOrganizationId: string | null = null;
    let matchedOrganizationSlug: string | null = null;

    // Get all organizations to check their API keys
    const orgs = await organizationQueries.listAll();

    for (const org of orgs) {
      const keys = await apiKeyQueries.listByOrganization(org.id);
      const activeKeys = keys.filter((k) => k.isActive);

      for (const key of activeKeys) {
        const isValid = await verifyApiKey(apiKeyHeader, key.keyHash);
        if (isValid) {
          // Check if key is expired
          if (key.expiresAt && new Date() > new Date(key.expiresAt)) {
            continue; // Skip expired keys
          }

          matchedKeyId = key.id;
          matchedOrganizationId = org.id;
          matchedOrganizationSlug = org.slug;
          break;
        }
      }

      if (matchedKeyId) {
        break;
      }
    }

    const isValidMatch =
      matchedKeyId !== null &&
      matchedOrganizationId !== null &&
      matchedOrganizationSlug !== null;

    if (!isValidMatch) {
      return NextResponse.json(
        { error: "Invalid or inactive API key" },
        { status: 401 }
      );
    }

    // 5. Update lastUsedAt timestamp (async, don't block)
    // At this point, we've validated all values are non-null
    void apiKeyQueries.updateLastUsed(matchedKeyId as string);

    // 6. Find or create user using Better Auth adapter
    const adapter = (
      auth as unknown as { options: { database: { adapter: unknown } } }
    ).options.database.adapter;

    type BetterAuthAdapter = {
      findOne: <T>(params: {
        model: string;
        where: Array<{ field: string; operator: string; value: unknown }>;
      }) => Promise<T | null>;
      create: <T>(params: {
        model: string;
        data: Record<string, unknown>;
      }) => Promise<T>;
      update: (params: {
        model: string;
        where: Array<{ field: string; operator: string; value: unknown }>;
        update: Record<string, unknown>;
      }) => Promise<void>;
    };

    const betterAuthAdapter = adapter as BetterAuthAdapter;

    type User = {
      id: string;
      email: string;
      name: string;
      image: string | null;
      emailVerified: boolean;
      createdAt: Date;
      updatedAt: Date;
    };

    let user = await betterAuthAdapter.findOne<User>({
      model: "user",
      where: [{ field: "email", operator: "eq", value: email }],
    });

    if (user) {
      // Update user info if changed
      await betterAuthAdapter.update({
        model: "user",
        where: [{ field: "id", operator: "eq", value: user.id }],
        update: {
          name: name ?? user.name,
          image: avatar ?? user.image,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new user
      const sanitizedUsername =
        email.split("@")[0]?.replace(/[\W_]+/g, "") ?? "user";
      const randomSuffix = Math.random().toString(36).substring(2, 10);
      const generatedName = name ?? `${sanitizedUsername}${randomSuffix}`;

      user = await betterAuthAdapter.create<User>({
        model: "user",
        data: {
          email,
          name: generatedName,
          image: avatar ?? null,
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // 7. Create or update identified user link
    // We've validated matchedOrganizationId is non-null above
    await identifiedUserQueries.upsert({
      id: generateId(),
      userId: user.id,
      organizationId: matchedOrganizationId as string,
      externalId,
    });

    // 8. Create session using Better Auth adapter
    const sessionDuration = 7 * 24 * 60 * 60; // 7 days in seconds
    const expiresAt = new Date(Date.now() + sessionDuration * 1000);
    const token = generateId();

    type Session = {
      id: string;
      userId: string;
      token: string;
      expiresAt: Date;
      ipAddress: string | null;
      userAgent: string | null;
      createdAt: Date;
      updatedAt: Date;
      sessionType: string;
      authMethod: string;
      activeOrganizationId: string;
    };

    const session = await betterAuthAdapter.create<Session>({
      model: "session",
      data: {
        userId: user.id,
        token,
        expiresAt,
        ipAddress: request.headers.get("x-forwarded-for") ?? null,
        userAgent: request.headers.get("user-agent") ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
        sessionType: "identified",
        authMethod: "mobile",
        activeOrganizationId: matchedOrganizationId as string,
      },
    });

    // 9. Build response with session cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.image,
      },
      organizationSlug: matchedOrganizationSlug as string,
    });

    // 10. Set session cookie manually
    // Cookie format matches Better Auth's session cookie
    const isProduction = process.env.NODE_ENV === "production";
    const cookieDomain = isProduction ? ".userbubble.com" : ".host.local";

    const cookieValue = [
      `better-auth.session_token=${session.token}`,
      "Path=/",
      `Domain=${cookieDomain}`,
      "HttpOnly",
      "Secure",
      "SameSite=None",
      `Max-Age=${7 * 24 * 60 * 60}`, // 7 days
    ].join("; ");

    response.headers.set("Set-Cookie", cookieValue);

    return response;
  } catch (error) {
    console.error("[mobile/identify] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
