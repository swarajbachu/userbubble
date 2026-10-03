import { randomBytes } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { signUp } from "./fixtures";

const LOCAL_APP = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;
test("account profile saves through the shared operation and remains accessible", async ({
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
          name: "Profile Tester",
          email: `${id}@profile.example`,
          password: `Local-test-${id}-password`,
        },
      })
    ).ok()
  ).toBe(true);
  await page.goto("/profile");
  await expect(
    page.getByRole("heading", { name: "Your profile" })
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Name", exact: true })
    .fill("Updated Profile");
  await page.getByRole("button", { name: "Save profile" }).click();
  await expect(page.getByText("Profile saved.", { exact: true })).toBeVisible();
  const stored = await (
    await context.request.post("/api/v2/operations/account.getProfile", {
      headers,
      data: {},
    })
  ).json();
  expect(stored.data.name).toBe("Updated Profile");
  await page.reload();
  await expect(
    page.getByRole("textbox", { name: "Name", exact: true })
  ).toHaveValue("Updated Profile");
  for (const theme of ["light", "dark"] as const) {
    await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
    await page.evaluate(
      (value) =>
        document.documentElement.classList.toggle("dark", value === "dark"),
      theme
    );
    for (const width of [375, 768, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
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
      if (width === 1440) {
        await page.screenshot({
          path: `.context/profile-${theme}.png`,
          fullPage: true,
        });
      }
    }
  }
});
