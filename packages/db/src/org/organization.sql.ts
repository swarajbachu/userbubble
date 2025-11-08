import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "../user/user.sql";

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

  // Role: owner, admin, member
  role: text("role").notNull(),

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

  // The member who sent the invitation
  inviterId: text("inviter_id")
    .notNull()
    .references(() => member.id, { onDelete: "cascade" }),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  // Role to assign when invitation is accepted
  role: text("role").notNull(),

  // Status: pending, accepted, rejected, cancelled
  status: text("status").notNull().default("pending"),

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
