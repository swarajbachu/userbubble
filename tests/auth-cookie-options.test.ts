const LEADING_DOT = /^\./;

import { describe, expect, it } from "vitest";
import { cookieOptions } from "../packages/auth/src/cookie-options";

describe("deployment session cookies", () => {
  it.each([
    ["https://app.example.com", "example.com"],
    ["https://example.com", ".EXAMPLE.COM"],
    ["https://app.userbubble.com", "userbubble.com"],
  ])("shares only the configured domain for %s", (baseUrl, baseDomain) => {
    const options = cookieOptions({ baseUrl, baseDomain, production: true });
    expect(options.crossSubDomainCookies).toEqual({
      enabled: true,
      domain: `.${baseDomain.toLowerCase().replace(LEADING_DOT, "")}`,
    });
    expect(options.useSecureCookies).toBe(true);
    expect(options.defaultCookieAttributes).toEqual({
      sameSite: "None",
      secure: true,
    });
  });

  it.each([
    ["https://preview.example.net", "example.com"],
    ["https://notexample.com", "example.com"],
    ["https://example.com.attacker.test", "example.com"],
    ["https://app.example.com", undefined],
    ["https://app.example.com", "https://example.com"],
    ["https://app.example.com", "*.example.com"],
    ["https://127.0.0.1", "127.0.0.1"],
    ["https://localhost", "localhost"],
  ])("keeps %s host-only with domain %s", (baseUrl, baseDomain) => {
    expect(
      cookieOptions({ baseUrl, baseDomain, production: true })
        .crossSubDomainCookies
    ).toEqual({ enabled: false });
  });

  it("allows a production build to authenticate on local HTTP", () => {
    expect(
      cookieOptions({
        baseUrl: "http://localhost:3000",
        baseDomain: "userbubble.com",
        production: true,
      })
    ).toEqual({
      crossSubDomainCookies: { enabled: false },
      useSecureCookies: false,
      defaultCookieAttributes: { sameSite: "Lax", secure: false },
    });
  });

  it("does not share development sessions across subdomains", () => {
    expect(
      cookieOptions({
        baseUrl: "https://app.example.com",
        baseDomain: "example.com",
        production: false,
      }).crossSubDomainCookies
    ).toEqual({ enabled: false });
  });
});
