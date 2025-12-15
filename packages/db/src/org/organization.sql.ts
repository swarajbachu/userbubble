import { relations } from "drizzle-orm";
import { pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { createUniqueIds } from "../lib/ids";
import { identifiedUser } from "../user/identified-user.sql";
import { user } from "../user/user.sql";

// PostgreSQL Enums for type safety
// Const arrays + type extraction for single source of truth
export const roles = ["owner", "admin", "member"] as const;
export type Role = (typeof roles)[number];

export const invitationStatuses = [
  "pending",
  "accepted",
  "rejected",
  "cancelled",
] as const;
export type InvitationStatus = (typeof invitationStatuses)[number];

export const roleEnum = pgEnum("role", roles);
export const invitationStatusEnum = pgEnum(
  "invitation_status",
  invitationStatuses
);

/**
 * Organization table
 * Represents a multi-tenant organization in userbubble
 */
export const organization = pgTable("organization", {
  id: varchar("id", { length: 256 })
    .primaryKey()
    .$defaultFn(() => createUniqueIds("org")),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),
  website: text("website"),

  // userbubble-specific: Secret key for HMAC authentication (encrypted)
  // HMAC secret key for external authentication
  secretKey: text("secret_key"),

  // Metadata for organization-specific settings
  metadata: text("metadata"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/**
 * Member table
 * Links users to organizations with roles
 */
export const member = pgTable("member", {
  id: varchar("id", { length: 256 })
    .primaryKey()
    .$defaultFn(() => createUniqueIds("member")),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  // Role: owner, admin, member (using enum for type safety)
  role: roleEnum("role").notNull(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/**
 * Invitation table
 * Stores pending invitations to organizations
 */
export const invitation = pgTable("invitation", {
  id: varchar("id", { length: 256 })
    .primaryKey()
    .$defaultFn(() => createUniqueIds("invite")),
  email: text("email").notNull(),

  // The user who sent the invitation
  inviterId: text("inviter_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  // Role to assign when invitation is accepted (using enum for type safety)
  role: roleEnum("role").notNull(),

  // Status: pending, accepted, rejected, cancelled (using enum for type safety)
  status: invitationStatusEnum("status").notNull().default("pending"),

  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Relations
export const organizationRelations = relations(organization, ({ many }) => ({
  members: many(member),
  invitations: many(invitation),
  identifiedUsers: many(identifiedUser),
}));

export const memberRelations = relations(member, ({ one }) => ({
  user: one(user, {
    fields: [member.userId],
    references: [user.id],
  }),
  organization: one(organization, {
    fields: [member.organizationId],
    references: [organization.id],
  }),
}));

export const invitationRelations = relations(invitation, ({ one }) => ({
  organization: one(organization, {
    fields: [invitation.organizationId],
    references: [organization.id],
  }),
  inviter: one(user, {
    fields: [invitation.inviterId],
    references: [user.id],
  }),
}));

// Export types
export type Organization = typeof organization.$inferSelect;
export type NewOrganization = typeof organization.$inferInsert;

export type Member = typeof member.$inferSelect;
export type NewMember = typeof member.$inferInsert;

export type Invitation = typeof invitation.$inferSelect;
export type NewInvitation = typeof invitation.$inferInsert;
