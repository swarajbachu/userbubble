import { randomBytes } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { signUp } from "./fixtures";

const LOCAL_APP = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;
const RELEASE = /Saved views are here/;
const LATEST_RELEASE = /Latest published title/;

test("widget releases open directly with accessible compact cards", async ({
  page,
  context,
  baseURL,
}) => {
  test.setTimeout(120_000);
  test.skip(!LOCAL_APP.test(baseURL ?? ""), "Disposable local fixture only");
  const id = randomBytes(6).toString("hex");
  const headers = { Origin: baseURL ?? "" };
  expect(
    (
      await signUp(context.request, {
        headers,
        data: {
          name: "Widget Tester",
          email: `${id}@widget.example`,
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
    name: "Product workspace",
    slug: `widget-${id}`,
  });
  await call("changelog.create", {
    organizationId: org.id,
    title: "Saved views are here",
    description:
      "<p>Keep your favorite filters a click away.</p><p>Save a view from the feedback toolbar, then return to it whenever you need.</p>",
    isPublished: true,
    version: "1.2",
    tags: ["Improvement"],
  });
  await page.goto(`/embed/${org.slug}/changelog`);
  for (const theme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.evaluate(
      (value) =>
        document.documentElement.classList.toggle("dark", value === "dark"),
      theme
    );
    for (const width of [375, 768, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      const card = page.getByRole("button", { name: RELEASE });
      await expect(card).toBeVisible();
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
          () => document.documentElement.scrollWidth <= innerWidth
        )
      ).toBe(true);
      if (width === 375) {
        await page.screenshot({
          path: `.context/widget-releases-${theme}.png`,
          fullPage: true,
        });
      }
      await card.focus();
      await page.keyboard.press("Enter");
      await expect(
        page.getByRole("heading", { name: "Saved views are here" })
      ).toBeVisible();
      await expect(
        page.getByText("Keep your favorite filters a click away.", {
          exact: true,
        })
      ).toBeVisible();
      await page.getByRole("button", { name: "All releases" }).click();
    }
  }
});

test("publishing an edited draft saves its latest content and cleared metadata", async ({
  page,
  context,
  baseURL,
}) => {
  test.setTimeout(120_000);
  test.skip(!LOCAL_APP.test(baseURL ?? ""), "Disposable local fixture only");
  const id = randomBytes(6).toString("hex");
  const headers = { Origin: baseURL ?? "" };
  expect(
    (
      await signUp(context.request, {
        headers,
        data: {
          name: "Release Editor",
          email: `${id}@release.example`,
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
    name: "Release workspace",
    slug: `release-${id}`,
  });
  const draft = await call("changelog.create", {
    organizationId: org.id,
    title: "Original draft",
    description: "<p>Original body</p>",
    version: "0.1",
    isPublished: false,
  });
  await page.goto(`/org/${org.slug}/changelog/${draft.id}/edit`);
  const editor = page.locator('[contenteditable="true"]').first();
  await expect(editor).toBeVisible();
  await page
    .getByRole("textbox", { name: "Release title" })
    .fill("Latest published title");
  await page.getByRole("textbox", { name: "Release version" }).fill("");
  await editor.fill("The latest release content.");
  await page.getByRole("button", { name: "Publish", exact: true }).click();
  await expect(page).toHaveURL(`${baseURL}/org/${org.slug}/changelog`, {
    timeout: 30_000,
  });
  const saved = await call("changelog.getById", {
    id: draft.id,
    organizationId: org.id,
  });
  expect(saved).toMatchObject({
    title: "Latest published title",
    version: null,
    isPublished: true,
  });
  expect(saved.description).toContain("The latest release content.");
  await page.goto(`/embed/${org.slug}/changelog`);
  await page.getByRole("button", { name: LATEST_RELEASE }).click();
  await expect(
    page.getByText("The latest release content.", { exact: true })
  ).toBeVisible();
});
