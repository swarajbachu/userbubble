import { describe, expect, it } from "vitest";
import { transportIdentityHeaders } from "../apps/application/src/lib/request-identity";
import { account, base, fixtureFetch, local } from "./helpers/live";

describe.skipIf(!local)("cross-origin dashboard credentials", () => {
  it(
    "does not expose or mutate a cookie-authenticated account to a foreign origin",
    { timeout: 90_000 },
    async () => {
      const owner = await account();
      const url = `${base}/api/trpc/account.getProfile?input=${encodeURIComponent(JSON.stringify({ json: {} }))}`;
      const trusted = await fixtureFetch(url, { headers: owner.headers });
      expect(trusted.status).toBe(200);
      const before = await trusted.json();
      for (const origin of ["https://untrusted.example", "null"]) {
        const headers = { ...owner.headers, Origin: origin };
        const read = await fixtureFetch(url, { headers });
        expect(read.status).toBe(401);
        expect((await read.json()).error.json.data.code).toBe("UNAUTHORIZED");
        const session = await fixtureFetch(`${base}/api/trpc/auth.getSession`, {
          headers,
        });
        expect((await session.json()).result.data.json).toBeNull();
        const malformedBearer = await fixtureFetch(url, {
          headers: { ...headers, Authorization: "Basic invalid" },
        });
        expect(malformedBearer.status).toBe(401);
        const write = await fixtureFetch(
          `${base}/api/trpc/account.updateProfile`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({ json: { name: "Cross-origin overwrite" } }),
          }
        );
        expect(write.status).toBe(401);
      }
      for (const authorization of [
        "Basic invalid",
        "bearer invalid",
        "Bearer invalid",
        "",
      ]) {
        const explicit = await fixtureFetch(url, {
          headers: { ...owner.headers, Authorization: authorization },
        });
        expect(explicit.status).toBe(401);
      }
      const nativeHeaders = new Headers(owner.headers);
      nativeHeaders.delete("Origin");
      expect((await fixtureFetch(url, { headers: nativeHeaders })).status).toBe(
        200
      );
      const after = await (
        await fixtureFetch(url, { headers: owner.headers })
      ).json();
      expect(after).toEqual(before);
    }
  );
});

describe("transport credential selection", () => {
  it.each(["https://app.example", "https://portal.example", null])(
    "retains credentials for same-origin, application-origin and native requests: %s",
    (origin) => {
      const headers = new Headers({ Cookie: "session=opaque" });
      if (origin) {
        headers.set("Origin", origin);
      }
      const request = new Request("https://portal.example/api/trpc", {
        headers,
      });
      expect(
        transportIdentityHeaders(request, "https://app.example").get("cookie")
      ).toBe("session=opaque");
    }
  );
  it.each(["Bearer sdk-token", "Bearer invalid", "Basic invalid"])(
    "drops foreign-origin cookies independently of the explicit token: %s",
    (authorization) => {
      const request = new Request("https://app.example/api/trpc", {
        headers: {
          Origin: "https://customer.example",
          Cookie: "session=opaque",
          Authorization: authorization,
        },
      });
      const headers = transportIdentityHeaders(request, "https://app.example");
      expect(headers.has("cookie")).toBe(false);
      expect(headers.get("authorization")).toBe(authorization);
      expect(request.headers.get("cookie")).toBe("session=opaque");
    }
  );
});
