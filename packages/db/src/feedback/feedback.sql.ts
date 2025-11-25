import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { createUniqueIds } from "../lib/ids";
import { organization } from "../org/organization.sql";
import { user } from "../user/user.sql";

// Enums for feedback post status and categories
// Const arrays + type extraction for single source of truth
export const feedbackStatuses = [
  "open",
  "under_review",
  "planned",
  "in_progress",
  "completed",
  "closed",
] as const;
export type FeedbackStatus = (typeof feedbackStatuses)[number];

export const feedbackCategories = [
  "feature_request",
  "bug",
  "improvement",
  "question",
  "other",
] as const;
export type FeedbackCategory = (typeof feedbackCategories)[number];

export const feedbackStatusEnum = pgEnum("feedback_status", feedbackStatuses);
export const feedbackCategoryEnum = pgEnum(
  "feedback_category",
  feedbackCategories
);

/**
 * Feedback post table
 * Represents user-submitted feedback, feature requests, and bug reports
 */
export const feedbackPost = pgTable("feedback_post", {
  id: varchar("id", { length: 256 })
    .primaryKey()
    .$defaultFn(() => createUniqueIds("post")),

  // Organization this feedback belongs to
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  // Author (can be identified user or anonymous)
  authorId: text("author_id").references(() => user.id, {
    onDelete: "set null",
  }),

  // Post content
  title: text("title").notNull(),
  description: text("description").notNull(),

  // Status and categorization
  status: feedbackStatusEnum("status").notNull().default("open"),
  category: feedbackCategoryEnum("category")
    .notNull()
    .default("feature_request"),

  // Vote count (denormalized for performance)
  voteCount: integer("vote_count").notNull().default(0),

  // Visibility
  isPublic: boolean("is_public").notNull().default(true),

  // Timestamps
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/**
 * Vote table
 * Tracks user votes on feedback posts
 */
export const feedbackVote = pgTable(
  "feedback_vote",
  {
    id: varchar("id", { length: 256 })
      .primaryKey()
      .$defaultFn(() => createUniqueIds("vote")),

    postId: text("post_id")
      .notNull()
      .references(() => feedbackPost.id, { onDelete: "cascade" }),

    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    // Vote value: 1 for upvote, -1 for downvote (future: could support downvotes)
    value: integer("value").notNull().default(1),

    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    // Ensure one vote per user per post
    uniqueUserPost: unique().on(table.postId, table.userId),
  })
);

/**
 * Comment table
 * User comments on feedback posts
 */
export const feedbackComment = pgTable("feedback_comment", {
  id: varchar("id", { length: 256 })
    .primaryKey()
    .$defaultFn(() => createUniqueIds("comment")),

  postId: text("post_id")
    .notNull()
    .references(() => feedbackPost.id, { onDelete: "cascade" }),

  // Author (can be identified user or team member)
  authorId: text("author_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  // Comment content
  content: text("content").notNull(),

  // Optional: parent comment for threading
  // biome-ignore lint/suspicious/noExplicitAny: self-referential table requires any
  parentId: text("parent_id").references((): any => feedbackComment.id, {
    onDelete: "cascade",
  }),

  // Is this comment from a team member?
  isTeamMember: boolean("is_team_member").notNull().default(false),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

// Export types
export type FeedbackPost = typeof feedbackPost.$inferSelect;
export type NewFeedbackPost = typeof feedbackPost.$inferInsert;

export type FeedbackVote = typeof feedbackVote.$inferSelect;
export type NewFeedbackVote = typeof feedbackVote.$inferInsert;

export type FeedbackComment = typeof feedbackComment.$inferSelect;
export type NewFeedbackComment = typeof feedbackComment.$inferInsert;
