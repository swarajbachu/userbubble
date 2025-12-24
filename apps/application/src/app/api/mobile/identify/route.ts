import { isValidApiKeyFormat, verifyApiKey } from "@userbubble/auth";
import {
  apiKeyQueries,
  identifiedUserQueries,
  organizationQueries,
  userQueries,
} from "@userbubble/db/queries";
import { createUniqueIds } from "@userbubble/db/schema";
import { generateId } from "better-auth";
import { setSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "~/auth/server";

const identifySchema = z.object({
  id: z.string().min(1, "User ID is required"),
  email: z.string().email("Valid email is required"),
  name: z.string().optional(),
  avatar: z.string().url().optional(),
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
    // We need to check all active keys since we don't know which org yet
    let matchedKey: Awaited<ReturnType<typeof apiKeyQueries.findById>> | null =
      null;
    let matchedOrganization: Awaited<
      ReturnType<typeof organizationQueries.findById>
    > | null = null;

    // Get all organizations to check their API keys
    const orgs = await organizationQueries.listAll();

    for (const org of orgs) {
      const keys = await apiKeyQueries.listByOrganization(org.id);
      const activeKeys = keys.filter((k) => k.isActive);

      for (const key of activeKeys) {
        const isValid = await verifyApiKey(apiKeyHeader, key.keyHash);
        if (isValid) {
          matchedKey = key;
          matchedOrganization = org;
          break;
        }
      }

      if (matchedKey) break;
    }

    if (!(matchedKey && matchedOrganization)) {
      return NextResponse.json(
        { error: "Invalid or inactive API key" },
        { status: 401 }
      );
    }

    // 5. Check if key is expired
    if (matchedKey.expiresAt && new Date() > new Date(matchedKey.expiresAt)) {
      return NextResponse.json(
        { error: "API key has expired" },
        { status: 401 }
      );
    }

    // 6. Update lastUsedAt timestamp (async, don't block)
    void apiKeyQueries.updateLastUsed(matchedKey.id);

    // 7. Find or create user
    let user = await userQueries.findByEmail(email);

    if (user) {
      // Update user info if changed
      await userQueries.update(user.id, {
        name: name ?? user.name,
        image: avatar ?? user.image,
      });
    } else {
      // Create new user
      const sanitizedUsername = email
        .split("@")[0]
        ?.replace(/[^\dA-Za-z]/g, "");
      const randomSuffix = Math.random().toString(36).substring(2, 10);
      const generatedName = name ?? `${sanitizedUsername}${randomSuffix}`;

      user = await userQueries.create({
        id: createUniqueIds("user"),
        email,
        name: generatedName,
        image: avatar ?? null,
        emailVerified: false,
      });
    }

    // 8. Create or update identified user link
    await identifiedUserQueries.upsert({
      id: createUniqueIds("user"),
      userId: user.id,
      organizationId: matchedOrganization.id,
      externalId,
    });

    // 9. Create session using Better Auth
    const sessionDuration = 7 * 24 * 60 * 60; // 7 days in seconds
    const expiresAt = new Date(Date.now() + sessionDuration * 1000);
    const token = generateId();

    // Get Better Auth adapter from auth instance
    const authApi = auth.api;
    const adapter = (
      auth as unknown as { options: { database: { adapter: unknown } } }
    ).options.database.adapter;

    // Use Better Auth adapter to create session
    const session = await (
      adapter as {
        create: (params: {
          model: string;
          data: {
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
        }) => Promise<{
          id: string;
          userId: string;
          expiresAt: Date;
          sessionType: string;
          activeOrganizationId: string;
        }>;
      }
    ).create({
      model: "session",
      data: {
        userId: user.id,
        token,
        expiresAt,
        ipAddress: request.headers.get("x-forwarded-for") ?? null,
        userAgent: request.headers.get("user-agent") ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
        // Custom userbubble fields
        sessionType: "identified",
        authMethod: "mobile",
        activeOrganizationId: matchedOrganization.id,
      },
    });

    // 10. Set session cookie
    // Convert Next.js Request to web Request for Better Auth
    const webRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
    });

    const ctx = {
      request: webRequest,
      // biome-ignore lint: Better Auth typing issue
      headers: new Headers(),
      // biome-ignore lint: Better Auth typing issue
      setCookie: () => {},
    } as unknown as Parameters<typeof setSessionCookie>[0];

    await setSessionCookie(ctx, { session, user });

    // Build response with cookies
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.image,
      },
      organizationSlug: matchedOrganization.slug,
    });

    // Copy cookies from Better Auth context to Next.js response
    for (const [key, value] of ctx.headers.entries()) {
      if (key.toLowerCase() === "set-cookie") {
        response.headers.set("set-cookie", value);
      }
    }

    return response;
  } catch (error) {
    console.error("[mobile/identify] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
