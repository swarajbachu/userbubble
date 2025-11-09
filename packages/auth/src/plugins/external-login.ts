import type {
  IdentifiedUser,
  Member,
  Organization,
  Session,
  User,
} from "@critichut/db/schema";
import type { BetterAuthPlugin } from "better-auth";
import { APIError, generateId } from "better-auth";
import { createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { z } from "zod";
import { decryptSecretKey, isTimestampValid, verifyHMAC } from "../utils/hmac";

/**
 * Sanitizes a string to only contain alphanumeric characters (letters and numbers)
 * @param str - The string to sanitize
 * @returns The sanitized string with only letters and numbers
 */
function sanitizeUsername(str: string): string {
  return str.replace(/[^a-zA-Z0-9]/g, "");
}

export type ExternalLoginOptions = {
  /**
   * Session duration in seconds
   * @default 604800 (7 days)
   */
  sessionDuration?: number;

  /**
   * Require timestamp validation
   * @default true
   */
  requireTimestamp?: boolean;

  /**
   * Block admin accounts from using external login
   * @default true
   */
  blockAdminAccounts?: boolean;

  /**
   * Maximum timestamp age in seconds
   * @default 300 (5 minutes)
   */
  maxTimestampAge?: number;
};

/**
 * External Login Plugin for Better Auth
 *
 * Enables HMAC-based authentication for external users from customer applications.
 * Creates "identified" sessions with limited scope to prevent security vulnerabilities.
 *
 * ## Authentication Flow (Step-by-Step)
 *
 * This plugin implements a secure 7-step authentication process for external users:
 *
 * ### Step 1: Timestamp Validation (Replay Attack Prevention)
 * - **What**: Validates that the request timestamp is within the allowed time window (default: 5 minutes)
 * - **Why**: Prevents replay attacks where an attacker could reuse a stolen signature
 * - **How**: Compares current server time with the provided timestamp
 * - **Security**: Even if a signature is intercepted, it expires after `maxTimestampAge` seconds
 * - **Code**: `isTimestampValid(body.timestamp, maxTimestampAge)`
 *
 * ### Step 2: Organization Lookup
 * - **What**: Fetches the organization record using the provided slug
 * - **Why**: Validates that the organization exists and retrieves its encrypted secret key
 * - **How**: Database query using Better Auth adapter: `findOne<Organization>`
 * - **Multi-tenancy**: Each organization has its own secret key for signature verification
 * - **Throws**: `NOT_FOUND` if organization doesn't exist
 *
 * ### Step 3: HMAC Signature Verification
 * - **What**: Verifies the HMAC-SHA256 signature using the organization's secret key
 * - **Why**: Ensures the request came from the legitimate customer application
 * - **How**:
 *   1. Decrypts the organization's secret key (stored encrypted in database)
 *   2. Reconstructs the same data payload (externalId, email, name, timestamp, organizationSlug)
 *   3. Computes HMAC-SHA256 hash using the secret key
 *   4. Uses timing-safe comparison to prevent timing attacks
 * - **Security**: Only the customer's backend knows the secret key, browsers never see it
 * - **Throws**: `UNAUTHORIZED` if signature doesn't match
 *
 * ### Step 4: User Lookup or Creation
 * - **What**: Finds existing user by email or creates a new user account
 * - **Why**: Users need a CriticHut account to leave feedback and participate
 * - **How**:
 *   - **Existing User**: Checks if user with this email already exists
 *     - **Admin Check**: If `blockAdminAccounts` is enabled, checks if user has organization membership
 *     - **Protection**: Prevents admin accounts from being accessed via external login
 *     - **Updates**: Refreshes user's name and avatar if they changed in customer's system
 *   - **New User**: Creates a new user account with:
 *     - Email from the request
 *     - Name from request or generated from email (e.g., "john123abc")
 *     - No password (external users don't need passwords)
 *     - `emailVerified: false` (they're identified via HMAC, not email verification)
 * - **Throws**: `FORBIDDEN` if admin tries to use external login
 *
 * ### Step 5: Identified User Link (External ID Mapping)
 * - **What**: Creates or updates the mapping between customer's user ID and CriticHut user ID
 * - **Why**: Allows same external user to return and maintain their identity
 * - **How**:
 *   - Queries `identifiedUser` table for existing link (organizationId + externalId)
 *   - **Existing Link**: Updates `userId` and `lastSeenAt` (handles email changes)
 *   - **New Link**: Creates new record linking externalId → userId → organizationId
 * - **Multi-tenancy**: Same email can have different external IDs across organizations
 * - **Example**: `user@example.com` could be:
 *   - `customer_123` in Organization A
 *   - `uid_789` in Organization B
 *
 * ### Step 6: Session Creation (Two-Tier System)
 * - **What**: Creates a session with `sessionType: "identified"` instead of `"authenticated"`
 * - **Why**: Limits access scope to prevent security vulnerabilities
 * - **How**:
 *   - Generates secure session token using Better Auth's `generateId()`
 *   - Sets expiration (default: 7 days)
 *   - Records IP address and user agent for security
 *   - **Custom Fields**:
 *     - `sessionType: "identified"` - Marks this as limited-access session
 *     - `authMethod: "external"` - Tracks how user authenticated
 *     - `activeOrganizationId` - Links session to the organization context
 * - **Security**: Middleware can check `sessionType` to restrict admin routes
 *
 * ### Step 7: Cookie & Response
 * - **What**: Sets session cookie and returns user/session data
 * - **Why**: Creates authenticated session in browser (first-party cookie)
 * - **How**:
 *   - Uses Better Auth's `setSessionCookie()` to set secure, httpOnly cookie
 *   - Returns JSON with session details and user info
 * - **Safari Compatible**: First-party cookie avoids Safari's ITP restrictions
 * - **Response**: Client receives session data to confirm authentication
 *
 * ## Security Features
 *
 * - **HMAC-SHA256**: Industry-standard signature algorithm
 * - **Timing-Safe Comparison**: Prevents timing attacks on signature verification
 * - **Replay Attack Prevention**: Timestamp validation with configurable window
 * - **Multi-Tenancy Isolation**: Each organization has separate secret key
 * - **Admin Protection**: Blocks admin accounts from external login by default
 * - **Two-Tier Sessions**: "identified" vs "authenticated" for access control
 * - **Encrypted Secret Keys**: Organization secrets stored encrypted in database
 *
 * ## Multi-Tenancy Support
 *
 * - Each customer organization has a unique `secretKey` for HMAC signing
 * - Same email can map to different users across organizations
 * - Sessions are scoped to organization via `activeOrganizationId`
 * - External IDs are namespaced by organization (org A's "user_123" ≠ org B's "user_123")
 *
 * ## Example Request Flow
 *
 * ```typescript
 * // Customer's backend generates signature
 * const signature = generateHMAC({
 *   externalId: "customer_12345",
 *   email: "john@example.com",
 *   name: "John Doe",
 *   timestamp: Date.now(),
 *   organizationSlug: "acme-corp"
 * }, secretKey);
 *
 * // Customer's frontend calls our endpoint
 * POST /api/auth/external-login/sign-in
 * {
 *   "externalId": "customer_12345",
 *   "email": "john@example.com",
 *   "name": "John Doe",
 *   "timestamp": 1704067200000,
 *   "organizationSlug": "acme-corp",
 *   "signature": "a1b2c3d4e5f6..."
 * }
 *
 * // Response sets cookie and returns
 * {
 *   "session": { "sessionType": "identified", ... },
 *   "user": { "id": "...", "email": "john@example.com", ... },
 *   "message": "Successfully authenticated"
 * }
 * ```
 *
 * @param options - Configuration options for the external login plugin
 * @param options.sessionDuration - Session lifetime in seconds (default: 7 days)
 * @param options.requireTimestamp - Enable timestamp validation (default: true)
 * @param options.blockAdminAccounts - Block admin users from external login (default: true)
 * @param options.maxTimestampAge - Maximum allowed timestamp age in seconds (default: 5 minutes)
 * @returns Better Auth plugin configuration
 */
export const externalLogin = (
  options: ExternalLoginOptions = {}
): BetterAuthPlugin => {
  const {
    sessionDuration = 7 * 24 * 60 * 60, // 7 days
    requireTimestamp = true,
    blockAdminAccounts = true,
    maxTimestampAge = 300, // 5 minutes
  } = options;

  return {
    id: "external-login",

    endpoints: {
      /**
       * External sign-in endpoint
       * POST /api/auth/external-login/sign-in
       */
      externalSignIn: createAuthEndpoint(
        "/external-login/sign-in",
        {
          method: "POST",
          body: z.object({
            externalId: z.string(),
            email: z.email(),
            name: z.string().optional(),
            avatar: z.string().optional(),
            timestamp: z.number(),
            organizationSlug: z.string(),
            signature: z.string(),
          }),
        },
        async (ctx) => {
          const { body } = ctx;

          // 1. Validate timestamp
          if (
            requireTimestamp &&
            !isTimestampValid(body.timestamp, maxTimestampAge)
          ) {
            throw new APIError("BAD_REQUEST", {
              message: "Token expired or timestamp invalid",
            });
          }

          // 2. Fetch organization and secret key
          const org = await ctx.context.adapter.findOne<Organization>({
            model: "organization",
            where: [
              {
                field: "slug",
                operator: "eq",
                value: body.organizationSlug,
              },
            ],
          });

          if (!org) {
            throw new APIError("NOT_FOUND", {
              message: "Organization not found",
            });
          }

          // 3. Verify HMAC signature
          const secretKey = decryptSecretKey(org.secretKey);
          const isValid = verifyHMAC(
            {
              externalId: body.externalId,
              email: body.email,
              name: body.name,
              timestamp: body.timestamp,
              organizationSlug: body.organizationSlug,
            },
            body.signature,
            secretKey
          );

          if (!isValid) {
            throw new APIError("UNAUTHORIZED", {
              message: "Invalid signature",
            });
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
            // Check if user is admin (has organization membership)
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
                    "Admin accounts cannot use external login. Please login directly.",
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
                  `${
                    // biome-ignore lint/style/noNonNullAssertion: <this wont be null, coz email will always have @>
                    sanitizeUsername(body.email.split("@")[0]!)
                  }${Math.random().toString(36).substring(2, 15)}`,
                image: body.avatar ?? null,
                emailVerified: false,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });
            userId = newUser.id;
            user = newUser;
          }

          // 5. Create or update identifiedUser link
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
                  value: body.externalId,
                },
              ],
            });

          if (existingLink) {
            // Update last seen and user ID (in case email changed)
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
            // Create new link
            await ctx.context.adapter.create({
              model: "identifiedUser",
              data: {
                id: generateId(),
                userId,
                organizationId: org.id,
                externalId: body.externalId,
                lastSeenAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });
          }

          // 6. Create session with identified type
          const expiresAt = new Date(Date.now() + sessionDuration * 1000);
          const token = generateId();

          const session = await ctx.context.adapter.create<Session>({
            model: "session",
            data: {
              userId,
              token,
              expiresAt,
              ipAddress: ctx.request?.headers.get("x-forwarded-for") ?? null,
              userAgent: ctx.request?.headers.get("user-agent") ?? null,
              createdAt: new Date(),
              updatedAt: new Date(),
              // Custom critichut fields
              sessionType: "identified",
              authMethod: "external",
              activeOrganizationId: org.id,
            },
          });

          // 7. Set session cookie
          if (!user) {
            throw new APIError("INTERNAL_SERVER_ERROR", {
              message: "User should exist at this point",
            });
          }

          await setSessionCookie(ctx, { session, user });

          // 8. Return success
          return ctx.json({
            session: {
              id: session.id,
              userId: session.userId,
              expiresAt: session.expiresAt,
              sessionType: session.sessionType,
              activeOrganizationId: session.activeOrganizationId,
            },
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              image: user.image,
            },
            message: "Successfully authenticated",
          });
        }
      ),
    },

    /**
     * Schema additions for identifiedUser model
     */
    schema: {
      identifiedUser: {
        fields: {
          userId: {
            type: "string",
            required: true,
            references: {
              model: "user",
              field: "id",
            },
          },
          organizationId: {
            type: "string",
            required: true,
            references: {
              model: "organization",
              field: "id",
            },
          },
          externalId: {
            type: "string",
            required: true,
          },
          lastSeenAt: {
            type: "date",
            required: true,
          },
          createdAt: {
            type: "date",
            required: true,
          },
          updatedAt: {
            type: "date",
            required: true,
          },
        },
      },
    },
  };
};
