import { randomBytes } from "node:crypto";
import { expect, test } from "@playwright/test";

const COMPLETE_URL = /\/complete$/;
const LOCAL_APP = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

test("signup, profile completion and domain-only onboarding create a usable workspace", async ({
  page,
  context,
  baseURL,
}) => {
  test.setTimeout(120_000);
  test.skip(!LOCAL_APP.test(baseURL ?? ""), "Disposable local fixture only");
  const id = randomBytes(6).toString("hex");
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/sign-up");
  await page
    .getByLabel("Email", { exact: true })
    .fill(`${id}@onboarding.example`);
  await page
    .getByLabel("Password", { exact: true })
    .fill(`Local-test-${id}-password`);
  await page.getByRole("button", { name: "Sign up", exact: true }).click();
  await expect(page).toHaveURL(COMPLETE_URL);
  await page.getByLabel("First name").fill("Onboarding");
  await page.getByLabel("Last name").fill("Tester");
  await page.getByRole("button", { name: "Complete", exact: true }).click();
  const website = page.getByPlaceholder("mywebsite.com");
  await website.fill("https://");
  await expect(
    page.getByRole("button", { name: "Next", exact: true })
  ).toBeDisabled();
  await website.fill("example.test");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByPlaceholder("My Workspace").fill(`Workspace ${id}`);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByPlaceholder("acme-inc").fill(`onboarding-${id}`);
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Get Started", exact: true }).click();
  await expect(page).toHaveURL(`/org/onboarding-${id}/getting-started`);
  const response = await context.request.post(
    "/api/v2/operations/organization.list",
    {
      headers: { Origin: baseURL ?? "" },
      data: {},
    }
  );
  expect(response.ok()).toBe(true);
  const { data } = await response.json();
  expect(data).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        slug: `onboarding-${id}`,
        website: "https://example.test/",
      }),
    ])
  );
  await page.goto("/connect/approve");
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "invalid or has expired"
  );
  await expect(page.getByText("Loading request…")).toHaveCount(0);
  await page.goto("/connect/consent");
  await expect(page.locator("main").getByRole("alert")).toHaveText(
    "Invalid connection request"
  );
  await expect(page.getByText("Checking request…")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Deny", exact: true })
  ).toBeDisabled();
  await expect(
    page.getByRole("button", { name: "Allow access" })
  ).toBeDisabled();
  expect(errors).toEqual([]);
});
