import { randomBytes } from "node:crypto";
import { expect, test } from "@playwright/test";
import { signUp } from "./fixtures";

const LOCAL = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;
const ERROR_BOUNDARY =
  /Application error|Something went wrong|Internal Server Error/;

test("dashboard, public and embedded page routes render with live content", async ({
  page,
  context,
  baseURL,
}) => {
  test.setTimeout(120_000);
  test.skip(!LOCAL.test(baseURL ?? ""), "Disposable local fixture only");
  const id = randomBytes(6).toString("hex");
  const headers = { Origin: baseURL ?? "" };
  expect(
    (
      await signUp(context.request, {
        headers,
        data: {
          name: "Route Tester",
          email: `${id}@routes.example`,
          password: `Local-test-${id}-password`,
        },
      })
    ).ok()
  ).toBe(true);
  const call = async (operation: string, data: unknown) => {
    const response = await context.request.post(
      `/api/v2/operations/${operation}`,
      { headers, data }
    );
    expect(response.ok(), await response.text()).toBe(true);
    return (await response.json()).data;
  };
  const org = await call("organization.create", {
    name: `Routes ${id}`,
    slug: `routes-${id}`,
  });
  const post = await call("feedback.create", {
    organizationId: org.id,
    title: "Route verification feedback",
    description: "A public request to verify every route.",
    category: "feature_request",
    isPublic: true,
  });
  await call("feedback.updateStatus", {
    organizationId: org.id,
    postId: post.id,
    status: "planned",
  });
  const release = await call("changelog.create", {
    organizationId: org.id,
    title: "Route verification release",
    description: "<p>Published release content.</p>",
    isPublished: true,
  });
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const dashboard = `/org/${org.slug}`;
  const portal = `/external/${org.slug}`;
  const embed = `/embed/${org.slug}`;
  const routes = [
    ["/profile", "Your profile"],
    ["/connect/workspace", "Choose a workspace"],
    [`${dashboard}/getting-started`, "Get started"],
    [`${dashboard}/feedback`, post.title],
    [`${dashboard}/feedback/${post.id}`, post.title],
    [`${dashboard}/roadmap`, post.title],
    [`${dashboard}/changelog`, release.title],
    [`${dashboard}/changelog/create`, "Publish"],
    [`${dashboard}/changelog/${release.id}/edit`, "Publish"],
    [`${dashboard}/members`, "Members"],
    [`${dashboard}/settings`, "Settings"],
    [portal, `Welcome to ${org.name}`],
    [`${portal}/feedback`, post.title],
    [`${portal}/feedback/${post.id}`, post.title],
    [`${portal}/roadmap`, post.title],
    [`${portal}/changelog`, release.title],
    [`${portal}/changelog/${release.id}`, "Published release content."],
    [`${embed}/feedback`, "Share feedback"],
    [`${embed}/roadmap`, post.title],
    [`${embed}/changelog`, release.title],
  ];
  for (const [route, content] of routes) {
    await test.step(route, async () => {
      const response = await page.goto(route);
      expect(response?.ok(), route).toBe(true);
      await expect(page.locator("body")).toContainText(content);
      await expect(page.locator("body")).not.toContainText(ERROR_BOUNDARY);
    });
  }
  await page.goto(`${embed}/feedback`);
  await page
    .getByPlaceholder("Title", { exact: true })
    .fill("Feedback submitted through widget");
  await page
    .getByPlaceholder("Tell us more...")
    .fill("Confirm the embedded form persists feedback.");
  await page.getByRole("button", { name: "Submit", exact: true }).click();
  await expect(
    page.getByText("Thanks for your feedback!", { exact: true })
  ).toBeVisible();
  await page.goto(`${dashboard}/feedback`);
  await expect(
    page.getByText("Feedback submitted through widget", { exact: true })
  ).toBeVisible();
  await page.goto(`${dashboard}/settings`);
  for (const tab of [
    "Branding",
    "Feedback",
    "Changelog",
    "API Keys",
    "Connected agents",
    "Data",
  ]) {
    await page.getByRole("tab", { name: tab, exact: true }).click();
    await expect(page.getByRole("tabpanel")).toBeVisible();
    await expect(page.getByRole("tabpanel")).not.toBeEmpty();
  }
  expect(errors).toEqual([]);
});
