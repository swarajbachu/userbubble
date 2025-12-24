import { expo } from "@better-auth/expo";
import { db } from "@userbubble/db/client";
import * as schema from "@userbubble/db/schema";
import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { organization } from "better-auth/plugins";

import { externalLogin } from "./plugins/external-login";

export function initAuth<
  TExtraPlugins extends BetterAuthPlugin[] = [],
>(options: {
  baseUrl: string;
  productionUrl: string;
  secret: string | undefined;

  googleClientId: string;
  googleClientSecret: string;
  extraPlugins?: TExtraPlugins;
}) {
  const config = {
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        ...schema,
      },
    }),
    baseURL: options.baseUrl,
    secret: options.secret,
    advanced: {
      crossSubDomainCookies: {
        enabled: true,
        domain:
          process.env.NODE_ENV === "production"
            ? ".userbubble.com"
            : ".host.local",
      },
      useSecureCookies: true,
      disableCSRFCheck: false,
      defaultCookieAttributes: {
        sameSite: "None",
        secure: true,
      },
    },
    emailAndPassword: {
      enabled: true,
    },
    plugins: [
      // oAuthProxy({
      //   productionURL: options.productionUrl,
      // }),
      expo(),
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
      ...(options.extraPlugins ?? []),
    ],
    socialProviders: {
      google: {
        clientId: options.googleClientId,
        clientSecret: options.googleClientSecret,
        redirectURI: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`,
      },
    },
    trustedOrigins: [
      "expo://",
      "http://localhost:3000",
      options.baseUrl,
      "https://*.userbubble.com",
      "https://*.host.local",
      "https://delulusocial.host.local",
    ],
    onAPIError: {
      onError(error, ctx) {
        console.error("BETTER AUTH API ERROR", error, ctx);
      },
    },
  } satisfies BetterAuthOptions;

  return betterAuth(config);
}

export type Auth = ReturnType<typeof initAuth>;
export type Session = Auth["$Infer"]["Session"];

// Export API key utilities for mobile SDK authentication
export {
  generateApiKey,
  getKeyPreview,
  hashApiKey,
  isValidApiKeyFormat,
  verifyApiKey,
} from "./utils/api-key";
// Export HMAC utilities for SDK and backend usage
export {
  createHMACSignature,
  generateSecretKey,
  type HMACData,
  isTimestampValid,
  verifyHMAC,
} from "./utils/hmac";
