import type { Role } from "./organization.sql";

/**
 * Pure (sync) permission helpers that accept a pre-resolved role.
 * Use these with middleware that resolves the member record once per request.
 */
export const permissions = {
  canManageSettings: (role: Role): boolean =>
    role === "owner" || role === "admin",

  canManageMembers: (role: Role): boolean =>
    role === "owner" || role === "admin",

  canDeleteOrganization: (role: Role): boolean => role === "owner",

  isMember: (role: Role): boolean =>
    role === "owner" || role === "admin" || role === "member",

  isAdmin: (role: Role): boolean => role === "owner" || role === "admin",
};
