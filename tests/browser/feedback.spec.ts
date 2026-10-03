import { signUp } from "./fixtures";

const SEARCH_URL = /q=not-a-matching-request/;
const SORT_URL = /sort=votes/;
const LOCAL_APP = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

import { randomBytes } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("feedback thread is readable and accessible across sizes and themes", async ({
  page,
  context,
  baseURL,
}) => {
  test.setTimeout(120_000);
  test.skip(
    !LOCAL_APP.test(baseURL ?? ""),
    "Only use disposable local test instances"
  );
  const id = randomBytes(6).toString("hex");
  const headers = { Origin: baseURL ?? "" };
  const signup = await signUp(context.request, {
    headers,
    data: {
      name: "Browser Tester",
      email: `${id}@browser.example`,
      password: `Local-test-${id}-password`,
    },
  });
  expect(signup.ok()).toBe(true);
  const org = await (
    await context.request.post("/api/v2/operations/organization.create", {
      headers,
      data: { name: "Product workspace", slug: `browser-${id}` },
    })
  ).json();
  const post = await (
    await context.request.post("/api/v2/operations/feedback.create", {
      headers,
      data: {
        organizationId: org.data.id,
        title: "Improve keyboard navigation",
        description: "Make feedback easier to navigate without a mouse.",
        category: "improvement",
      },
    })
  ).json();
  await context.request.post("/api/v2/operations/feedback.createComment", {
    headers,
    data: {
      postId: post.data.id,
      content: "Thanks for the feedback. We are improving keyboard navigation.",
    },
  });
  await context.request.post("/api/auth/organization/set-active", {
    headers,
    data: { organizationId: org.data.id },
  });
  await page.goto(`/org/${org.data.slug}/feedback`);
  await page
    .getByRole("button", { name: "Create Request", exact: true })
    .click();
  await page
    .getByPlaceholder("Request Title", { exact: true })
    .fill("Compact toolbar support");
  await page
    .getByPlaceholder("Add details...", { exact: true })
    .fill("Keep frequently used actions available in the toolbar.");
  await page
    .getByRole("button", { name: "Submit Request", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByText("Compact toolbar support", { exact: true })
  ).toBeVisible();
  const search = page.getByRole("textbox", { name: "Search requests" });
  await search.fill("not-a-matching-request");
  await expect(page.getByText("No requests match your search.")).toBeVisible();
  await expect(page).toHaveURL(SEARCH_URL);
  await search.fill("keyboard");
  await expect(
    page.getByText("Improve keyboard navigation", { exact: true })
  ).toBeVisible();
  await page.getByLabel("Sort requests").selectOption("votes");
  await expect(page).toHaveURL(SORT_URL);
  await expect(
    page.getByText("Improve keyboard navigation", { exact: true })
  ).toBeVisible();
  await expect(search).toBeVisible();
  await page.screenshot({
    path: ".context/app-feedback-workspace.png",
    fullPage: true,
  });
  const externalReference = await context.request.post(
    "/api/v2/operations/reference.add",
    {
      headers,
      data: {
        organizationId: org.data.id,
        postId: post.data.id,
        title: "External agent PR",
        url: "https://example.test/pull/41",
      },
    }
  );
  expect(externalReference.ok()).toBe(true);
  await page.goto(`/org/${org.data.slug}/feedback/${post.data.id}`);
  await expect(
    page.getByRole("heading", { name: "Improve keyboard navigation" })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "External agent PR" })
  ).toHaveAttribute("href", "https://example.test/pull/41");
  await page.getByRole("button", { name: "Add link", exact: true }).click();
  await page
    .getByRole("textbox", { name: "Link title" })
    .fill("Keyboard navigation implementation");
  await page
    .getByRole("textbox", { name: "Implementation URL" })
    .fill("https://example.test/pull/42");
  await page.getByRole("button", { name: "Save link" }).click();
  await expect(
    page.getByRole("link", { name: "Keyboard navigation implementation" })
  ).toHaveAttribute("href", "https://example.test/pull/42", {
    timeout: 30_000,
  });
  const references = await (
    await context.request.post("/api/v2/operations/reference.list", {
      headers,
      data: { organizationId: org.data.id, postId: post.data.id },
    })
  ).json();
  expect(references.data).toHaveLength(2);
  expect(references.data).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ title: "Keyboard navigation implementation" }),
    ])
  );
  await expect(
    page.getByText(
      "Thanks for the feedback. We are improving keyboard navigation."
    )
  ).toBeVisible();
  for (const theme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.evaluate((value) => {
      document.documentElement.classList.toggle("dark", value === "dark");
    }, theme);
    for (const width of [375, 768, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      const findings = await new AxeBuilder({ page })
        .exclude("nextjs-portal")
        .analyze();
      expect(
        findings.violations.filter(
          ({ impact }) => impact === "critical" || impact === "serious"
        ),
        JSON.stringify(findings.violations, null, 2)
      ).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      ).toBe(true);
      await page.screenshot({
        path: `.context/feedback-${theme}-${width}.png`,
        fullPage: true,
      });
    }
  }
  await page
    .getByRole("button", { name: "Remove Keyboard navigation implementation" })
    .click();
  await expect(
    page.getByRole("link", { name: "Keyboard navigation implementation" })
  ).not.toBeVisible();
  const afterRemove = await (
    await context.request.post("/api/v2/operations/reference.list", {
      headers,
      data: { organizationId: org.data.id, postId: post.data.id },
    })
  ).json();
  expect(afterRemove.data).toHaveLength(1);
  expect(afterRemove.data[0].title).toBe("External agent PR");
});
