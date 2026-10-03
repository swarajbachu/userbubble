/**
 * Slug generation and validation utilities for organization URLs
 */

/**
 * Reserved slugs that cannot be used for organizations
 * Prevents conflicts with application routes
 */
export const RESERVED_SLUGS = [
  "admin",
  "api",
  "auth",
  "dashboard",
  "onboarding",
  "sign-in",
  "sign-up",
  "signin",
  "signup",
  "settings",
  "billing",
  "help",
  "docs",
  "blog",
  "about",
  "contact",
  "pricing",
  "terms",
  "privacy",
  "support",
  "_next",
  "static",
  "feedback",
  "roadmap",
] as const;

/**
 * Generate a URL-safe slug from organization name
 * - Converts to lowercase
 * - Replaces spaces with hyphens
 * - Removes special characters (keeps only a-z, 0-9, hyphen)
 * - Collapses multiple hyphens
 * - Trims leading/trailing hyphens
 *
 * @param name - Organization name to convert
 * @returns URL-safe slug
 *
 * @example
 * createSlug("Acme Inc.") // "acme-inc"
 * createSlug("My   Cool  App!") // "my-cool-app"
 */
export function createSlug(name: string): string {
  return (
    name
      .toLowerCase()
      .trim()
      // Replace spaces with hyphens
      .replace(/\s+/g, "-")
      // Remove special characters (keep only letters, numbers, hyphens)
      .replace(/[^a-z0-9-]/g, "")
      // Collapse multiple hyphens
      .replace(/-+/g, "-")
      // Trim leading/trailing hyphens
      .replace(/^-|-$/g, "")
  );
}

/**
 * Regex for validating slug format
 * Must be 3-50 chars, lowercase letters/numbers/hyphens only
 * Cannot start or end with hyphen
 */
const SLUG_REGEX = /^[a-z0-9]([a-z0-9-]{1,48}[a-z0-9])?$/;

/**
 * Validate slug format
 * - Must be lowercase
 * - Only letters, numbers, and hyphens
 * - 3-50 characters
 * - Cannot start or end with hyphen
 *
 * @param slug - Slug to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * isValidSlug("my-org") // true
 * isValidSlug("my_org") // false (underscores not allowed)
 * isValidSlug("-myorg") // false (starts with hyphen)
 * isValidSlug("ab") // false (too short)
 */
export function isValidSlug(slug: string): boolean {
  return SLUG_REGEX.test(slug);
}

/**
 * Check if slug is reserved and cannot be used
 *
 * @param slug - Slug to check
 * @returns true if reserved, false if available
 *
 * @example
 * isReservedSlug("admin") // true
 * isReservedSlug("my-org") // false
 */
export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.includes(slug as (typeof RESERVED_SLUGS)[number]);
}
