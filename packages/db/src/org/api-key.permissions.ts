import { memberQueries } from "./organization.queries";

export const apiKeyPermissions = {
  /**
   * Check if user can manage API keys
   * Only owners and admins can create/revoke API keys
   */
  canManageApiKeys: async (
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
   * Check if user can view API keys
   * All members can view (but keys are masked)
   */
  canViewApiKeys: async (
    userId: string,
    organizationId: string
  ): Promise<boolean> => memberQueries.isMember(userId, organizationId),
};
