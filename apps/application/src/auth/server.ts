import {
  ApplicationError,
  agentCapabilities,
  executeAgentOperation,
} from "@userbubble/api/management";
import "server-only";

import { AuthAPIError as APIError, initAuth } from "@userbubble/auth";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { cache } from "react";
import { env } from "~/env";

function getBaseUrl(): string {
  if (env.VERCEL_ENV === "production") {
    return `${process.env.NEXT_PUBLIC_APP_URL ?? "https://app.userbubble.com"}`;
  }
  if (env.VERCEL_ENV === "preview") {
    return `https://${env.VERCEL_URL}`;
  }
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

const baseUrl = getBaseUrl();
export const applicationOrigin = new URL(baseUrl).origin;

export const auth = initAuth({
  baseUrl,
  productionUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://app.userbubble.com"}`,
  secret: env.AUTH_SECRET,
  googleClientId: env.AUTH_GOOGLE_ID,
  googleClientSecret: env.AUTH_GOOGLE_SECRET,
  extraPlugins: [nextCookies()],
  agent: {
    capabilities: agentCapabilities(),
    onExecute: async ({
      capability,
      arguments: input,
      agentSession,
      ctx,
    }): Promise<unknown> => {
      try {
        return await executeAgentOperation(
          auth,
          agentSession,
          {
            id: capability,
            requestId: ctx.request?.headers.get("x-request-id") ?? undefined,
          },
          input
        );
      } catch (error) {
        if (error instanceof ApplicationError) {
          throw new APIError(
            error.code === "TIMEOUT" ? "GATEWAY_TIMEOUT" : error.code,
            {
              error: error.code.toLowerCase(),
              message: error.message,
            }
          );
        }
        throw new APIError("INTERNAL_SERVER_ERROR", {
          error: "internal_error",
          message: "Operation failed",
        });
      }
    },
  },
});

export const getSession = cache(async () =>
  auth.api.getSession({
    headers: await headers(),
  })
);
