import { randomBytes } from "node:crypto";
import { expect, test } from "@playwright/test";
import { signUp } from "./fixtures";

const LOCAL = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/;

test("public roadmap preserves authenticated voting, links, and deferred dialogs", async ({
  page,
  context,
  browser,
  baseURL,
}) => {
  test.setTimeout(120_000);
  test.skip(!LOCAL.test(baseURL ?? ""));
  const id = randomBytes(6).toString("hex");
  const headers = { Origin: baseURL ?? "" };
  expect(
    (
      await signUp(context.request, {
        headers,
        data: {
          name: "Roadmap reader",
          email: `${id}@roadmap.example`,
          password: `Local-password-${id}`,
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
    name: "Roadmap fixture",
    slug: `roadmap-${id}`,
  });
  const post = await call("feedback.create", {
    organizationId: org.id,
    title: "A planned improvement",
    description: "A planned feature for readers.",
    category: "feature_request",
    isPublic: true,
  });
  await call("feedback.updateStatus", {
    postId: post.id,
    organizationId: org.id,
    status: "planned",
  });
  await page.goto(`/external/${org.slug}/roadmap`);
  await expect(page.locator("header nav > span")).toHaveCSS("opacity", "1");
  const link = page.getByRole("link", {
    name: "A planned improvement",
    exact: true,
  });
  await expect(link).toHaveAttribute(
    "href",
    `/external/${org.slug}/feedback/${post.id}`
  );
  const card = link.locator("..");
  const vote = card.getByRole("button");
  await vote.click();
  await expect
    .poll(
      async () =>
        (await call("feedback.getById", { id: post.id })).post.voteCount
    )
    .toBe(1);
  await page.reload();
  await expect(vote).toHaveText("1");
  await vote.click();
  await expect
    .poll(
      async () =>
        (await call("feedback.getById", { id: post.id })).post.voteCount
    )
    .toBe(0);
  await link.click();
  await expect(page).toHaveURL(
    `${baseURL}/external/${org.slug}/feedback/${post.id}`
  );
  await expect(
    page.getByText("A planned feature for readers.", { exact: true })
  ).toBeVisible();

  await page.getByRole("button", { name: "Roadmap reader" }).click();
  await page.getByRole("menuitem", { name: "Create Post" }).click();
  const composer = page.getByRole("dialog", { name: "Submit Feedback" });
  await expect(composer).toBeVisible();
  await composer
    .getByPlaceholder("Title", { exact: true })
    .fill("A deferred composer request");
  await composer
    .getByPlaceholder("Describe your feedback...")
    .fill("The lazily loaded composer still submits feedback.");
  await composer.getByRole("button", { name: "Cancel", exact: true }).click();
  await page.getByRole("button", { name: "Roadmap reader" }).click();
  await page.getByRole("menuitem", { name: "Create Post" }).click();
  await expect(composer.getByPlaceholder("Title", { exact: true })).toHaveValue(
    "A deferred composer request"
  );
  await composer
    .getByRole("button", { name: "Submit Feedback", exact: true })
    .click();
  await expect(composer).not.toBeVisible();
  await expect
    .poll(async () => {
      const posts = await call("feedback.getAll", { organizationId: org.id });
      return posts.some(
        (item: { post: { title: string } }) =>
          item.post.title === "A deferred composer request"
      );
    })
    .toBe(true);

  const anonymous = await browser.newContext();
  try {
    const guest = await anonymous.newPage();
    await guest.goto(`${baseURL}/external/${org.slug}/roadmap`);
    await guest.getByRole("button", { name: "Login", exact: true }).click();
    await expect(guest.getByRole("dialog")).toBeVisible();
    await expect(guest.getByLabel("Email", { exact: true })).toBeVisible();
    await guest.keyboard.press("Escape");
    await expect(guest.getByRole("dialog")).not.toBeVisible();
    await guest.getByRole("button", { name: "Login", exact: true }).click();
    await expect(guest.getByRole("dialog")).toBeVisible();
    await guest
      .getByLabel("Email", { exact: true })
      .fill(`${id}@roadmap.example`);
    await guest
      .getByLabel("Password", { exact: true })
      .fill(`Local-password-${id}`);
    await guest.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(guest.getByRole("dialog")).not.toBeVisible();
    await expect(guest).toHaveURL(`${baseURL}/external/${org.slug}/roadmap`);
    const guestVote = guest
      .getByRole("link", { name: "A planned improvement", exact: true })
      .locator("..")
      .getByRole("button");
    await guestVote.click();
    await expect
      .poll(
        async () =>
          (await call("feedback.getById", { id: post.id })).post.voteCount
      )
      .toBe(1);
  } finally {
    await anonymous.close();
  }
});
