import { pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { organization } from "../org/organization.sql";
import { user } from "./user.sql";

/**
 * Identified User table
 * Links external users (from customer applications) to critichut users
 *
 * Key concept: One critichut user can be identified by multiple organizations
 * with different external IDs.
 *
 * Example:
 * - john@example.com (critichut user)
 *   - Identified by Org A as "customer_a_user_999"
 *   - Identified by Org B as "customer_b_user_777"
 *   - Identified by Org C as "customer_c_user_555"
 */
export const identifiedUser = pgTable(
  "identified_user",
  {
    id: text("id").primaryKey(),

    // critichut user ID
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Organization that identified this user
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    // External ID from customer's system (e.g., "customer_user_12345")
    externalId: text("external_id").notNull(),

    // Track last activity
    lastSeenAt: timestamp("last_seen_at").notNull().defaultNow(),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // Ensure one external ID per organization
    uniqueOrgExternal: unique().on(table.organizationId, table.externalId),
  })
);

// Export types
export type IdentifiedUser = typeof identifiedUser.$inferSelect;
export type NewIdentifiedUser = typeof identifiedUser.$inferInsert;
