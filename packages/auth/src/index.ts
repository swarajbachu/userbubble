import { type AgentAuthOptions, agentAuth } from "@better-auth/agent-auth";
import { cimd } from "@better-auth/cimd";
import { fetchClientMetadataResource } from "@better-auth/cimd/node";
import { expo } from "@better-auth/expo";
import { mcp } from "@better-auth/mcp";
import { db } from "@userbubble/db/client";
import { memberQueries } from "@userbubble/db/queries";
import * as schema from "@userbubble/db/schema";
import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { jwt, organization } from "better-auth/plugins";
import { cookieOptions } from "./cookie-options";
import { embedAuth } from "./plugins/embed-auth";
import { externalLogin } from "./plugins/external-login";
import { managementSessionGuard } from "./plugins/management-session";

export function initAuth(options: {
  baseUrl: string;
  productionUrl: string;
  secret: string | undefined;

  googleClientId: string;
  googleClientSecret: string;
  extraPlugins?: BetterAuthPlugin[];
  agent?: AgentAuthOptions;
}) {
  const config = {
    baseURL: options.baseUrl,
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        ...schema,
      },
    }),
    secret: options.secret,
    session: {
      additionalFields: {
        sessionType: {
          type: "string",
          input: false,
          defaultValue: "authenticated",
        },
        authMethod: {
          type: "string",
          input: false,
          defaultValue: "credential",
        },
      },
    },
    advanced: cookieOptions({
      baseUrl: options.baseUrl,
      baseDomain: process.env.NEXT_PUBLIC_BASE_DOMAIN,
      production: process.env.NODE_ENV === "production",
    }),
    emailAndPassword: {
      enabled: true,
    },
    plugins: [
      // oAuthProxy({
      //   productionURL: options.productionUrl,
      // }),
      managementSessionGuard(),
      expo(),
      jwt(),
      mcp({
        loginPage: "/sign-in",
        consentPage: "/connect/consent",
        resource: `${options.baseUrl}/api/mcp`,
        scopes: ["openid", "profile", "offline_access", "userbubble:manage"],
        allowDynamicClientRegistration: true,
        allowUnauthenticatedClientRegistration: true,
        postLogin: {
          page: "/connect/workspace",
          shouldRedirect: async ({ user, session }) =>
            typeof session.activeOrganizationId !== "string" ||
            !(await memberQueries.findByUserAndOrg(
              user.id,
              session.activeOrganizationId
            )),
          consentReferenceId: async ({ user, session }) => {
            const organizationId = session.activeOrganizationId;
            if (
              typeof organizationId !== "string" ||
              session.sessionType === "identified" ||
              !(await memberQueries.findByUserAndOrg(user.id, organizationId))
            ) {
              throw new Error("Select a workspace you belong to");
            }
            return organizationId;
          },
        },
        customAccessTokenClaims: async ({ user, referenceId }) => {
          if (
            !(
              user &&
              referenceId &&
              (await memberQueries.findByUserAndOrg(user.id, referenceId))
            )
          ) {
            throw new Error("Workspace access is no longer available");
          }
          return { organizationId: referenceId };
        },
      }),
      cimd({ fetchClientMetadataResource, metadataProfile: "mcp-2026-07-28" }),
      agentAuth({
        providerName: "UserBubble",
        allowDynamicHostRegistration: true,
        modes: ["delegated"],
        defaultHostCapabilities: [],
        deviceAuthorizationPage: "/connect/approve",
        ...options.agent,
      }),
      // Organization plugin for multi-tenancy
      // Note: Custom fields (secretKey, settings) are defined in the manual schema at packages/db/src/org/organization.sql.ts
      organization({
        allowUserToCreateOrganization: true,
        creatorRole: "owner",
        membershipLimit: 100,
        schema: {
          organization: {
            additionalFields: {
              website: {
                type: "string",
                input: true,
                required: false,
              },
              onboarding: {
                type: "string",
                input: true,
                required: false,
              },
            },
          },
        },
      }),
      // External login plugin for HMAC authentication
      externalLogin({
        sessionDuration: 7 * 24 * 60 * 60, // 7 days
        requireTimestamp: true,
        blockAdminAccounts: true,
        maxTimestampAge: 300, // 5 minutes
      }),
      // Embed auth plugin for SDK identify + encrypted token flow
      embedAuth({
        sessionDuration: 7 * 24 * 60 * 60, // 7 days
        blockAdminAccounts: true,
      }),
      ...(options.extraPlugins ?? []),
    ],
    socialProviders: {
      google: {
        clientId: options.googleClientId,
        clientSecret: options.googleClientSecret,
        redirectURI: `${new URL(options.baseUrl).origin}/api/auth/callback/google`,
      },
    },
    trustedOrigins: [
      "expo://",
      "http://localhost:3000",
      options.productionUrl,
      "https://*.userbubble.com",
      "https://*.gesturs.com",
      "https://app.gesturs.com",
      "userbubble://",
    ],
    onAPIError: {
      onError() {
        // Adapter errors may contain SQL parameters, including credentials.
        console.error("AUTH_REQUEST_FAILED");
      },
    },
  } satisfies BetterAuthOptions;

  return betterAuth(config);
}

export type Auth = ReturnType<typeof initAuth>;
export type Session = Auth["$Infer"]["Session"];

export type { AgentAuthOptions, AgentSession } from "@better-auth/agent-auth";
// Keep callback errors in the same Better Auth module instance as its plugins.
export { APIError as AuthAPIError } from "better-auth";
// Export API key utilities for platform-agnostic SDK authentication
export {
  generateApiKey,
  getKeyPreview,
  hashApiKey,
  isValidApiKeyFormat,
  verifyApiKey,
} from "./utils/api-key";
// Export auth token utilities for embed session exchange
export { createAuthToken, verifyAuthToken } from "./utils/auth-token";
// Export HMAC utilities for SDK and backend usage
export {
  createHMACSignature,
  generateSecretKey,
  type HMACData,
  isTimestampValid,
  verifyHMAC,
} from "./utils/hmac";
export { validateApiKeyWithOrg } from "./utils/validate-api-key";
