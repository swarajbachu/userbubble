/**
 * Generate Userbubble URL for external users.
 * Copied from sdks/react-native/src/utils/url.ts for zero-dependency bundling.
 */
export function generateUserbubbleUrl(
  baseUrl: string,
  organizationSlug: string,
  path = "",
  useDirectUrls = false
): string {
  const url = new URL(baseUrl);
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (useDirectUrls) {
    return `${baseUrl}/external/${organizationSlug}${normalizedPath}`;
  }

  const hostname = url.hostname;
  const parts = hostname.split(".");
  const rootDomain = parts.length > 2 ? parts.slice(1).join(".") : hostname;
  const subdomainUrl = `${url.protocol}//${organizationSlug}.${rootDomain}`;

  return `${subdomainUrl}${normalizedPath}`;
}
