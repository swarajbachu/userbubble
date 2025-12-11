/**
 * Extract subdomain from hostname
 * Returns null if no subdomain or if it's a reserved subdomain
 */
export function getSubdomain(hostname: string): string | null {
  // Remove port if present
  const host = hostname.split(":")[0];

  // Development: localhost/127.0.0.1/192.168.x.x - no subdomain
  if (
    !host ||
    host === "localhost" ||
    host === "127.0.0.1" ||
    host.startsWith("192.168")
  ) {
    return null;
  }

  // Production: extract subdomain from domain
  const parts = host.split(".");

  // Need at least 3 parts for a subdomain: [subdomain, domain, tld]
  if (parts.length < 3) {
    return null;
  }

  // Get the subdomain (first part)
  const subdomain = parts[0];

  if (!subdomain) {
    return null;
  }

  // Reserved subdomains that should not be treated as org subdomains
  const reservedSubdomains = [
    "app",
    "www",
    "api",
    "cdn",
    "admin",
    "dashboard",
    "static",
    "staging",
    "dev",
    "test",
  ];

  if (reservedSubdomains.includes(subdomain)) {
    return null;
  }

  return subdomain;
}

/**
 * Check if the current request is from an external/public subdomain
 */
export function isExternalSubdomain(hostname: string): boolean {
  return getSubdomain(hostname) !== null;
}
