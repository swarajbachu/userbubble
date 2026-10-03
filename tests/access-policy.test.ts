import { Effect } from "effect";
import { describe, expect, it, vi } from "vitest";
import { Authorization } from "../packages/api/src/application/authorization";
import {
  canModify,
  canViewPost,
  isAdmin,
} from "../packages/api/src/application/policies/access";

const post = { organizationId: "tenant", authorId: "author", isPublic: false };
function policy(role?: "owner" | "admin" | "member") {
  const membership = vi.fn((userId: string, organizationId: string) =>
    Effect.succeed(
      role ? { id: "membership", role, userId, organizationId } : undefined
    )
  );
  const run = <A>(effect: Effect.Effect<A, unknown, Authorization>) =>
    Effect.runPromise(
      effect.pipe(Effect.provideService(Authorization, { membership }))
    );
  return { run, membership };
}
describe("application access policies", () => {
  it("hides private feedback from anonymous users and nonmembers", async () => {
    const { run } = policy();
    expect(await run(canViewPost(post, null))).toBe(false);
    expect(await run(canViewPost(post, "outsider"))).toBe(false);
    expect(await run(canModify(post, "outsider"))).toBe(false);
  });
  it("allows authors and public reads without unnecessary membership queries", async () => {
    const { run, membership } = policy();
    expect(await run(canViewPost(post, "author"))).toBe(true);
    expect(await run(canModify(post, "author"))).toBe(true);
    expect(await run(canViewPost({ ...post, isPublic: true }, null))).toBe(
      true
    );
    expect(membership).not.toHaveBeenCalled();
  });
  it("checks the resource tenant and distinguishes members from administrators", async () => {
    const member = policy("member");
    expect(await member.run(canViewPost(post, "reader"))).toBe(true);
    expect(await member.run(canModify(post, "reader"))).toBe(false);
    expect(member.membership).toHaveBeenCalledWith("reader", "tenant");
    for (const role of ["owner", "admin"] as const) {
      const administrator = policy(role);
      expect(await administrator.run(isAdmin("operator", "tenant"))).toBe(true);
      expect(await administrator.run(canModify(post, "operator"))).toBe(true);
    }
  });
});
