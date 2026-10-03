import { randomBytes } from "node:crypto";
import { expect, test } from "@playwright/test";
import { signUp } from "./fixtures";

const LOCAL_APP = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;
test("credential creation shows the raw key once and revocation reaches the SDK", async ({
  page,
  context,
  baseURL,
}) => {
  test.setTimeout(120_000);
  test.skip(!LOCAL_APP.test(baseURL ?? ""), "Disposable local instances only");
  const nonce = randomBytes(6).toString("hex");
  const headers = { Origin: baseURL ?? "" };
  const signup = await signUp(context.request, {
    headers,
    data: {
      name: "Credential Owner",
      email: `${nonce}@credentials.example`,
      password: `Local-${nonce}-password`,
    },
  });
  expect(signup.ok()).toBe(true);
  const organization = await (
    await context.request.post("/api/v2/operations/organization.create", {
      headers,
      data: { name: "Credentials workspace", slug: `credentials-${nonce}` },
    })
  ).json();
  await page.goto(`/org/${organization.data.slug}/settings`);
  await page.getByRole("tab", { name: "API Keys" }).click();
  await page
    .getByRole("button", { name: "Create API Key", exact: true })
    .first()
    .click();
  const dialog = page.getByRole("dialog", {
    name: "Create API Key",
    exact: true,
  });
  await dialog
    .getByRole("textbox", { name: "Name", exact: true })
    .fill("Browser installation");
  await dialog.getByRole("button", { name: "Create Key", exact: true }).click();
  const success = page.getByRole("dialog", {
    name: "API Key Created Successfully",
  });
  await expect(success).toBeVisible({ timeout: 30_000 });
  const rawKey = await success.locator("code").textContent();
  expect(rawKey?.startsWith("ub_")).toBe(true);
  await success.getByRole("button", { name: "Done" }).click();
  await expect(success).not.toBeVisible();
  const list = await (
    await context.request.post("/api/v2/operations/apiKey.list", {
      headers,
      data: { organizationId: organization.data.id },
    })
  ).json();
  expect(list.data).toHaveLength(1);
  expect(list.data[0]).not.toHaveProperty("keyHash");
  expect(list.data[0]).not.toHaveProperty("rawKey");
  const sdk = () =>
    context.request.get("/api/v1/changelog", {
      headers: { "X-API-Key": rawKey ?? "" },
    });
  expect((await sdk()).status()).toBe(200);
  await page.getByRole("button", { name: "Revoke", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Restore", exact: true })
  ).toBeVisible();
  expect((await sdk()).status()).toBe(401);
  await page.getByRole("button", { name: "Restore", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Revoke", exact: true })
  ).toBeVisible();
  expect((await sdk()).status()).toBe(200);
  await expect(page.getByText(rawKey ?? "", { exact: true })).not.toBeVisible();
});
