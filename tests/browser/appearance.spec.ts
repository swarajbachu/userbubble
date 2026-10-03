import { randomBytes } from "node:crypto";
import { expect, test } from "@playwright/test";
import { signUp } from "./fixtures";

const LOCAL = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;
test("dashboard branding patches preserve other settings and reach public surfaces", async ({
  page,
  context,
  baseURL,
}) => {
  test.skip(!LOCAL.test(baseURL ?? ""), "Disposable local instances only");
  const id = randomBytes(6).toString("hex");
  const headers = { Origin: baseURL ?? "" };
  const signup = await signUp(context.request, {
    headers,
    data: {
      name: "Appearance Owner",
      email: `${id}@appearance.example`,
      password: `Local-${id}-password`,
    },
  });
  expect(signup.ok()).toBe(true);
  const call = async (operation: string, data: unknown) => {
    const response = await context.request.post(
      `/api/v2/operations/${operation}`,
      { headers, data }
    );
    expect(response.ok(), await response.text()).toBe(true);
    return (await response.json()).data;
  };
  const org = await call("organization.create", {
    name: "Appearance workspace",
    slug: `appearance-${id}`,
  });
  await call("settings.updateSettings", {
    organizationId: org.id,
    settings: {
      branding: { accentColor: "#abcdef" },
      feedback: { enableDigestEmails: true },
    },
  });
  await page.goto(`/org/${org.slug}/settings`);
  await page.getByRole("tab", { name: "Branding", exact: true }).click();
  await page.getByPlaceholder("#000000", { exact: true }).fill("#123456");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(
    page.getByText("Settings saved successfully", { exact: true })
  ).toBeVisible();
  const saved = await call("organization.get", { organizationId: org.id });
  const settings = JSON.parse(saved.metadata);
  expect(settings.branding).toMatchObject({
    primaryColor: "#123456",
    accentColor: "#abcdef",
  });
  expect(settings.feedback.enableDigestEmails).toBe(true);
  await page.reload();
  await page.getByRole("tab", { name: "Branding", exact: true }).click();
  await expect(page.getByPlaceholder("#000000", { exact: true })).toHaveValue(
    "#123456"
  );
  for (const path of [
    `/external/${org.slug}`,
    `/embed/${org.slug}/changelog`,
  ]) {
    await page.goto(path);
    const branding = page.locator('[style*="--brand-primary"]');
    await expect(branding).toHaveCSS("--brand-primary", "#123456");
    await expect(branding).toHaveCSS("--brand-accent", "#abcdef");
  }
});
