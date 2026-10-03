import { afterEach, expect, it, vi } from "vitest";
import { UserBubbleClient } from "../packages/client/src/index";

afterEach(() => vi.restoreAllMocks());
it("sends typed operations through the authenticated agent connection", async () => {
  const client = new UserBubbleClient("http://localhost:3002");
  const execute = vi
    .spyOn(client, "execute")
    .mockResolvedValue({ data: { success: true } });
  expect(
    await client.call("agent-1", "reference.delete", {
      organizationId: "org-1",
      id: "ref-1",
    })
  ).toEqual({ success: true });
  expect(execute).toHaveBeenCalledWith("agent-1", "reference.delete", {
    organizationId: "org-1",
    id: "ref-1",
  });
});
it("retrieves feedback pages lazily and retains filters and microsecond cursors", async () => {
  const client = new UserBubbleClient("http://localhost:3002");
  const cursor = { updatedAt: "2026-10-03T00:00:00.123456Z", id: "post-1" };
  const execute = vi
    .spyOn(client, "execute")
    .mockResolvedValueOnce({ data: { items: [], nextCursor: cursor } })
    .mockResolvedValueOnce({ data: { items: [], nextCursor: null } });
  const input = { organizationId: "org-1", query: "keyboard", limit: 2 };
  const pages = client.feedbackPages("agent-1", input);
  expect(execute).not.toHaveBeenCalled();
  await pages.next();
  expect(execute).toHaveBeenCalledTimes(1);
  await pages.next();
  expect(execute).toHaveBeenLastCalledWith("agent-1", "feedback.search", {
    ...input,
    cursor,
  });
  expect((await pages.next()).done).toBe(true);
});
it("stops fetching when the caller stops consuming pages", async () => {
  const client = new UserBubbleClient("http://localhost:3002");
  const execute = vi.spyOn(client, "execute").mockResolvedValue({
    data: {
      items: [],
      nextCursor: { updatedAt: "2026-10-03T00:00:00Z", id: "post-1" },
    },
  });
  for await (const _page of client.feedbackPages("agent-1", {
    organizationId: "org-1",
  })) {
    break;
  }
  expect(execute).toHaveBeenCalledTimes(1);
});
it("rejects a repeated cursor instead of looping forever", async () => {
  const client = new UserBubbleClient("http://localhost:3002");
  vi.spyOn(client, "execute").mockResolvedValue({
    data: {
      items: [],
      nextCursor: { updatedAt: "2026-10-03T00:00:00Z", id: "post-1" },
    },
  });
  const pages = client.feedbackPages("agent-1", { organizationId: "org-1" });
  await pages.next();
  await pages.next();
  await expect(pages.next()).rejects.toThrow("repeated feedback cursor");
});

it.each([429, 502, 503, 504])(
  "preserves actionable HTTP %s errors without retrying a request",
  async (status) => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response("upstream private body", {
        status,
        headers: { "Retry-After": "12" },
      })
    );
    const client = new UserBubbleClient("http://localhost:3002", {
      fetch: fetcher,
    });
    await expect(client.capabilities()).rejects.toMatchObject({
      code: status === 429 ? "rate_limited" : "transient_failure",
      status,
      retryAfterSeconds: 12,
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  }
);
