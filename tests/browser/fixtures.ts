import type { APIRequestContext } from "@playwright/test";

/** Respect the production signup limit when many local fixtures share an IP. */
export async function signUp(
  request: APIRequestContext,
  options: Parameters<APIRequestContext["post"]>[1]
) {
  let response = await request.post("/api/auth/sign-up/email", options);
  for (let retry = 0; response.status() === 429 && retry < 2; retry++) {
    const headers = response.headers();
    const seconds = Number(headers["retry-after"] ?? headers["x-retry-after"]);
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > 10) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, seconds * 1000 + 100));
    response = await request.post("/api/auth/sign-up/email", options);
  }
  return response;
}
