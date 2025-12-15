import { memberQueries } from "../org/organization.queries";

/**
 * Check if user can manage changelog entries for an organization
 * Rules: Only admin/owner roles can manage changelog
 */
export async function canManageChangelog(
  userId: string,
  organizationId: string
): Promise<boolean> {
  return memberQueries.hasRole(userId, organizationId, ["admin", "owner"]);
}
