import { memberQueries } from "./organization.queries";

/**
 * Permission helpers for organization settings and management
 * These functions check if a user has the required permissions to perform actions
 */
export const organizationPermissions = {
  /**
   * Check if user can manage organization settings
   * Only owners and admins can manage settings
   */
  canManageSettings: async (
    userId: string,
    organizationId: string
  ): Promise<boolean> => {
    const member = await memberQueries.findByUserAndOrg(userId, organizationId);
    if (!member) {
      return false;
    }
    return ["owner", "admin"].includes(member.role);
  },

  /**
   * Check if user can manage organization members
   * Only owners and admins can manage members
   */
  canManageMembers: async (
    userId: string,
    organizationId: string
  ): Promise<boolean> => {
    const member = await memberQueries.findByUserAndOrg(userId, organizationId);
    if (!member) {
      return false;
    }
    return ["owner", "admin"].includes(member.role);
  },

  /**
   * Check if user can delete the organization
   * Only the owner can delete an organization
   */
  canDeleteOrganization: async (
    userId: string,
    organizationId: string
  ): Promise<boolean> => {
    const member = await memberQueries.findByUserAndOrg(userId, organizationId);
    if (!member) {
      return false;
    }
    return member.role === "owner";
  },

  /**
   * Get the user's role in an organization
   * Returns null if user is not a member
   */
  getUserRole: async (
    userId: string,
    organizationId: string
  ): Promise<"owner" | "admin" | "member" | null> => {
    const member = await memberQueries.findByUserAndOrg(userId, organizationId);
    return member?.role ?? null;
  },
};
