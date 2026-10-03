import { Effect } from "effect";
import { afterAll, afterEach, expect, it, vi } from "vitest";

vi.mock("../packages/api/src/application/read-models", () => ({
  readModels: {
    organizationBySlug: (slug: string) =>
      slug === "slow"
        ? Effect.sleep("31 seconds").pipe(Effect.as(undefined))
        : Effect.succeed(undefined),
  },
}));

const { serverReads, disposeApplicationRuntime } = await import(
  "../packages/api/src/application/runtime"
);

afterEach(() => vi.useRealTimers());
afterAll(() => disposeApplicationRuntime());

it("bounds a server read composition independently of its individual queries", async () => {
  vi.useFakeTimers();
  const result = expect(
    serverReads.organizationBySlug("slow")
  ).rejects.toMatchObject({ code: "TIMEOUT" });
  await vi.advanceTimersByTimeAsync(30_001);
  await result;
});

it("preserves successful optional results after a cancelled read", async () => {
  await expect(
    serverReads.organizationBySlug("missing")
  ).resolves.toBeUndefined();
});
