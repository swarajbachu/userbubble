import type { Role } from "../org/organization.sql";

/**
 * Automation permission helpers.
 * Only org owners and admins can manage API keys and trigger PR generation.
 */
export const automationPermissions = {
  canManageApiKeys: (role: Role): boolean =>
    role === "owner" || role === "admin",

  canManageGithubConfig: (role: Role): boolean =>
    role === "owner" || role === "admin",

  canTriggerPrGeneration: (role: Role): boolean =>
    role === "owner" || role === "admin",

  canCancelJob: (role: Role): boolean => role === "owner" || role === "admin",

  canViewJobs: (role: Role): boolean =>
    role === "owner" || role === "admin" || role === "member",
};
