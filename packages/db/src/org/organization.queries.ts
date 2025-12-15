import { and, desc, eq } from "drizzle-orm";
import { db } from "../client";
import {
  type InvitationStatus,
  invitation,
  member,
  type NewInvitation,
  type NewMember,
  type NewOrganization,
  organization,
  type Role,
} from "./organization.sql";

/**
 * Organization Queries
 */

export const organizationQueries = {
  /**
   * Find organization by ID
   */
  findById: async (id: string) =>
    db.query.organization.findFirst({
      where: eq(organization.id, id),
    }),

  /**
   * Find organization by slug
   */
  findBySlug: async (slug: string) =>
    db.query.organization.findFirst({
      where: eq(organization.slug, slug),
    }),

  /**
   * Check if slug is available
   */
  isSlugAvailable: async (slug: string) => {
    const existing = await db.query.organization.findFirst({
      where: eq(organization.slug, slug),
    });
    return !existing;
  },

  /**
   * Create organization
   */
  create: async (data: NewOrganization) => {
    const [org] = await db.insert(organization).values(data).returning();
    return org;
  },

  /**
   * Update organization
   */
  update: async (id: string, data: Partial<NewOrganization>) => {
    const [updated] = await db
      .update(organization)
      .set(data)
      .where(eq(organization.id, id))
      .returning();
    return updated;
  },

  /**
   * Delete organization
   */
  delete: async (id: string) => {
    await db.delete(organization).where(eq(organization.id, id));
  },

  /**
   * List all organizations (for sitemap generation)
   */
  listAll: async () => db.query.organization.findMany(),

  /**
   * List user's organizations
   */
  listUserOrganizations: async (userId: string) =>
    db.query.member.findMany({
      where: eq(member.userId, userId),
      with: {
        organization: true,
      },
      orderBy: desc(member.createdAt),
    }),
};

/**
 * Member Queries
 */

export const memberQueries = {
  /**
   * Find member by ID
   */
  findById: async (id: string) =>
    db.query.member.findFirst({
      where: eq(member.id, id),
      with: {
        user: true,
        organization: true,
      },
    }),

  /**
   * Find member by user ID and organization ID
   */
  findByUserAndOrg: async (userId: string, organizationId: string) =>
    db.query.member.findFirst({
      where: and(
        eq(member.userId, userId),
        eq(member.organizationId, organizationId)
      ),
    }),

  /**
   * Check if user is member of organization
   */
  isMember: async (userId: string, organizationId: string) => {
    const existing = await memberQueries.findByUserAndOrg(
      userId,
      organizationId
    );
    return !!existing;
  },

  /**
   * Check if user has role in organization
   */
  hasRole: async (
    userId: string,
    organizationId: string,
    role: Role | Role[]
  ) => {
    const memberRecord = await memberQueries.findByUserAndOrg(
      userId,
      organizationId
    );
    if (!memberRecord) {
      return false;
    }

    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(memberRecord.role);
  },

  /**
   * Add member to organization
   */
  create: async (data: NewMember) => {
    const [newMember] = await db.insert(member).values(data).returning();
    return newMember;
  },

  /**
   * Update member role
   */
  updateRole: async (id: string, role: Role) => {
    const [updated] = await db
      .update(member)
      .set({ role })
      .where(eq(member.id, id))
      .returning();
    return updated;
  },

  /**
   * Remove member from organization
   */
  remove: async (id: string) => {
    await db.delete(member).where(eq(member.id, id));
  },

  /**
   * List organization members
   */
  listByOrganization: async (organizationId: string) =>
    db.query.member.findMany({
      where: eq(member.organizationId, organizationId),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: desc(member.createdAt),
    }),
};

/**
 * Invitation Queries
 */

export const invitationQueries = {
  /**
   * Find invitation by ID
   */
  findById: async (id: string) =>
    db.query.invitation.findFirst({
      where: eq(invitation.id, id),
      with: {
        organization: true,
        inviter: true,
      },
    }),

  /**
   * Find pending invitation by email and organization
   */
  findPending: async (email: string, organizationId: string) =>
    db.query.invitation.findFirst({
      where: and(
        eq(invitation.email, email),
        eq(invitation.organizationId, organizationId),
        eq(invitation.status, "pending")
      ),
    }),

  /**
   * Create invitation
   */
  create: async (data: NewInvitation) => {
    const [inv] = await db.insert(invitation).values(data).returning();
    return inv;
  },

  /**
   * Update invitation status
   */
  updateStatus: async (id: string, status: InvitationStatus) => {
    const [updated] = await db
      .update(invitation)
      .set({ status })
      .where(eq(invitation.id, id))
      .returning();
    return updated;
  },

  /**
   * Cancel invitation
   */
  cancel: async (id: string) => invitationQueries.updateStatus(id, "cancelled"),

  /**
   * List organization invitations
   */
  listByOrganization: async (organizationId: string) =>
    db.query.invitation.findMany({
      where: eq(invitation.organizationId, organizationId),
      with: {
        inviter: {
          columns: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: desc(invitation.createdAt),
    }),

  /**
   * List user invitations by email
   */
  listByEmail: async (email: string) =>
    db.query.invitation.findMany({
      where: and(eq(invitation.email, email), eq(invitation.status, "pending")),
      with: {
        organization: true,
        inviter: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: desc(invitation.createdAt),
    }),
};
