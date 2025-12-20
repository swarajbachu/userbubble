import "server-only";

import { initAuth } from "@userbubble/auth";
import { nextCookies } from "better-auth/next-js";
import { env } from "~/env";

function getBaseUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  if (env.NEXT_PUBLIC_APP_URL) {
    return env.NEXT_PUBLIC_APP_URL;
  }
  return "http://localhost:3000";
}

const baseUrl = getBaseUrl();

export const auth = initAuth({
  baseUrl,
  productionUrl: env.NEXT_PUBLIC_APP_URL ?? "https://userbubble.com",
  secret: process.env.AUTH_SECRET,
  googleClientId: process.env.AUTH_GOOGLE_ID ?? "",
  googleClientSecret: process.env.AUTH_GOOGLE_SECRET ?? "",
  extraPlugins: [nextCookies()],
});
