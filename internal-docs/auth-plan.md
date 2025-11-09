# critichut Authentication Architecture Plan

> **Complete implementation guide for multi-tenant user feedback platform with external authentication**

**Last Updated:** 2025-11-08
**Status:** Planning Phase
**Timeline:** 2-3 weeks MVP

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [User Types](#user-types)
3. [Authentication Flows](#authentication-flows)
4. [Account Claiming](#account-claiming)
5. [Implementation Details](#implementation-details)
6. [Security Considerations](#security-considerations)
7. [Widget Integration](#widget-integration)
8. [Database Schema](#database-schema)
9. [API Endpoints](#api-endpoints)
10. [Deployment Guide](#deployment-guide)

---

## Architecture Overview

### System Design

critichut is a multi-tenant SaaS platform where:

- **Organizations** have isolated feedback boards at `{org-slug}.critichut.com`
- **Identified users** from customer applications auto-authenticate via HMAC-signed tokens
- **Real users** can claim their identified activity by signing up with the same email
- **Admins** manage organizations and cannot use external authentication (security)

### Key Technologies

- **Better Auth v1.4.0-beta.9** - Authentication with custom plugins
- **Organization Plugin** - Multi-tenancy primitives
- **Custom External Login Plugin** - HMAC-based auto-authentication
- **critichut JavaScript SDK** - Safari-compatible auto-login (URL token-based)
- **Drizzle ORM** - Type-safe database queries
- **PostgreSQL** - Primary database
- **Next.js 16** - Web application (subdomain routing)
- **Expo** - Mobile application
- **tRPC** - Type-safe API layer

### Authentication Strategy

critichut uses a **UserJot-style SDK approach** for seamless auto-login:

1. **Customer embeds JavaScript SDK** on their site
2. **SDK identifies user** with HMAC signature from customer's backend
3. **User clicks feedback link** → SDK appends auth token to URL
4. **critichut validates token** → Creates session with first-party cookie
5. **URL cleaned** → Token removed, user authenticated

**Key advantage:** Safari-compatible (no third-party cookies needed)

**See detailed docs:**
- [authentication-flow.md](authentication-flow.md) - Complete flow documentation
- [sdk-implementation.md](sdk-implementation.md) - SDK technical specs
- [customer-integration-guide.md](customer-integration-guide.md) - Customer setup guide

---

## User Types

### 1. Organization Admins/Owners (Real critichut Accounts)

**Who they are:**
- Create and manage critichut organizations
- B2B customers who pay for the service
- Configure feedback boards, branding, integrations

**Authentication:**
- Email/password via Better Auth
- OAuth (Google, GitHub, Google)
- Cannot use external authentication (security measure)

**Capabilities:**
- Create organizations
- Invite team members
- Manage organization settings
- Generate API keys and secret keys
- View analytics
- Manage feedback (change status, respond to users)

**Database:**
```typescript
user {
  id: "user_abc123",
  email: "admin@company.com",
  name: "Admin User",
  emailVerified: true,
  createdAt: "2024-01-01",
  // Has password hash in account table
}

member {
  userId: "user_abc123",
  organizationId: "org_xyz",
  role: "owner" | "admin" | "member"
}
```

---

### 2. Identified Feedback Users (Virtual Users - No Password)

**Who they are:**
- End users of customer applications
- Submit feedback across multiple critichut organizations
- Don't have critichut passwords (just "identified" by external ID + email)
- Can later "claim" their activity by creating a real account

**Authentication:**
- HMAC-signed tokens from customer's backend via JavaScript SDK
- Auto-created on first visit via URL token authentication
- Session managed by Better Auth with first-party cookies
- Identity verified by customer's signature
- Safari-compatible (no third-party cookies)

**Capabilities:**
- Submit feedback
- Vote on feedback
- Comment on feedback
- View public feedback
- **Cannot** create organizations
- **Cannot** access admin features

**Database:**
```typescript
user {
  id: "user_def456",
  email: "john@example.com",
  name: "John Doe",
  emailVerified: false, // No password, not verified
  image: "https://customer.com/avatar.jpg",
  createdAt: "2024-01-10"
  // NO password hash
}

identifiedUser {
  id: "iu_123",
  userId: "user_def456",
  organizationId: "org_xyz",
  externalId: "customer_user_12345", // Customer's user ID
  lastSeenAt: "2024-01-15"
}
```

**Key Point:** One critichut user can be identified by multiple organizations with different external IDs.

**Example:**
```
critichut User: john@example.com (user_def456)
├── Identified by Org A as "customer_a_user_999"
├── Identified by Org B as "customer_b_user_777"
└── Identified by Org C as "customer_c_user_555"

John can submit feedback to all three organizations seamlessly!
```

---

### 3. Public/Anonymous Users (Configurable Per Org)

**Who they are:**
- Visitors who aren't authenticated
- Can optionally submit feedback if org allows

**Authentication:**
- None (anonymous)
- Optionally provide email for notifications

**Capabilities:**
- Submit feedback (if enabled by org)
- View public feedback
- **Cannot** vote, comment, or track submissions

**Database:**
```typescript
feedback {
  userId: null, // or special "anonymous" user ID
  email: "anonymous@example.com", // Optional
  isAnonymous: true
}
```

---

## Authentication Flows

### Flow 1: External Authentication (Identified Users)

**UserJot-style seamless login from customer's application**

```
┌─────────────────────────────────────────────────────────────────┐
│              Customer's Application (customer-app.com)          │
│                                                                 │
│  User logged in as:                                            │
│    - ID: customer_user_12345                                   │
│    - Email: john@example.com                                   │
│    - Name: John Doe                                            │
└────────────────────────────┬────────────────────────────────────┘
                            │
                            │ 1. User clicks "Submit Feedback"
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│              Customer's Backend (Node.js/Python/etc)            │
│                                                                 │
│  1. Receive request with user info                             │
│  2. Generate HMAC signature:                                   │
│                                                                 │
│     const timestamp = Date.now();                              │
│     const data = JSON.stringify({                              │
│       externalId: "customer_user_12345",                       │
│       email: "john@example.com",                               │
│       name: "John Doe",                                        │
│       timestamp: timestamp,                                    │
│       organizationSlug: "org1"                                 │
│     });                                                         │
│                                                                 │
│     const signature = crypto                                   │
│       .createHmac('sha256', SECRET_KEY)                        │
│       .update(data)                                            │
│       .digest('base64');                                       │
│                                                                 │
│  3. Build signed URL:                                          │
│     https://org1.critichut.com/auth/external?                  │
│       external_id=customer_user_12345&                         │
│       email=john@example.com&                                  │
│       name=John Doe&                                           │
│       timestamp=1704067200000&                                 │
│       signature=base64EncodedHMAC                              │
│                                                                 │
│  4. Redirect user to signed URL                                │
└────────────────────────────┬────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                 critichut (org1.critichut.com)                  │
│                                                                 │
│  1. Extract query parameters                                   │
│  2. Validate timestamp (within 5 minutes)                      │
│  3. Lookup organization by subdomain "org1"                    │
│  4. Fetch organization's secret key (encrypted in DB)          │
│  5. Verify HMAC signature                                      │
│                                                                 │
│     const isValid = verifyHMAC(userData, signature, secretKey);│
│                                                                 │
│  6. If valid:                                                  │
│     a. Check if user exists (by email)                         │
│     b. If not, create new user (no password)                   │
│     c. Link to organization via identifiedUser table           │
│     d. Create Better Auth session                              │
│     e. Set session cookie                                      │
│     f. Redirect to /feedback                                   │
│                                                                 │
│  7. User is now logged in!                                     │
│     - Can submit feedback                                      │
│     - Can vote and comment                                     │
│     - Session lasts 7 days                                     │
└─────────────────────────────────────────────────────────────────┘
```

**Security Features:**

1. **HMAC Signature Verification** - Prevents tampering
2. **Timestamp Validation** - 5-minute window prevents replay attacks
3. **Per-Organization Secrets** - Each org has unique secret key
4. **Encrypted Storage** - Secret keys encrypted in database
5. **No Password Required** - Users don't need critichut credentials

---

### Flow 2: Admin Authentication (Real Accounts)

**Standard Better Auth flow for organization owners**

```
User → https://app.critichut.com/login
     → Email/password or OAuth (Google, GitHub, Google)
     → Better Auth validates credentials
     → Creates session
     → Redirects to dashboard
```

**Key Difference:** Admin accounts CANNOT use external authentication to prevent privilege escalation attacks.

---

### Flow 3: Account Claiming (Identified → Real Account)

**Identified user creates a real critichut account**

```
Timeline:

Day 1: User identified via external auth
├── john@example.com auto-authenticated from customer-app.com
├── Submits 5 feedback items to org1.critichut.com
└── User record created (no password)

Day 30: User wants to create real critichut account
├── Visits app.critichut.com/signup
├── Signs up with john@example.com + password
└── System detects existing user with same email

Account Merge Process:
├── 1. Check if user already exists (by email)
├── 2. If exists and has NO password:
│   ├── Add password hash to account
│   ├── Set emailVerified = true
│   ├── Keep all existing feedback, votes, comments
│   └── User is "upgraded" to real account
├── 3. If exists and HAS password:
│   └── Show error: "Account already exists, please login"
└── 4. User can now:
    ├── Login directly with email/password
    ├── Create their own organizations
    ├── Still access all previous feedback
    └── Get identified by other orgs (dual mode)
```

**Database Changes:**

```typescript
// Before (identified user)
user {
  id: "user_def456",
  email: "john@example.com",
  emailVerified: false,
}
account {} // Empty - no password

// After (claimed account)
user {
  id: "user_def456", // Same ID!
  email: "john@example.com",
  emailVerified: true,
}
account {
  userId: "user_def456",
  providerId: "credential",
  password: "$2a$10$hashed..." // Now has password
}
```

**Implementation:**

```typescript
// In Better Auth signup handler
async function handleSignup(email: string, password: string) {
  // Check for existing user
  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, email),
    with: { accounts: true }
  });

  if (existingUser) {
    // Check if identified user (no password)
    const hasPassword = existingUser.accounts.some(
      acc => acc.providerId === "credential"
    );

    if (hasPassword) {
      throw new Error("Account already exists. Please login.");
    }

    // Upgrade identified user to real account
    await db.insert(account).values({
      userId: existingUser.id,
      providerId: "credential",
      password: await hashPassword(password),
    });

    await db.update(user)
      .set({ emailVerified: true })
      .where(eq(user.id, existingUser.id));

    return {
      user: existingUser,
      upgraded: true,
      message: "Account claimed! Your previous feedback is now linked to your account."
    };
  }

  // Create new user
  return createNewUser(email, password);
}
```

---

## Account Claiming

### Why This Matters

**User Journey:**
1. User discovers critichut through customer's feedback link
2. Seamlessly submits feedback (no friction, no signup)
3. Engages with multiple organizations over time
4. Decides they want direct access (not just via customer links)
5. Signs up with same email
6. **Gets all their previous activity automatically!**

### Implementation Strategy

**Email is the Universal Identifier:**

```typescript
// Primary key for user identity across the system
const EMAIL_AS_IDENTITY = true;

// When creating identified user
async function createIdentifiedUser(data: ExternalUserData) {
  // Check if user with this email already exists
  let user = await db.query.user.findFirst({
    where: eq(user.email, data.email)
  });

  if (!user) {
    // Create new user (no password)
    user = await db.insert(user).values({
      id: createId(),
      email: data.email,
      name: data.name,
      image: data.avatar,
      emailVerified: false, // Not verified (no password)
    }).returning()[0];
  } else {
    // User exists - update their info if changed
    await db.update(user)
      .set({
        name: data.name || user.name,
        image: data.avatar || user.image,
      })
      .where(eq(user.id, user.id));
  }

  // Link to organization via identifiedUser
  await db.insert(identifiedUser).values({
    id: createId(),
    userId: user.id,
    organizationId: data.organizationId,
    externalId: data.externalId,
  }).onConflictDoUpdate({
    target: [identifiedUser.organizationId, identifiedUser.externalId],
    set: { lastSeenAt: new Date() }
  });

  return user;
}
```

### User Experience

**Before Claiming:**
```
User: john@example.com
├── Can only access via customer's signed links
├── No direct login to critichut
├── No ability to create organizations
└── Feedback scattered across different org boards
```

**After Claiming:**
```
User: john@example.com (now has password)
├── Can login directly at app.critichut.com
├── Can create their own organizations
├── Can view all feedback they've submitted (across orgs)
├── Can still be identified by external systems
└── Has unified dashboard of all activity
```

### Merge Conflicts

**What if user has different names across organizations?**

```
Org A identifies user as: "John Doe"
Org B identifies user as: "Johnny D"
User signs up as: "John David Doe"

Solution: Use the most recent or user's chosen name
- On signup, let user confirm/edit their name
- Show warning: "We found activity under different names"
- Allow user to choose which name to keep
```

**What if user uses different emails?**

```
Org A identifies: john@personal.com
Org B identifies: john@work.com

Problem: These will be treated as separate users!

Solution: Email verification + account linking
- Allow users to add secondary emails
- Verify both emails
- Merge accounts manually (admin feature)
```

---

## Implementation Details

### Database Schema

**Complete schema with relationships:**

```typescript
// packages/db/src/schema/organization.ts
export const organization = pgTable("organization", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  secretKey: text("secret_key").notNull(), // Encrypted
  allowPublicFeedback: boolean("allow_public_feedback").default(false),
  settings: jsonb("settings").$type<{
    theme?: {
      primaryColor: string;
      logo?: string;
    };
    features?: {
      votingEnabled: boolean;
      commentsEnabled: boolean;
    };
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdateFn(() => new Date()),
});

// packages/db/src/schema/identified-user.ts
export const identifiedUser = pgTable("identified_user", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  organizationId: text("organization_id").notNull().references(() => organization.id, { onDelete: "cascade" }),
  externalId: text("external_id").notNull(),
  lastSeenAt: timestamp("last_seen_at").defaultNow().notNull(),
}, (table) => ({
  // One external ID per organization
  uniqueOrgExternal: unique().on(table.organizationId, table.externalId),
}));

// packages/db/src/schema/feedback.ts
export const feedback = pgTable("feedback", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  organizationId: text("organization_id").notNull().references(() => organization.id),
  userId: text("user_id").notNull().references(() => user.id),
  title: text("title").notNull(),
  description: text("description"),
  status: text("status").$type<"open" | "planned" | "in_progress" | "completed" | "closed">().default("open"),
  upvotes: integer("upvotes").default(0),
  category: text("category"),
  isPublic: boolean("is_public").default(true),
  isAnonymous: boolean("is_anonymous").default(false),
  anonymousEmail: text("anonymous_email"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdateFn(() => new Date()),
});

// packages/db/src/schema/vote.ts
export const vote = pgTable("vote", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  feedbackId: text("feedback_id").notNull().references(() => feedback.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // One vote per user per feedback
  uniqueUserFeedback: unique().on(table.userId, table.feedbackId),
}));

// packages/db/src/schema/comment.ts
export const comment = pgTable("comment", {
  id: text("id").primaryKey().$defaultFn(() => createId()),
  feedbackId: text("feedback_id").notNull().references(() => feedback.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdateFn(() => new Date()),
});
```

**Indexes for Performance:**

```sql
-- Identified user lookups
CREATE INDEX idx_identified_user_org_external
ON identified_user(organization_id, external_id);

CREATE INDEX idx_identified_user_user_id
ON identified_user(user_id);

-- Feedback queries
CREATE INDEX idx_feedback_org_status
ON feedback(organization_id, status);

CREATE INDEX idx_feedback_org_created
ON feedback(organization_id, created_at DESC);

CREATE INDEX idx_feedback_user
ON feedback(user_id);

-- Vote lookups
CREATE INDEX idx_vote_feedback
ON vote(feedback_id);

CREATE INDEX idx_vote_user
ON vote(user_id);

-- Comment queries
CREATE INDEX idx_comment_feedback
ON comment(feedback_id, created_at DESC);

-- Organization lookups
CREATE INDEX idx_organization_slug
ON organization(slug);

-- User lookups
CREATE INDEX idx_user_email
ON "user"(email);
```

---

### Better Auth Configuration

**Complete auth setup with all plugins:**

```typescript
// packages/auth/src/index.ts

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins/organization";
import { jwt } from "better-auth/plugins/jwt";
import { bearer } from "better-auth/plugins/bearer";
import { apiKey } from "better-auth/plugins/api-key";
import { multiSession } from "better-auth/plugins/multi-session";
import { oAuthProxy } from "better-auth/plugins/oauth-proxy";
import { expo } from "@better-auth/expo";
import { externalLogin } from "./plugins/external-login";
import { db } from "@critichut/db/client";

export function initAuth(options: {
  baseUrl: string;
  productionUrl: string;
  secret: string | undefined;
  googleClientId: string;
  googleClientSecret: string;
  googleClientId?: string;
  googleClientSecret?: string;
  githubClientId?: string;
  githubClientSecret?: string;
}) {
  return betterAuth({
    database: drizzleAdapter(db, { provider: "pg" }),
    baseURL: options.baseUrl,
    secret: options.secret,

    // Session configuration
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // Refresh after 1 day
      freshAge: 60 * 60 * 24, // Fresh for 1 day
    },

    // Cross-subdomain cookie support
    advanced: {
      crossSubDomainCookies: {
        enabled: true,
        domain: ".critichut.com", // Replace with your domain
      },
      useSecureCookies: process.env.NODE_ENV === "production",
    },

    // CORS configuration
    trustedOrigins: [
      "https://critichut.com",
      "https://*.critichut.com",
      "expo://",
      // Dynamic validation for customer domains
      async (request) => {
        const origin = request.headers.get("origin");
        // TODO: Validate against allowed customer domains in DB
        return true; // For now, allow all
      },
    ],

    plugins: [
      // Multi-tenancy
      organization({
        allowUserToCreateOrganization: true,
        organizationLimit: 5,
        membershipLimit: 100,
        creatorRole: "owner",
      }),

      // External login (custom plugin)
      externalLogin({
        sessionDuration: 7 * 24 * 60 * 60,
        requireTimestamp: true,
        blockAdminAccounts: true,
      }),

      // Token authentication for widgets
      jwt({
        jwt: {
          expirationTime: "15m",
        },
      }),

      bearer({
        requireSignature: true,
      }),

      // API keys for widget authentication
      apiKey({
        keyExpiration: {
          enabled: true,
          defaultExpiresIn: 365, // 1 year
        },
      }),

      // Multiple sessions
      multiSession({
        maximumSessions: 5,
      }),

      // OAuth proxy for development
      oAuthProxy({
        productionURL: options.productionUrl,
      }),

      // Expo mobile support
      expo(),
    ],

    socialProviders: {
      google: {
        clientId: options.googleClientId,
        clientSecret: options.googleClientSecret,
      },
      google: options.googleClientId && options.googleClientSecret ? {
        clientId: options.googleClientId,
        clientSecret: options.googleClientSecret,
      } : undefined,
      github: options.githubClientId && options.githubClientSecret ? {
        clientId: options.githubClientId,
        clientSecret: options.githubClientSecret,
      } : undefined,
    },
  });
}
```

---

### External Login Plugin

**Complete implementation:**

```typescript
// packages/auth/src/plugins/external-login.ts

import type { BetterAuthPlugin } from "better-auth";
import { createAuthEndpoint } from "better-auth/api";
import { setSessionCookie } from "better-auth/cookies";
import { APIError } from "better-call";
import { z } from "zod";
import { createId } from "@paralleldrive/cuid2";
import {
  verifyHMAC,
  isTimestampValid,
  decryptSecretKey
} from "../utils/hmac";

export interface ExternalLoginOptions {
  sessionDuration?: number;
  requireTimestamp?: boolean;
  blockAdminAccounts?: boolean;
}

export const externalLogin = (
  options: ExternalLoginOptions = {}
): BetterAuthPlugin => {
  return {
    id: "external-login",

    endpoints: {
      externalSignIn: createAuthEndpoint(
        "/external-login/sign-in",
        {
          method: "POST",
          body: z.object({
            externalId: z.string(),
            email: z.string().email(),
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
          if (options.requireTimestamp !== false) {
            if (!isTimestampValid(body.timestamp)) {
              throw new APIError("BAD_REQUEST", {
                message: "Token expired or timestamp invalid",
              });
            }
          }

          // 2. Fetch organization and secret key
          const org = await ctx.context.adapter.findOne({
            model: "organization",
            where: [
              {
                field: "slug",
                operator: "=",
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
          let user = await ctx.context.adapter.findOne({
            model: "user",
            where: [
              {
                field: "email",
                operator: "=",
                value: body.email,
              },
            ],
          });

          let userId: string;

          if (!user) {
            // Create new user (no password)
            const newUser = await ctx.context.adapter.create({
              model: "user",
              data: {
                id: createId(),
                email: body.email,
                name: body.name || body.email.split("@")[0],
                image: body.avatar,
                emailVerified: false,
              },
            });
            userId = newUser.id;
          } else {
            // Check if user is admin (has organization membership)
            if (options.blockAdminAccounts) {
              const isAdmin = await ctx.context.adapter.findOne({
                model: "member",
                where: [
                  {
                    field: "userId",
                    operator: "=",
                    value: user.id,
                  },
                ],
              });

              if (isAdmin) {
                throw new APIError("FORBIDDEN", {
                  message: "Admin accounts cannot use external login. Please login directly.",
                });
              }
            }

            // Update user info if changed
            await ctx.context.adapter.update({
              model: "user",
              where: [{ field: "id", operator: "=", value: user.id }],
              data: {
                name: body.name || user.name,
                image: body.avatar || user.image,
              },
            });
            userId = user.id;
          }

          // 5. Create or update identifiedUser link
          const existingLink = await ctx.context.adapter.findOne({
            model: "identifiedUser",
            where: [
              {
                field: "organizationId",
                operator: "=",
                value: org.id,
              },
              {
                field: "externalId",
                operator: "=",
                value: body.externalId,
              },
            ],
          });

          if (existingLink) {
            // Update last seen
            await ctx.context.adapter.update({
              model: "identifiedUser",
              where: [{ field: "id", operator: "=", value: existingLink.id }],
              data: {
                lastSeenAt: new Date(),
              },
            });
          } else {
            // Create new link
            await ctx.context.adapter.create({
              model: "identifiedUser",
              data: {
                id: createId(),
                userId,
                organizationId: org.id,
                externalId: body.externalId,
                lastSeenAt: new Date(),
              },
            });
          }

          // 6. Create session
          const session = await ctx.context.adapter.create({
            model: "session",
            data: {
              userId,
              expiresAt: new Date(
                Date.now() + (options.sessionDuration || 7 * 24 * 60 * 60) * 1000
              ),
              ipAddress: ctx.context.request?.headers.get("x-forwarded-for"),
              userAgent: ctx.context.request?.headers.get("user-agent"),
            },
          });

          // Get full user
          const fullUser = await ctx.context.adapter.findOne({
            model: "user",
            where: [{ field: "id", operator: "=", value: userId }],
          });

          // 7. Set session cookie
          await setSessionCookie(ctx, { session, user: fullUser });

          // 8. Return success
          return ctx.json({
            session,
            user: fullUser,
            message: "Successfully authenticated",
          });
        }
      ),
    },
  };
};
```

---

## Two-Tier Session System

### Critical Security Distinction

**The Problem:**

If identified users' sessions propagate across all subdomains without restrictions, a malicious organization could:

1. Create a legitimate organization on critichut
2. Use HMAC to "identify" a victim user with email `victim@email.com`
3. Victim's session cookie propagates to `app.critichut.com`
4. Victim appears "logged in" and could potentially access admin features
5. **MASSIVE SECURITY VULNERABILITY!**

**The Solution:**

Implement a two-tier session system where sessions are marked as either **identified** or **authenticated**, with different permissions for each.

---

### Session Types

#### Tier 1: Identified Session (Limited Scope)

**Created via:** HMAC external authentication

**Capabilities:**
- ✅ Submit feedback
- ✅ Vote on feedback
- ✅ Comment on feedback
- ✅ View public feedback
- ✅ Propagate across subdomains for multi-org feedback
- ❌ **Cannot** create organizations
- ❌ **Cannot** access admin dashboard
- ❌ **Cannot** manage organization settings
- ❌ **Cannot** invite team members

**Use Case:** End users from customer applications who submit feedback across multiple organizations.

#### Tier 2: Authenticated Session (Full Access)

**Created via:** Email/password or OAuth (Google, GitHub, Google)

**Capabilities:**
- ✅ All identified session capabilities
- ✅ Create organizations
- ✅ Access admin dashboard
- ✅ Manage organization settings
- ✅ Invite/manage team members
- ✅ Generate API keys and secret keys
- ✅ View analytics

**Use Case:** Organization owners, admins, and team members who manage critichut organizations.

---

### Database Schema Extension

Add session type tracking to Better Auth's session table:

```typescript
// packages/db/src/schema/session.ts (extend Better Auth schema)

export const session = pgTable("session", {
  // Existing Better Auth fields
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").$onUpdateFn(() => new Date()),

  // NEW: Session type tracking
  sessionType: text("session_type")
    .$type<"identified" | "authenticated">()
    .notNull()
    .default("authenticated"),

  // NEW: Auth method tracking
  authMethod: text("auth_method")
    .$type<"external" | "credential" | "oauth">()
    .notNull(),
});
```

**Session Type Values:**

- `identified` - Created via HMAC external login (limited permissions)
- `authenticated` - Created via password/OAuth (full permissions)

**Auth Method Values:**

- `external` - HMAC-based authentication
- `credential` - Email/password
- `oauth` - Google, GitHub, Google, etc.

---

### External Login Plugin Update

Mark sessions as "identified" when created via HMAC:

```typescript
// packages/auth/src/plugins/external-login.ts

// In externalSignIn endpoint, after user creation/lookup:

// 6. Create identified session
const session = await ctx.context.adapter.create({
  model: "session",
  data: {
    userId,
    expiresAt: new Date(
      Date.now() + (options.sessionDuration || 7 * 24 * 60 * 60) * 1000
    ),
    ipAddress: ctx.context.request?.headers.get("x-forwarded-for"),
    userAgent: ctx.context.request?.headers.get("user-agent"),

    // Mark as identified session (LIMITED SCOPE)
    sessionType: "identified",
    authMethod: "external",
  },
});
```

### Regular Authentication

Better Auth's standard login creates authenticated sessions:

```typescript
// Better Auth handles this automatically for email/password and OAuth
// When user logs in normally, session is created with:

{
  sessionType: "authenticated",
  authMethod: "credential", // or "oauth"
}
```

---

### Middleware Protection

Protect admin routes from identified sessions:

```typescript
// apps/nextjs/src/middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@critichut/auth";

export async function middleware(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: request.headers
  });

  const pathname = request.nextUrl.pathname;

  // Admin routes require AUTHENTICATED session
  const isAdminRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/organizations/new");

  if (isAdminRoute) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Block identified users from admin features
    if (session.session.sessionType === "identified") {
      return NextResponse.redirect(
        new URL("/upgrade-account?reason=admin_required", request.url)
      );
    }
  }

  // Feedback routes allow BOTH identified and authenticated
  const isFeedbackRoute = pathname.startsWith("/feedback");

  if (isFeedbackRoute) {
    // Allow both session types
    // Public feedback may not require session at all (if org allows)
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
```

---

### tRPC Context Updates

Add session type helpers to tRPC context:

```typescript
// packages/api/src/trpc.ts

import { auth } from "@critichut/auth";
import { db } from "@critichut/db/client";

export const createTRPCContext = async (opts: { headers: Headers }) => {
  const session = await auth.api.getSession({ headers: opts.headers });

  return {
    db,
    session,
    auth,

    // Helper functions
    isAuthenticated: session?.session.sessionType === "authenticated",
    isIdentified: session?.session.sessionType === "identified",
    hasSession: !!session,
  };
};

// Base protected procedure (requires ANY session)
export const protectedProcedure = publicProcedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx });
});

// Admin procedure (requires AUTHENTICATED session)
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (!ctx.isAuthenticated) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "This action requires a full account. Please sign up or login.",
    });
  }
  return next({ ctx });
});

// Feedback procedure (allows IDENTIFIED sessions)
export const feedbackProcedure = protectedProcedure.use(({ ctx, next }) => {
  // Both identified and authenticated sessions allowed
  return next({ ctx });
});
```

---

### Router Implementation

Use appropriate procedures based on required permissions:

```typescript
// packages/api/src/router/organization.ts

import { adminProcedure, router } from "../trpc";
import { z } from "zod";

export const organizationRouter = router({
  // Only authenticated users can create organizations
  create: adminProcedure
    .input(z.object({
      name: z.string().min(3).max(50),
      slug: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/),
    }))
    .mutation(async ({ ctx, input }) => {
      const org = await ctx.db.insert(organization).values({
        id: createId(),
        name: input.name,
        slug: input.slug,
        secretKey: encryptSecretKey(generateSecretKey()),
      }).returning();

      // Add user as owner
      await ctx.db.insert(member).values({
        id: createId(),
        organizationId: org[0].id,
        userId: ctx.session.user.id,
        role: "owner",
      });

      return org[0];
    }),

  // Only authenticated users can update settings
  updateSettings: adminProcedure
    .input(z.object({
      organizationId: z.string(),
      settings: z.object({
        allowPublicFeedback: z.boolean().optional(),
        theme: z.object({
          primaryColor: z.string(),
        }).optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user is org admin
      const member = await ctx.db.query.member.findFirst({
        where: and(
          eq(member.organizationId, input.organizationId),
          eq(member.userId, ctx.session.user.id),
        ),
      });

      if (!member || !["owner", "admin"].includes(member.role)) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await ctx.db.update(organization)
        .set(input.settings)
        .where(eq(organization.id, input.organizationId));

      return { success: true };
    }),
});
```

```typescript
// packages/api/src/router/feedback.ts

import { feedbackProcedure, publicProcedure, router } from "../trpc";
import { z } from "zod";

export const feedbackRouter = router({
  // Public listing (no auth required)
  list: publicProcedure
    .input(z.object({
      organizationId: z.string(),
      status: z.enum(["open", "planned", "in_progress", "completed"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.feedback.findMany({
        where: and(
          eq(feedback.organizationId, input.organizationId),
          eq(feedback.isPublic, true),
          input.status ? eq(feedback.status, input.status) : undefined,
        ),
        with: {
          user: {
            columns: { id: true, name: true, image: true },
          },
        },
        orderBy: [desc(feedback.upvotes)],
      });
    }),

  // Feedback creation allows IDENTIFIED users
  create: feedbackProcedure
    .input(z.object({
      organizationId: z.string(),
      title: z.string().min(3).max(200),
      description: z.string().max(2000).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Verify user is identified with this org OR is an admin
      if (!ctx.isAuthenticated) {
        const identified = await ctx.db.query.identifiedUser.findFirst({
          where: and(
            eq(identifiedUser.userId, ctx.session.user.id),
            eq(identifiedUser.organizationId, input.organizationId),
          ),
        });

        if (!identified) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "You must be authenticated via this organization",
          });
        }
      }

      const newFeedback = await ctx.db.insert(feedback).values({
        id: createId(),
        organizationId: input.organizationId,
        userId: ctx.session.user.id,
        title: input.title,
        description: input.description,
        status: "open",
      }).returning();

      return newFeedback[0];
    }),

  // Voting allows IDENTIFIED users
  vote: feedbackProcedure
    .input(z.object({ feedbackId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Toggle vote
      const existing = await ctx.db.query.vote.findFirst({
        where: and(
          eq(vote.feedbackId, input.feedbackId),
          eq(vote.userId, ctx.session.user.id),
        ),
      });

      if (existing) {
        // Remove vote
        await ctx.db.delete(vote).where(eq(vote.id, existing.id));
        return { voted: false };
      } else {
        // Add vote
        await ctx.db.insert(vote).values({
          id: createId(),
          feedbackId: input.feedbackId,
          userId: ctx.session.user.id,
        });
        return { voted: true };
      }
    }),
});
```

---

### Account Upgrade Flow

When identified user signs up for real account, upgrade all their sessions:

```typescript
// packages/auth/src/handlers/signup.ts

async function handleSignup(email: string, password: string) {
  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, email),
    with: {
      accounts: true,
      sessions: true, // Include sessions
    },
  });

  if (existingUser) {
    // Check if identified user (no password)
    const hasPassword = existingUser.accounts.some(
      acc => acc.providerId === "credential"
    );

    if (hasPassword) {
      throw new Error("Account already exists. Please login.");
    }

    // Upgrade identified user to real account
    await db.insert(account).values({
      userId: existingUser.id,
      providerId: "credential",
      password: await hashPassword(password),
    });

    await db.update(user)
      .set({ emailVerified: true })
      .where(eq(user.id, existingUser.id));

    // CRITICAL: Upgrade all existing identified sessions to authenticated
    await db.update(session)
      .set({
        sessionType: "authenticated",
        authMethod: "credential",
      })
      .where(eq(session.userId, existingUser.id));

    return {
      user: existingUser,
      upgraded: true,
      message: "Account upgraded! You now have full access.",
    };
  }

  // Create new user
  return createNewUser(email, password);
}
```

---

### Cross-Subdomain Behavior

#### For Identified Users:

```
Scenario: User identified on org1.critichut.com via HMAC
└─ Session created: { sessionType: "identified", authMethod: "external" }
   └─ Cookie propagates to all subdomains ✅

User visits org2.critichut.com/feedback
├─ Session cookie sent automatically
├─ Better Auth validates session
├─ Session type: "identified" ✅
└─ Can submit feedback ✅

User visits app.critichut.com/dashboard
├─ Session cookie sent automatically
├─ Better Auth validates session
├─ Session type: "identified" ❌
├─ Middleware checks: isAdminRoute && sessionType === "identified"
└─ Redirected to /upgrade-account ❌
```

#### For Authenticated Users:

```
Scenario: User logs in with password on app.critichut.com
└─ Session created: { sessionType: "authenticated", authMethod: "credential" }
   └─ Cookie propagates to all subdomains ✅

User visits org1.critichut.com/feedback
├─ Session cookie sent automatically
├─ Better Auth validates session
├─ Session type: "authenticated" ✅
└─ Can submit feedback ✅

User visits app.critichut.com/dashboard
├─ Session cookie sent automatically
├─ Better Auth validates session
├─ Session type: "authenticated" ✅
├─ Middleware allows access
└─ Full admin access ✅

User can also create organizations ✅
```

---

### Upgrade Account Page

Create a page to encourage identified users to upgrade:

```typescript
// apps/nextjs/src/app/_sites/app/upgrade-account/page.tsx

export default function UpgradeAccountPage({
  searchParams,
}: {
  searchParams: { reason?: string };
}) {
  const reason = searchParams.reason;

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="max-w-md rounded-lg border p-8">
        <h1 className="mb-4 text-2xl font-bold">
          Upgrade Your Account
        </h1>

        {reason === "admin_required" && (
          <p className="mb-6 text-gray-600">
            This feature requires a full critichut account. You're currently
            logged in via external authentication, which only allows feedback
            submission.
          </p>
        )}

        <div className="mb-6 rounded bg-blue-50 p-4">
          <h3 className="mb-2 font-semibold">What you'll get:</h3>
          <ul className="ml-6 list-disc text-sm text-gray-700">
            <li>Create your own organizations</li>
            <li>Manage team members</li>
            <li>Access admin dashboard</li>
            <li>View all your feedback in one place</li>
            <li>Keep all your existing feedback and votes</li>
          </ul>
        </div>

        <div className="flex gap-4">
          <Link
            href="/signup"
            className="flex-1 rounded bg-blue-600 px-4 py-2 text-center text-white"
          >
            Sign Up
          </Link>
          <Link
            href="/login"
            className="flex-1 rounded border px-4 py-2 text-center"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}
```

---

### Security Benefits

This two-tier system prevents:

1. **Privilege Escalation**
   - Identified users cannot access admin features
   - Malicious orgs cannot grant themselves admin access via HMAC

2. **Session Hijacking Impact**
   - Even if identified session is compromised, attacker can only submit feedback
   - Cannot create orgs, cannot access admin panel, cannot modify settings

3. **Account Takeover Protection**
   - Identified users must explicitly upgrade with password/OAuth
   - Cannot accidentally become admin through external auth

4. **Cross-Organization Isolation**
   - Identified users can safely interact with multiple orgs
   - Each org can only "identify" users for feedback, not grant admin access

---

### Implementation Checklist

- [ ] Extend session schema with `sessionType` and `authMethod`
- [ ] Update external login plugin to create identified sessions
- [ ] Implement middleware to block identified users from admin routes
- [ ] Create `adminProcedure` and `feedbackProcedure` in tRPC
- [ ] Update organization router to use `adminProcedure`
- [ ] Update feedback router to use `feedbackProcedure`
- [ ] Implement account upgrade flow (upgrade sessions on signup)
- [ ] Create `/upgrade-account` page with clear messaging
- [ ] Add tests for session type validation
- [ ] Document session type behavior for customers

---

## Security Considerations

### HMAC Signature Security

**Implementation:**

```typescript
// packages/auth/src/utils/hmac.ts

import crypto from "crypto";

export function generateHMAC(
  userData: {
    externalId: string;
    email: string;
    name?: string;
    timestamp: number;
    organizationSlug: string;
  },
  secretKey: string
): string {
  const data = JSON.stringify({
    externalId: userData.externalId,
    email: userData.email,
    name: userData.name,
    timestamp: userData.timestamp,
    organizationSlug: userData.organizationSlug,
  });

  const hmac = crypto.createHmac("sha256", secretKey);
  hmac.update(data);
  return hmac.digest("base64");
}

export function verifyHMAC(
  userData: {
    externalId: string;
    email: string;
    name?: string;
    timestamp: number;
    organizationSlug: string;
  },
  signature: string,
  secretKey: string
): boolean {
  const expectedSignature = generateHMAC(userData, secretKey);

  try {
    // Timing-safe comparison prevents timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature, "base64"),
      Buffer.from(expectedSignature, "base64")
    );
  } catch {
    return false;
  }
}

export function isTimestampValid(timestamp: number): boolean {
  const now = Date.now();
  const maxAge = 5 * 60 * 1000; // 5 minutes
  return Math.abs(now - timestamp) < maxAge;
}

// Secret key encryption/decryption
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32-byte hex
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

export function encryptSecretKey(secretKey: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv
  );
  let encrypted = cipher.update(secretKey, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

export function decryptSecretKey(encrypted: string): string {
  const [ivHex, encryptedData] = encrypted.split(":");
  const iv = Buffer.from(ivHex!, "hex");
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    Buffer.from(ENCRYPTION_KEY, "hex"),
    iv
  );
  let decrypted = decipher.update(encryptedData!, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
```

### Security Checklist

- ✅ **HMAC Signature Verification** - Prevents token tampering
- ✅ **Timestamp Validation** - 5-minute window prevents replay attacks
- ✅ **Timing-Safe Comparison** - Prevents timing attack vulnerabilities
- ✅ **Encrypted Secret Storage** - Keys encrypted at rest
- ✅ **Per-Organization Secrets** - Isolation between organizations
- ✅ **Admin Account Protection** - Admins cannot use external auth
- ✅ **HTTPS Only** - Cookies marked secure in production
- ✅ **HttpOnly Cookies** - Prevent XSS attacks
- ✅ **CORS Validation** - Trusted origins only
- ✅ **Rate Limiting** - Prevent brute force attacks

---

## Widget Integration

### Multiple Widget Types

#### 1. Embedded Widget (iframe)

**Customer embeds widget on their site:**

```html
<!-- Customer's website -->
<script>
  window.critichutConfig = {
    organizationSlug: "acme",
    authEndpoint: "/api/critichut/auth", // Customer's backend
    user: null, // Will be fetched from customer's session
  };
</script>
<script src="https://cdn.critichut.com/widget.js" async></script>
```

**Customer's backend generates signed URL:**

```typescript
// Customer's API route: /api/critichut/auth
export async function POST(req: Request) {
  const session = await getSession(req); // Customer's session

  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const timestamp = Date.now();
  const data = JSON.stringify({
    externalId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    timestamp,
    organizationSlug: "acme",
  });

  const signature = crypto
    .createHmac("sha256", process.env.critichut_SECRET_KEY!)
    .update(data)
    .digest("base64");

  const params = new URLSearchParams({
    external_id: session.user.id,
    email: session.user.email,
    name: session.user.name || "",
    timestamp: timestamp.toString(),
    signature,
  });

  return Response.json({
    signedUrl: `https://acme.critichut.com/auth/external?${params}`,
  });
}
```

#### 2. Direct Link (Redirect)

**Customer generates link and redirects:**

```typescript
// Customer's feedback button handler
async function handleFeedbackClick() {
  const response = await fetch("/api/critichut/auth", { method: "POST" });
  const { signedUrl } = await response.json();

  // Redirect to critichut
  window.location.href = signedUrl;
}
```

#### 3. React Native WebView

**Mobile app integration:**

```typescript
// Customer's React Native app
import { WebView } from "react-native-webview";

function FeedbackScreen() {
  const user = useAuth();
  const signedUrl = generateSignedUrl(user);

  return (
    <WebView
      source={{ uri: signedUrl }}
      onMessage={(event) => {
        // Handle widget events
      }}
    />
  );
}
```

---

## API Endpoints

### External Authentication

**POST `/api/auth/external-login/sign-in`**

Request:
```json
{
  "externalId": "customer_user_123",
  "email": "john@example.com",
  "name": "John Doe",
  "avatar": "https://example.com/avatar.jpg",
  "timestamp": 1704067200000,
  "organizationSlug": "acme",
  "signature": "base64EncodedHMAC"
}
```

Response (Success):
```json
{
  "session": {
    "id": "session_abc",
    "userId": "user_def",
    "expiresAt": "2024-01-15T00:00:00Z"
  },
  "user": {
    "id": "user_def",
    "email": "john@example.com",
    "name": "John Doe"
  },
  "message": "Successfully authenticated"
}
```

Response (Error):
```json
{
  "error": "Invalid signature",
  "code": "UNAUTHORIZED"
}
```

### Feedback API (tRPC)

**List Feedback:**
```typescript
trpc.feedback.list({
  organizationId: "org_xyz",
  status: "open",
  limit: 20
})
```

**Create Feedback:**
```typescript
trpc.feedback.create({
  organizationId: "org_xyz",
  title: "Add dark mode",
  description: "Would love a dark theme option",
  category: "feature-request"
})
```

**Vote:**
```typescript
trpc.feedback.vote({
  feedbackId: "feedback_123"
})
```

---

## Deployment Guide

### Environment Variables

```bash
# Database
POSTGRES_URL=postgresql://user:pass@host:5432/critichut

# Better Auth
AUTH_SECRET=your-random-secret-key-here
AUTH_URL=https://app.critichut.com
PRODUCTION_URL=https://critichut.com

# Encryption (for secret keys)
ENCRYPTION_KEY=64-character-hex-string # Generate with: crypto.randomBytes(32).toString('hex')

# OAuth Providers
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Analytics (Optional)
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

### Vercel Setup

1. **Domain Configuration:**
   - Add domain: `critichut.com`
   - Add wildcard: `*.critichut.com`
   - DNS: CNAME `*.critichut.com` → `cname.vercel-dns.com`

2. **Build Settings:**
   ```json
   {
     "buildCommand": "pnpm build",
     "outputDirectory": "apps/nextjs/.next",
     "installCommand": "pnpm install"
   }
   ```

3. **Edge Functions:**
   - Middleware runs on edge for subdomain routing
   - Low latency for authentication checks

### Database Setup

```bash
# Push schema to database
pnpm db:push

# Create first organization (manual)
INSERT INTO organization (id, name, slug, secret_key)
VALUES (
  'org_test',
  'Test Organization',
  'test',
  -- Encrypted secret key (generate via admin panel)
);
```

---

## Testing Strategy

### Unit Tests

```typescript
// HMAC utilities
describe("HMAC", () => {
  it("should generate and verify valid signature", () => {
    const data = {
      externalId: "user_123",
      email: "test@example.com",
      timestamp: Date.now(),
      organizationSlug: "test",
    };
    const signature = generateHMAC(data, "secret");
    expect(verifyHMAC(data, signature, "secret")).toBe(true);
  });
});
```

### Integration Tests

```typescript
// External login flow
describe("External Login", () => {
  it("should create user and session from valid token", async () => {
    const response = await POST("/api/auth/external-login/sign-in", {
      externalId: "test_user",
      email: "test@example.com",
      timestamp: Date.now(),
      organizationSlug: "test",
      signature: generateValidSignature(),
    });

    expect(response.status).toBe(200);
    expect(response.json).toMatchObject({
      user: { email: "test@example.com" },
    });
  });
});
```

---

## Success Metrics

### MVP Goals (2-3 Weeks)

- ✅ External authentication working
- ✅ Feedback CRUD complete
- ✅ Subdomain routing functional
- ✅ Widget embeddable
- ✅ 1 test customer integrated
- ✅ <200ms API latency
- ✅ Zero security vulnerabilities

### Post-MVP (Future)

- 100+ organizations
- 1000+ identified users
- 10,000+ feedback items
- Widget on 50+ customer sites
- 99.9% uptime
- Enterprise SSO support

---

## FAQ

**Q: Can identified users create organizations?**
A: No, only users with real accounts (password/OAuth) can create organizations.

**Q: Can the same user be identified by multiple organizations?**
A: Yes! One critichut user can have multiple `identifiedUser` entries with different external IDs.

**Q: What happens if external ID changes?**
A: A new `identifiedUser` link is created. The old link remains (user will appear as two different users to that org).

**Q: Can identified users see each other's feedback?**
A: Only public feedback within the same organization. Feedback is fully isolated between organizations.

**Q: How do we prevent admin impersonation via external auth?**
A: The `externalLogin` plugin checks if the user has any organization memberships and blocks authentication if true.

---

**End of Document**
