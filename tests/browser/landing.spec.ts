import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const HERO = /A closer connection/;
const base = process.env.TEST_LANDING_URL;
const LOCAL = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;
test("marketing is accessible and compact across viewports and themes", async ({
  page,
}) => {
  test.skip(!(base && LOCAL.test(base)), "Requires a local marketing app");
  await page.goto(base ?? "http://localhost:3001");
  await expect(
    page.getByRole("heading", {
      name: HERO,
    })
  ).toBeVisible();
  const tabs = page.getByRole("tablist", { name: "Explore the product" });
  await tabs.getByRole("tab", { name: "Roadmap" }).click();
  await expect(
    page.getByRole("heading", { name: "A shared view of what's next" })
  ).toBeVisible();
  await tabs.getByRole("tab", { name: "Releases" }).click();
  await expect(
    page
      .getByRole("tabpanel")
      .getByRole("heading", { name: "Small details. A better every day." })
  ).toBeVisible();
  await tabs.getByRole("tab", { name: "Feedback" }).click();
  await page
    .getByRole("button", {
      name: "Keyboard shortcuts for the inbox SK Sam ↑ 16",
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Keyboard shortcuts for the inbox" })
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Keep my filters when I come back AL Alex ↑ 28",
    })
    .click();
  const primary = page.getByRole("link", { name: "Get started" }).first();
  const canvas = primary.locator("canvas");
  await expect
    .poll(() => canvas.evaluate((element) => element.height))
    .toBe(16);
  const appearance = await primary.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      height: element.getBoundingClientRect().height,
      shadow: style.boxShadow,
      font: style.fontSize,
      weight: style.fontWeight,
      family: style.fontFamily,
    };
  });
  expect(appearance).toMatchObject({
    height: 32,
    shadow: "none",
    font: "12px",
    weight: "400",
  });
  expect(appearance.family).toContain("Geist");
  const opacity = () =>
    canvas.evaluate(
      (element) =>
        element.getContext("2d")?.getImageData(0, 0, 1, 1).data[3] ?? 0
    );
  const restingOpacity = await opacity();
  expect(restingOpacity).toBeGreaterThan(0);
  await primary.hover();
  await expect.poll(opacity).toBeGreaterThan(restingOpacity);
  await page.mouse.move(0, 0);
  await expect.poll(opacity).toBe(restingOpacity);
  for (const theme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.evaluate(
      (value) =>
        document.documentElement.classList.toggle("dark", value === "dark"),
      theme
    );
    for (const width of [375, 768, 1440, 1920]) {
      await page.setViewportSize({ width, height: 1000 });
      const scan = await new AxeBuilder({ page })
        .exclude("nextjs-portal")
        .analyze();
      expect(
        scan.violations.filter(
          ({ impact }) => impact === "serious" || impact === "critical"
        ),
        JSON.stringify(scan.violations)
      ).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      ).toBe(true);
      await page.screenshot({
        path: `.context/marketing-${theme}-${width}.png`,
        fullPage: true,
      });
    }
  }
});
