const LEADING_DOT = /^\./;

import { isIP } from "node:net";
import type { BetterAuthOptions } from "better-auth";

const DOMAIN =
  /^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

/** Only share sessions within the configured deployment's own domain. */
export function cookieOptions({
  baseUrl,
  baseDomain,
  production,
}: {
  baseUrl: string;
  baseDomain?: string;
  production: boolean;
}): NonNullable<BetterAuthOptions["advanced"]> {
  const url = new URL(baseUrl);
  const secure = url.protocol === "https:";
  const domain = baseDomain?.trim().toLowerCase().replace(LEADING_DOT, "");
  const share = Boolean(
    production &&
      secure &&
      domain &&
      DOMAIN.test(domain) &&
      !isIP(domain) &&
      (url.hostname === domain || url.hostname.endsWith(`.${domain}`))
  );

  return {
    crossSubDomainCookies:
      share && domain
        ? { enabled: true, domain: `.${domain}` }
        : { enabled: false },
    useSecureCookies: secure,
    defaultCookieAttributes: {
      sameSite: secure ? "None" : "Lax",
      secure,
    },
  };
}
