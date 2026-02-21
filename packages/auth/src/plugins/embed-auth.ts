import type {
  IdentifiedUser,
  Member,
  Session,
  User,
} from "@userbubble/db/schema";
import type { BetterAuthPlugin } from "better-auth";
import { APIError, generateId } from "better-auth";
import { createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { z } from "zod";
import { isValidApiKeyFormat } from "../utils/api-key";
import { createAuthToken, verifyAuthToken } from "../utils/auth-token";
import { decryptSecretKey, isTimestampValid, verifyHMAC } from "../utils/hmac";
import { validateApiKeyWithOrg } from "../utils/validate-api-key";

function sanitizeUsername(str: string): string {
  return str.replace(/[^a-zA-Z0-9]/g, "");
}

export type EmbedAuthOptions = {
  sessionDuration?: number;
  blockAdminAccounts?: boolean;
};

/**
 * Embed Auth Plugin for Better Auth
 *
 * Provides two endpoints for the SDK auth flow:
 *
 * 1. POST /api/auth/embed-auth/identify
 *    - Called cross-origin from the SDK on customer sites
 *    - Validates API key, optionally verifies HMAC
 *    - Creates/finds user, upserts identifiedUser link
 *    - Returns an encrypted auth token (7-day TTL, AES-256-GCM)
 *    - Token is sent as Bearer header in tRPC calls from the iframe
 *    - No session or cookie created
 *
 * 2. POST /api/auth/embed-auth/session
 *    - Called from the external portal (same-origin, non-iframe)
 *    - Exchanges encrypted auth token for a cookie session
 *    - Used when embed redirects to external portal post page
 */
export const embedAuth = (options: EmbedAuthOptions = {}): BetterAuthPlugin => {
  const {
    sessionDuration = 7 * 24 * 60 * 60, // 7 days
    blockAdminAccounts = true,
  } = options;

  return {
    id: "embed-auth",

    endpoints: {
      /**
       * POST /api/auth/embed-auth/identify
       * Cross-origin endpoint called by the SDK.
       * CORS is handled at the route level in the catch-all handler.
       */
      embedAuthIdentify: createAuthEndpoint(
        "/embed-auth/identify",
        {
          method: "POST",
          body: z.object({
            id: z.string().min(1),
            email: z.string().email(),
            name: z.string().optional(),
            avatar: z.string().optional(),
            hmac: z.string().optional(),
            timestamp: z.number().optional(),
            organizationSlug: z.string().optional(),
          }),
          metadata: {
            openapi: {
              description: "Identify a user from the SDK embed",
              responses: {
                200: {
                  description: "User identified, auth token returned",
                },
              },
            },
          },
        },
        async (ctx) => {
          const { body } = ctx;

          // 1. Extract and validate API key
          const apiKeyHeader = ctx.request?.headers.get("X-API-Key");
          if (!apiKeyHeader) {
            throw new APIError("UNAUTHORIZED", {
              message: "Missing X-API-Key header",
            });
          }

          if (!isValidApiKeyFormat(apiKeyHeader)) {
            throw new APIError("UNAUTHORIZED", {
              message: "Invalid API key format",
            });
          }

          // 2. Validate API key and get organization
          const validated = await validateApiKeyWithOrg(apiKeyHeader);
          if (!validated) {
            throw new APIError("UNAUTHORIZED", {
              message: "Invalid or expired API key",
            });
          }

          const org = validated.organization;

          // 3. If HMAC provided, verify signature
          if (body.hmac && body.timestamp) {
            if (!org.secretKey) {
              throw new APIError("BAD_REQUEST", {
                message:
                  "Organization secret key not configured for HMAC verification",
              });
            }

            if (!isTimestampValid(body.timestamp, 300)) {
              throw new APIError("BAD_REQUEST", {
                message: "Token expired or timestamp invalid",
              });
            }

            const secretKey = decryptSecretKey(org.secretKey);
            const isValid = verifyHMAC(
              {
                externalId: body.id,
                email: body.email,
                name: body.name,
                timestamp: body.timestamp,
                organizationSlug: body.organizationSlug ?? org.slug,
              },
              body.hmac,
              secretKey
            );

            if (!isValid) {
              throw new APIError("UNAUTHORIZED", {
                message: "Invalid HMAC signature",
              });
            }
          }

          // 4. Find or create user
          let user = await ctx.context.adapter.findOne<User>({
            model: "user",
            where: [
              {
                field: "email",
                operator: "eq",
                value: body.email,
              },
            ],
          });

          let userId: string;

          if (user) {
            // Block admin accounts
            if (blockAdminAccounts) {
              const isAdmin = await ctx.context.adapter.findOne<Member>({
                model: "member",
                where: [
                  {
                    field: "userId",
                    operator: "eq",
                    value: user.id,
                  },
                ],
              });

              if (isAdmin) {
                throw new APIError("FORBIDDEN", {
                  message:
                    "Admin accounts cannot use embed auth. Please login directly.",
                });
              }
            }

            // Update user info if changed
            await ctx.context.adapter.update({
              model: "user",
              where: [{ field: "id", operator: "eq", value: user.id }],
              update: {
                name: body.name ?? user.name,
                image: body.avatar ?? user.image,
                updatedAt: new Date(),
              },
            });
            userId = user.id;
          } else {
            // Create new user (no password)
            const newUser = await ctx.context.adapter.create<User>({
              model: "user",
              data: {
                email: body.email,
                name:
                  body.name ??
                  // biome-ignore lint/style/noNonNullAssertion: email always has @
                  `${sanitizeUsername(body.email.split("@")[0]!)}${Math.random().toString(36).substring(2, 15)}`,
                image: body.avatar ?? null,
                emailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });
            userId = newUser.id;
            user = newUser;
          }

          // 5. Upsert identifiedUser link
          const existingLink =
            await ctx.context.adapter.findOne<IdentifiedUser>({
              model: "identifiedUser",
              where: [
                {
                  field: "organizationId",
                  operator: "eq",
                  value: org.id,
                },
                {
                  field: "externalId",
                  operator: "eq",
                  value: body.id,
                },
              ],
            });

          if (existingLink) {
            await ctx.context.adapter.update({
              model: "identifiedUser",
              where: [{ field: "id", operator: "eq", value: existingLink.id }],
              update: {
                userId,
                lastSeenAt: new Date(),
                updatedAt: new Date(),
              },
            });
          } else {
            await ctx.context.adapter.create({
              model: "identifiedUser",
              data: {
                id: generateId(),
                userId,
                organizationId: org.id,
                externalId: body.id,
                lastSeenAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });
          }

          // 6. Generate encrypted auth token (7-day TTL, AES-256-GCM)
          const secret = ctx.context.secret;
          const token = createAuthToken(
            {
              sub: userId,
              oid: org.id,
              eid: body.id,
            },
            secret
          );

          // 7. Return token + user info (NO session, NO cookie)
          return ctx.json({
            success: true,
            token,
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            },
            organizationSlug: org.slug,
          });
        }
      ),

      /**
       * POST /api/auth/embed-auth/session
       * Same-origin endpoint for the external portal.
       * Exchanges an encrypted auth token for a cookie session.
       * Used when the embed redirects to the external post page.
       */
      embedAuthSession: createAuthEndpoint(
        "/embed-auth/session",
        {
          method: "POST",
          body: z.object({
            token: z.string().min(1),
          }),
        },
        async (ctx) => {
          const { body } = ctx;

          // 1. Verify and decrypt auth token
          const secret = ctx.context.secret;
          const payload = verifyAuthToken(body.token, secret);

          if (!payload) {
            throw new APIError("UNAUTHORIZED", {
              message: "Invalid or expired auth token",
            });
          }

          // 2. Look up user to confirm exists
          const user = await ctx.context.adapter.findOne<User>({
            model: "user",
            where: [
              {
                field: "id",
                operator: "eq",
                value: payload.sub,
              },
            ],
          });

          if (!user) {
            throw new APIError("NOT_FOUND", {
              message: "User not found",
            });
          }

          // 3. Create session with identified type
          const expiresAt = new Date(Date.now() + sessionDuration * 1000);
          const sessionToken = generateId();

          const session = await ctx.context.adapter.create<Session>({
            model: "session",
            data: {
              userId: user.id,
              token: sessionToken,
              expiresAt,
              ipAddress: ctx.request?.headers.get("x-forwarded-for") ?? null,
              userAgent: ctx.request?.headers.get("user-agent") ?? null,
              createdAt: new Date(),
              updatedAt: new Date(),
              sessionType: "identified",
              authMethod: "external",
              activeOrganizationId: payload.oid,
            },
          });

          // 4. Set session cookie (first-party, same-origin from external portal)
          await setSessionCookie(ctx, { session, user });

          // 5. Return session info
          return ctx.json({
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            },
            session: {
              id: session.id,
              sessionType: "identified",
            },
          });
        }
      ),
    },
  };
};
