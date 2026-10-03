const SCHEME = /^[a-z][a-z\d+.-]*:/i;

/** Accept the domain-only value advertised by onboarding, then send an HTTP URL. */
export function normalizeWebsiteUrl(value: string): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return;
  }
  const url = new URL(SCHEME.test(trimmed) ? trimmed : `https://${trimmed}`);
  if (!(["http:", "https:"].includes(url.protocol) && url.hostname)) {
    throw new Error("Please enter a valid website URL");
  }
  return url.href;
}
