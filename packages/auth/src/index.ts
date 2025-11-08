import { db } from "@acme/db/client";
// biome-ignore lint/performance/noNamespaceImport: schema object needed for Drizzle adapter
import * as schema from "@acme/db/schema";
import { expo } from "@better-auth/expo";
import type { BetterAuthOptions, BetterAuthPlugin } from "better-auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { oAuthProxy, organization } from "better-auth/plugins";

import { externalLogin } from "./plugins/external-login";

export function initAuth<
  TExtraPlugins extends BetterAuthPlugin[] = [],
>(options: {
  baseUrl: string;
  productionUrl: string;
  secret: string | undefined;

  discordClientId: string;
  discordClientSecret: string;
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
    plugins: [
      oAuthProxy({
        productionURL: options.productionUrl,
      }),
      expo(),
      // Organization plugin for multi-tenancy
      // Note: Custom fields (secretKey, settings) are defined in the manual schema at packages/db/src/org/organization.sql.ts
      organization({
        allowUserToCreateOrganization: true,
        creatorRole: "owner",
        membershipLimit: 100,
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
      discord: {
        clientId: options.discordClientId,
        clientSecret: options.discordClientSecret,
        redirectURI: `${options.productionUrl}/api/auth/callback/discord`,
      },
    },
    trustedOrigins: ["expo://"],
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
//TODO: fix this later
// biome-ignore lint/performance/noBarrelFile: <TODO: will have to fix later>
export {
  createHMACSignature,
  generateSecretKey,
  type HMACData,
  isTimestampValid,
  verifyHMAC,
} from "./utils/hmac";
