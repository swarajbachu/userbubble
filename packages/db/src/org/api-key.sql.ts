import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { createUniqueIds } from "../lib/ids";
import { organization } from "./organization.sql";

/**
 * API Key table
 * Stores organization API keys for mobile SDK authentication
 *
 * Features:
 * - Multiple keys per organization (max 10)
 * - Optional expiration dates
 * - Usage tracking (lastUsedAt)
 * - Soft delete via isActive flag
 * - Name/description for identification
 */
export const apiKey = pgTable(
  "api_key",
  {
    id: varchar("id", { length: 256 })
      .primaryKey()
      .$defaultFn(() => createUniqueIds("apikey")),

    // Organization relationship
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    // Key identification
    name: text("name").notNull(),
    description: text("description"),

    // The actual API key (hashed with bcrypt)
    // Format when displayed to user: ub_xxx (raw key, shown only once at creation)
    keyHash: text("key_hash").notNull(),

    // Preview of key for UI (last 4 chars, e.g., "...abc123")
    keyPreview: varchar("key_preview", { length: 8 }).notNull(),

    // Status and lifecycle
    isActive: boolean("is_active").notNull().default(true),
    expiresAt: timestamp("expires_at"),
    lastUsedAt: timestamp("last_used_at"),

    // Metadata
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // Index for fast lookup by organization
    orgIdIdx: index("api_key_org_id_idx").on(table.organizationId),
  })
);

// Relations
export const apiKeyRelations = relations(apiKey, ({ one }) => ({
  organization: one(organization, {
    fields: [apiKey.organizationId],
    references: [organization.id],
  }),
}));

// Export types
export type ApiKey = typeof apiKey.$inferSelect;
export type NewApiKey = typeof apiKey.$inferInsert;
