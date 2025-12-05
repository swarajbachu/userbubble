import { expo } from "@better-auth/expo";
import { db } from "@critichut/db/client";
import * as schema from "@critichut/db/schema";
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
    session: {
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // 5 minutes (300 seconds)
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
        // redirectURI: `${options.productionUrl}/api/auth/callback/google`,
      },
    },
    trustedOrigins: ["expo://", "http://localhost:3000"],
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

// Export HMAC utilities for SDK and backend usage
export {
  createHMACSignature,
  generateSecretKey,
  type HMACData,
  isTimestampValid,
  verifyHMAC,
} from "./utils/hmac";
