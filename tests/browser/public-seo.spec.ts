import { randomBytes } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { signUp } from "./fixtures";

const LOCAL = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;
test("public content works without JavaScript and excludes private content from indexing", async ({
  browser,
  context,
  baseURL,
}) => {
  test.setTimeout(120_000);
  test.skip(!LOCAL.test(baseURL ?? ""), "Requires a disposable local app");
  const id = randomBytes(6).toString("hex");
  const headers = { Origin: baseURL ?? "" };
  expect(
    (
      await signUp(context.request, {
        headers,
        data: {
          name: "Public Page Tester",
          email: `${id}@seo.example`,
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
    name: "Public release workspace",
    slug: `public-${id}`,
  });
  const feedback = await call("feedback.create", {
    organizationId: org.id,
    title: "A public request for saved filters",
    description: "Remember which requests I was reading.",
    category: "improvement",
    isPublic: true,
  });
  const hidden = await call("feedback.create", {
    organizationId: org.id,
    title: "Private feedback must stay private",
    description: "Private context.",
    category: "bug",
    isPublic: false,
  });
  const release = await call("changelog.create", {
    organizationId: org.id,
    title: "Your filters now stay with you",
    description:
      '<p>Pick up where you left off.</p><script>alert("unsafe")</script><a href="javascript:alert(1)">Unsafe link</a>',
    isPublished: true,
  });
  const draft = await call("changelog.create", {
    organizationId: org.id,
    title: "Unannounced private release",
    description: "This is a draft.",
    isPublished: false,
  });
  const anonymous = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  try {
    const page = await anonymous.newPage();
    const root = `/external/${org.slug}`;
    await page.goto(`${root}/feedback`);
    await expect(
      page.getByText("A public request for saved filters", { exact: true })
    ).toBeVisible();
    await expect(
      page.getByText("Private feedback must stay private", { exact: true })
    ).toHaveCount(0);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${baseURL}${root}/feedback`
    );
    await page.goto(`${root}/changelog`);
    await expect(
      page.getByRole("link", { name: release.title, exact: true })
    ).toBeVisible();
    await expect(page.getByText(draft.title, { exact: true })).toHaveCount(0);
    await page.getByRole("link", { name: "Read release" }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: release.title })
    ).toBeVisible();
    await expect(
      page.getByText("Pick up where you left off.", { exact: true })
    ).toBeVisible();
    expect(await page.locator('a[href^="javascript:"]').count()).toBe(0);
    expect(await page.locator("script").allTextContents()).not.toContain(
      'alert("unsafe")'
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
      "href",
      `${baseURL}${root}/changelog/${release.id}`
    );
    const structured = JSON.parse(
      (await page
        .locator('script[type="application/ld+json"]')
        .textContent()) ?? "{}"
    );
    expect(structured.headline).toBe(release.title);
    const sitemap = await anonymous.request.get(`${root}/sitemap/changelog/0`);
    expect(sitemap.ok()).toBe(true);
    expect(await sitemap.text()).toContain(release.id);
    expect(await sitemap.text()).not.toContain(draft.id);
    const posts = await anonymous.request.get(`${root}/sitemap/feedback/0`);
    expect(await posts.text()).toContain(feedback.id);
    expect(await posts.text()).not.toContain(hidden.id);
    const rss = await anonymous.request.get(`${root}/changelog/feed.xml`);
    expect(await rss.text()).toContain(`/changelog/${release.id}`);
    expect(await rss.text()).not.toContain("<script>");
    expect((await anonymous.request.get("/robots.txt")).status()).toBe(200);
    await page.goto(`${root}/changelog/${draft.id}`);
    await expect(page.getByRole("heading", { name: draft.title })).toHaveCount(
      0
    );
    const visual = await context.newPage();
    await visual.goto(`${root}/changelog/${release.id}`);
    for (const theme of ["light", "dark"]) {
      await visual.emulateMedia({
        colorScheme: theme === "dark" ? "dark" : "light",
        reducedMotion: "reduce",
      });
      await visual.evaluate(
        (value) =>
          document.documentElement.classList.toggle("dark", value === "dark"),
        theme
      );
      for (const width of [375, 768, 1440, 1920]) {
        await visual.setViewportSize({ width, height: 1000 });
        const audit = await new AxeBuilder({ page: visual })
          .exclude("nextjs-portal")
          .analyze();
        expect(
          audit.violations.filter(
            (v) => v.impact === "serious" || v.impact === "critical"
          ),
          JSON.stringify(audit.violations)
        ).toEqual([]);
        expect(
          await visual.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth
          )
        ).toBe(true);
        await visual.screenshot({
          path: `.context/release-${theme}-${width}.png`,
          fullPage: true,
        });
      }
    }
    await visual.close();
  } finally {
    await anonymous.close();
  }
});
