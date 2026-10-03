import { describe, expect, it, vi } from "vitest";
import { createTRPCContext } from "../packages/api/src/trpc";

vi.mock("@userbubble/auth", () => ({ verifyAuthToken: vi.fn(() => null) }));
vi.mock("../packages/api/src/application/runtime", () => ({
  serverReads: { user: vi.fn() },
}));

describe("explicit transport credentials", () => {
  it.each([
    ["Basic invalid", "configured"],
    ["bearer invalid", "configured"],
    ["Bearer invalid", "configured"],
    ["", "configured"],
    ["Bearer token", undefined],
  ])(
    "does not use cookies for %s with secret %s",
    async (authorization, authSecret) => {
      const getSession = vi.fn(async () => null);
      const getCookieSession = vi.fn(async () => null);
      const auth = { api: { getSession } } as Parameters<
        typeof createTRPCContext
      >[0]["auth"];
      const context = await createTRPCContext({
        auth,
        authSecret,
        getCookieSession,
        headers: new Headers({
          Cookie: "session=owner",
          Authorization: authorization ?? "",
        }),
      });
      expect(context.session).toBeNull();
      expect(getSession).not.toHaveBeenCalled();
      expect(getCookieSession).not.toHaveBeenCalled();
    }
  );
});

describe("request-scoped cookie sessions", () => {
  it("uses the request resolver without repeating the authentication lookup", async () => {
    const getSession = vi.fn(async () => null);
    const getCookieSession = vi.fn(async () => null);
    const auth = { api: { getSession } } as Parameters<
      typeof createTRPCContext
    >[0]["auth"];
    const context = await createTRPCContext({
      auth,
      headers: new Headers(),
      getCookieSession,
    });
    expect(context.session).toBeNull();
    expect(getCookieSession).toHaveBeenCalledExactlyOnceWith();
    expect(getSession).not.toHaveBeenCalled();
  });

  it("retains the authentication lookup for ordinary transports", async () => {
    const getSession = vi.fn(async () => null);
    const auth = { api: { getSession } } as Parameters<
      typeof createTRPCContext
    >[0]["auth"];
    const headers = new Headers({ Cookie: "session=example" });
    await createTRPCContext({ auth, headers });
    expect(getSession).toHaveBeenCalledExactlyOnceWith({ headers });
  });
});
