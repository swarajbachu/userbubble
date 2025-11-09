import { pgEnum, pgTable } from "drizzle-orm/pg-core";

// PostgreSQL Enums for type safety
export const sessionTypeEnum = pgEnum("session_type", [
  "identified",
  "authenticated",
]);
export const authMethodEnum = pgEnum("auth_method", [
  "external",
  "credential",
  "oauth",
]);

/**
 * User table (Better Auth core)
 */
export const user = pgTable("user", (t) => ({
  id: t.text().primaryKey(),
  name: t.text().notNull(),
  email: t.text().notNull().unique(),
  emailVerified: t.boolean().notNull().default(false),
  image: t.text(),
  createdAt: t.timestamp().notNull().defaultNow(),
  updatedAt: t
    .timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}));

/**
 * Session table (Better Auth core + critichut extensions)
 */
export const session = pgTable("session", (t) => ({
  id: t.text().primaryKey(),
  expiresAt: t.timestamp().notNull(),
  token: t.text().notNull().unique(),
  createdAt: t.timestamp().notNull().defaultNow(),
  updatedAt: t
    .timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  ipAddress: t.text(),
  userAgent: t.text(),
  userId: t
    .text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  // critichut custom fields for two-tier session system
  // Session type: "identified" (limited) or "authenticated" (full access)
  sessionType: sessionTypeEnum("session_type").notNull().default("authenticated"),

  // Auth method: "external" (HMAC), "credential" (password), "oauth" (Google/GitHub/etc)
  authMethod: authMethodEnum("auth_method").notNull().default("credential"),

  // Active organization (for Better Auth organization plugin)
  activeOrganizationId: t.text("active_organization_id"),
}));

/**
 * Account table (Better Auth - OAuth/credential storage)
 */
export const account = pgTable("account", (t) => ({
  id: t.text().primaryKey(),
  accountId: t.text().notNull(),
  providerId: t.text().notNull(),
  userId: t
    .text()
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: t.text(),
  refreshToken: t.text(),
  idToken: t.text(),
  accessTokenExpiresAt: t.timestamp(),
  refreshTokenExpiresAt: t.timestamp(),
  scope: t.text(),
  password: t.text(),
  createdAt: t.timestamp().notNull().defaultNow(),
  updatedAt: t
    .timestamp()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
}));

/**
 * Verification table (Better Auth - email verification, password reset)
 */
export const verification = pgTable("verification", (t) => ({
  id: t.text().primaryKey(),
  identifier: t.text().notNull(),
  value: t.text().notNull(),
  expiresAt: t.timestamp().notNull(),
  createdAt: t.timestamp().defaultNow(),
  updatedAt: t
    .timestamp()
    .defaultNow()
    .$onUpdate(() => new Date()),
}));

// Export types
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;

export type Session = typeof session.$inferSelect;
export type NewSession = typeof session.$inferInsert;

export type Account = typeof account.$inferSelect;
export type NewAccount = typeof account.$inferInsert;

export type Verification = typeof verification.$inferSelect;
export type NewVerification = typeof verification.$inferInsert;
