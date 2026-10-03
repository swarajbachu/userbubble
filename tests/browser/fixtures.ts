import type { APIRequestContext, APIResponse, Page } from "@playwright/test";

/** Retry only explicit throttling, respecting the production cooldown. */
async function withSignupRetry<
  T extends Pick<APIResponse, "status" | "headers">,
>(submit: () => Promise<T>): Promise<T> {
  let response = await submit();
  for (let retry = 0; response.status() === 429 && retry < 2; retry++) {
    const headers = response.headers();
    const seconds = Number(headers["retry-after"] ?? headers["x-retry-after"]);
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > 10) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, seconds * 1000 + 100));
    response = await submit();
  }
  return response;
}

export function signUp(
  request: APIRequestContext,
  options: Parameters<APIRequestContext["post"]>[1]
) {
  return withSignupRetry(() =>
    request.post("/api/auth/sign-up/email", options)
  );
}

/** Submit the real UI again after a 429; never bypass signup with an API fixture. */
export function signUpThroughForm(page: Page) {
  return withSignupRetry(async () => {
    const response = page.waitForResponse(
      (result) =>
        new URL(result.url()).pathname === "/api/auth/sign-up/email" &&
        result.request().method() === "POST"
    );
    await page.getByRole("button", { name: "Sign up", exact: true }).click();
    return response;
  });
}
