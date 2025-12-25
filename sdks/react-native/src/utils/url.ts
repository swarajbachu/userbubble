/**
 * Generate Userbubble URL for external users
 * External users access via subdomain (e.g., orgslug.userbubble.com)
 * which gets routed by proxy to /external/[orgslug] internally
 */
export function generateUserbubbleUrl(
  baseUrl: string,
  organizationSlug: string,
  path = ""
): string {
  // Parse base URL to get domain
  const url = new URL(baseUrl);
  const domain = url.hostname;

  // Create subdomain URL (e.g., orgslug.userbubble.com)
  const subdomainUrl = `${url.protocol}//${organizationSlug}.${domain}`;

  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return `${subdomainUrl}${normalizedPath}`;
}
