import { randomBytes } from "node:crypto";
import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { signUp } from "./fixtures";

const LOCAL_APP = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

test("member invitations stay consistent between dashboard and management API", async ({
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
      name: "Workspace Owner",
      email: `${nonce}@members.example`,
      password: `Local-${nonce}-password`,
    },
  });
  expect(signup.ok()).toBe(true);
  const organization = await (
    await context.request.post("/api/v2/operations/organization.create", {
      headers,
      data: { name: "Members workspace", slug: `members-${nonce}` },
    })
  ).json();
  const organizationId = organization.data.id;
  const email = `invite-${nonce}@members.example`;
  await page.goto(`/org/${organization.data.slug}/members`);
  await page
    .getByRole("button", { name: "Invite Member", exact: true })
    .click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox", { name: "Email Address" }).fill(email);
  await dialog.getByRole("button", { name: "Create invitation" }).click();
  await expect(dialog).not.toBeVisible({ timeout: 30_000 });
  await expect(
    page.getByRole("cell", { name: email, exact: true })
  ).toBeVisible();
  const list = () =>
    context.request.post("/api/v2/operations/organization.listInvitations", {
      headers,
      data: { organizationId },
    });
  const invitations = await (await list()).json();
  const invitation = invitations.data.find(
    (item: { email: string }) => item.email === email
  );
  expect(invitation.status).toBe("pending");

  // Scan stable page states, not the toast's partially transparent exit frame.
  await expect(page.locator("[data-sonner-toast]")).toHaveCount(0, {
    timeout: 10_000,
  });

  for (const theme of ["light", "dark"]) {
    await page.evaluate(
      (value) =>
        document.documentElement.classList.toggle("dark", value === "dark"),
      theme
    );
    for (const width of [375, 768, 1440, 1920]) {
      await page.setViewportSize({ width, height: 900 });
      // Theme and responsive changes animate inherited table colors. Wait for
      // their actual completion rather than scanning an intermediate frame.
      await page.evaluate(async () => {
        await Promise.allSettled(
          document
            .getAnimations()
            .filter((animation) =>
              Number.isFinite(animation.effect?.getComputedTiming().endTime)
            )
            .map((animation) => animation.finished)
        );
      });
      const result = await new AxeBuilder({ page })
        .exclude("nextjs-portal")
        .analyze();
      expect(
        result.violations.filter(
          ({ impact }) => impact === "serious" || impact === "critical"
        )
      ).toEqual([]);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth
        )
      ).toBe(true);
      const tableRegion = page.getByRole("region", {
        name: "Workspace members",
      });
      if (
        await tableRegion.evaluate(
          (element) => element.scrollWidth > element.clientWidth
        )
      ) {
        await tableRegion.focus();
        await tableRegion.press("ArrowRight");
        await expect
          .poll(() => tableRegion.evaluate((element) => element.scrollLeft))
          .toBeGreaterThan(0);
      }
      await page.screenshot({
        path: `.context/members-${theme}-${width}.png`,
        fullPage: true,
      });
    }
  }
  await page
    .getByRole("button", { name: `Cancel invitation for ${email}` })
    .click();
  await expect(
    page.getByRole("cell", { name: email, exact: true })
  ).not.toBeVisible();
  const cancelled = await (await list()).json();
  expect(
    cancelled.data.find((item: { id: string }) => item.id === invitation.id)
      .status
  ).toBe("cancelled");

  const memberList = await (
    await context.request.post("/api/v2/operations/settings.listMembers", {
      headers,
      data: { organizationId },
    })
  ).json();
  expect(memberList.data).toHaveLength(1);
  await expect(
    page.getByRole("cell", { name: "Workspace Owner" })
  ).toBeVisible();
});
