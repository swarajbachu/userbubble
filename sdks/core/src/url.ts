import type { EmbedUrlOptions } from "./types";

/**
 * Generate organization URL for external users.
 *
 * Subdomain mode (default): orgslug.rootdomain/path
 * Direct URL mode: baseUrl/external/orgslug/path
 */
export function generateOrganizationUrl(
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

/**
 * Generate an authenticated embed URL for the web widget (iframe).
 *
 * Returns: {baseUrl}/embed/{orgSlug}{path}?auth_token={token}&embed=true
 */
export function generateEmbedUrl(options: EmbedUrlOptions): string {
  const { baseUrl, orgSlug, authToken } = options;
  const path = options.path ?? "/feedback";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  const params = new URLSearchParams({
    auth_token: authToken,
    embed: "true",
  });

  return `${baseUrl}/embed/${orgSlug}${normalizedPath}?${params.toString()}`;
}

/**
 * Generate an authenticated URL for the full external portal page (mobile WebView).
 *
 * Derives subdomain URL from baseUrl:
 *   baseUrl=https://app.gesturs.com, orgSlug=acme → https://acme.gesturs.com/feedback?auth_token=...
 *
 * The external portal's EmbedBridge exchanges the token for a session cookie
 * and reloads — giving the user a fully authenticated page with header/nav.
 */
export function generatePortalUrl(options: EmbedUrlOptions): string {
  const { baseUrl, orgSlug, authToken } = options;
  const path = options.path ?? "/feedback";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  // Derive subdomain URL: app.gesturs.com → {orgSlug}.gesturs.com
  const url = new URL(baseUrl);
  const parts = url.hostname.split(".");
  const rootDomain = parts.length > 2 ? parts.slice(1).join(".") : url.hostname;
  const portalOrigin = `${url.protocol}//${orgSlug}.${rootDomain}`;

  const params = new URLSearchParams({ auth_token: authToken });

  return `${portalOrigin}${normalizedPath}?${params.toString()}`;
}
