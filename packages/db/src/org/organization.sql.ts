import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "../user/user.sql";

// PostgreSQL Enums for type safety
export const roleEnum = pgEnum("role", ["owner", "admin", "member"]);
export const invitationStatusEnum = pgEnum("invitation_status", [
  "pending",
  "accepted",
  "rejected",
  "cancelled",
]);

/**
 * Organization table
 * Represents a multi-tenant organization in critichut
 */
export const organization = pgTable("organization", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  logo: text("logo"),

  // critichut-specific: Secret key for HMAC authentication (encrypted)
  // HMAC secret key for external authentication
  secretKey: text("secret_key").notNull(),

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
  id: text("id").primaryKey(),
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
  id: text("id").primaryKey(),
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

// Export types
export type Organization = typeof organization.$inferSelect;
export type NewOrganization = typeof organization.$inferInsert;

export type Member = typeof member.$inferSelect;
export type NewMember = typeof member.$inferInsert;

export type Invitation = typeof invitation.$inferSelect;
export type NewInvitation = typeof invitation.$inferInsert;
