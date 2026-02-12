import type { Role } from "../org/organization.sql";

/**
 * Check if a role can manage changelog entries.
 * Only admin/owner roles can manage changelog.
 */
export const canManageChangelogSync = (role: Role): boolean =>
  role === "owner" || role === "admin";
