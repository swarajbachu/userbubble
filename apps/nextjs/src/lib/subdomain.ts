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

  // Vercel deployments - these are base domains, not subdomains
  // Matches: app.vercel.app, app-git-branch.vercel.app, app-hash.vercel.app
  if (host.endsWith(".vercel.app")) {
    const beforeVercel = host.replace(".vercel.app", "");
    // If there's a dot before .vercel.app, it's a subdomain
    if (beforeVercel.includes(".")) {
      const subdomain = beforeVercel.split(".")[0];

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
    return null;
  }

  // Custom domain - check if this IS the base domain
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN;
  if (baseDomain && host === baseDomain) {
    return null;
  }

  // Check if this is a subdomain of the base domain
  if (baseDomain && host.endsWith(`.${baseDomain}`)) {
    const subdomain = host.replace(`.${baseDomain}`, "");
    // Make sure it's a single-level subdomain (org.example.com, not foo.org.example.com)
    if (subdomain && !subdomain.includes(".")) {
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
  }

  // Fallback: no subdomain detected
  return null;
}

/**
 * Check if the current request is from an external/public subdomain
 */
export function isExternalSubdomain(hostname: string): boolean {
  return getSubdomain(hostname) !== null;
}
