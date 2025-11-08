import { and, eq } from "drizzle-orm";
import { db } from "../client";
import { identifiedUser, type NewIdentifiedUser } from "./identified-user.sql";

/**
 * Identified User Queries
 */

export const identifiedUserQueries = {
  /**
   * Find identified user by organization and external ID
   */
  findByOrgAndExternalId: async (organizationId: string, externalId: string) =>
    db.query.identifiedUser.findFirst({
      where: and(
        eq(identifiedUser.organizationId, organizationId),
        eq(identifiedUser.externalId, externalId)
      ),
      with: {
        user: true,
        organization: true,
      },
    }),

  /**
   * Find identified user by user ID and organization ID
   */
  findByUserAndOrg: async (userId: string, organizationId: string) =>
    db.query.identifiedUser.findFirst({
      where: and(
        eq(identifiedUser.userId, userId),
        eq(identifiedUser.organizationId, organizationId)
      ),
    }),

  /**
   * List all organizations a user is identified with
   */
  listUserOrganizations: async (userId: string) =>
    db.query.identifiedUser.findMany({
      where: eq(identifiedUser.userId, userId),
      with: {
        organization: true,
      },
    }),

  /**
   * Create or update identified user
   */
  upsert: async (data: NewIdentifiedUser) => {
    // Check if already exists
    const existing = await identifiedUserQueries.findByOrgAndExternalId(
      data.organizationId,
      data.externalId
    );

    if (existing) {
      // Update last seen
      const [updated] = await db
        .update(identifiedUser)
        .set({
          lastSeenAt: new Date(),
          userId: data.userId, // Update user ID in case email changed
        })
        .where(eq(identifiedUser.id, existing.id))
        .returning();
      return updated;
    }

    // Create new
    const [created] = await db.insert(identifiedUser).values(data).returning();
    return created;
  },

  /**
   * Update last seen timestamp
   */
  updateLastSeen: async (id: string) => {
    const [updated] = await db
      .update(identifiedUser)
      .set({ lastSeenAt: new Date() })
      .where(eq(identifiedUser.id, id))
      .returning();
    return updated;
  },

  /**
   * Remove identified user link
   */
  remove: async (id: string) => {
    await db.delete(identifiedUser).where(eq(identifiedUser.id, id));
  },
};
