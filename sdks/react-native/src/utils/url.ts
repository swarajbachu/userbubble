/**
 * Generate Userbubble URL for external users
 * External users access via subdomain (e.g., orgslug.userbubble.com)
 * which gets routed by proxy to /external/[orgslug] internally
 *
 * Examples:
 * - baseUrl: http://app.host.local → orgslug.host.local
 * - baseUrl: https://app.userbubble.com → orgslug.userbubble.com
 * - directUrl: http://app.host.local → app.host.local/external/orgslug
 */
export function generateUserbubbleUrl(
  baseUrl: string,
  organizationSlug: string,
  path = "",
  useDirectUrls = false
): string {
  // Parse base URL
  const url = new URL(baseUrl);

  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // Direct URL mode: baseUrl/external/orgslug/path
  if (useDirectUrls) {
    return `${baseUrl}/external/${organizationSlug}${normalizedPath}`;
  }

  // Subdomain mode: orgslug.rootdomain/path
  const hostname = url.hostname;

  // Extract root domain (strip first subdomain like "app")
  // app.host.local → host.local
  // app.userbubble.com → userbubble.com
  const parts = hostname.split(".");
  const rootDomain = parts.length > 2 ? parts.slice(1).join(".") : hostname;

  // Create subdomain URL with org slug
  const subdomainUrl = `${url.protocol}//${organizationSlug}.${rootDomain}`;

  return `${subdomainUrl}${normalizedPath}`;
}
