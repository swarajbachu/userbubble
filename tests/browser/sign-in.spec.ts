import { randomBytes } from "node:crypto";
import { expect, test } from "@playwright/test";
import { signUp } from "./fixtures";

const LOCAL = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

test("sign-in retains its callback after authentication", async ({
  page,
  context,
  baseURL,
}) => {
  test.skip(!LOCAL.test(baseURL ?? ""), "Disposable local fixture only");
  const nonce = randomBytes(8).toString("hex");
  const email = `${nonce}@signin.example`;
  const password = `Local-test-${nonce}-password`;
  const registered = await signUp(context.request, {
    headers: { Origin: baseURL ?? "" },
    data: { name: "Sign-in verification", email, password },
  });
  expect(registered.ok(), await registered.text()).toBe(true);
  await context.clearCookies();
  const guestProfile = await context.request.get("/profile", {
    maxRedirects: 0,
  });
  expect(guestProfile.status()).toBe(307);
  expect(new URL(guestProfile.headers().location ?? "", baseURL).href).toBe(
    `${baseURL}/sign-in?callbackUrl=%2Fprofile`
  );
  await page.goto("/sign-in?callbackUrl=%2Fprofile");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(`${baseURL}/profile`);
  await expect(
    page.getByRole("textbox", { name: "Name", exact: true })
  ).toHaveValue("Sign-in verification");
  await page.goto("/sign-in");
  await expect(page).toHaveURL(`${baseURL}/`);
});
