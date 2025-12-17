import "server-only";

import { initAuth } from "@userbubble/auth";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { cache } from "react";
import { env } from "~/env";

function getBaseUrl(): string {
  if (env.VERCEL_ENV === "production") {
    return `https://${process.env.NEXT_PUBLIC_APP_URL ?? "userbubble.com"}`;
  }
  if (env.VERCEL_ENV === "preview") {
    return `https://${env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

const baseUrl = getBaseUrl();

export const auth = initAuth({
  baseUrl,
  productionUrl: `https://${process.env.NEXT_PUBLIC_APP_URL ?? "https://app.userbubble.com"}`,
  secret: env.AUTH_SECRET,
  googleClientId: env.AUTH_GOOGLE_ID,
  googleClientSecret: env.AUTH_GOOGLE_SECRET,
  extraPlugins: [nextCookies()],
});

export const getSession = cache(async () =>
  auth.api.getSession({
    headers: await headers(),
  })
);
