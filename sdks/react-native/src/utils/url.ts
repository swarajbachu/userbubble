/**
 * Generate Userbubble URL
 */
export function generateUserbubbleUrl(
  baseUrl: string,
  organizationSlug: string,
  path = ""
): string {
  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}/${organizationSlug}${normalizedPath}`;
}
