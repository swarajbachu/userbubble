import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { feedbackPost } from "../feedback/feedback.sql";
import { createUniqueIds } from "../lib/ids";
import { organization } from "../org/organization.sql";
import { user } from "../user/user.sql";

export const feedbackReference = pgTable(
  "feedback_reference",
  {
    id: varchar("id", { length: 256 })
      .primaryKey()
      .$defaultFn(() => createUniqueIds("post")),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    postId: text("post_id")
      .notNull()
      .references(() => feedbackPost.id, { onDelete: "cascade" }),
    url: text("url").notNull(),
    title: text("title").notNull(),
    authorId: text("author_id").references(() => user.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [unique().on(table.postId, table.url)]
);

export const activity = pgTable(
  "activity",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id"),
    actorId: text("actor_id"),
    agentId: text("agent_id"),
    operation: text("operation").notNull(),
    outcome: text("outcome").notNull(),
    requestId: text("request_id").notNull(),
    resourceId: text("resource_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("activity_organization_time_idx").on(
      table.organizationId,
      table.createdAt
    ),
  ]
);

export const operationReceipt = pgTable("operation_receipt", {
  id: text("id").primaryKey(),
  actorId: text("actor_id").notNull(),
  organizationId: text("organization_id").notNull(),
  operation: text("operation").notNull(),
  inputHash: text("input_hash").notNull(),
  result: jsonb("result"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
