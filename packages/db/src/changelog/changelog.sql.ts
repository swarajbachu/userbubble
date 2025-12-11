import { relations } from "drizzle-orm";
import {
  boolean,
  pgTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { feedbackPost } from "../feedback/feedback.sql";
import { createUniqueIds } from "../lib/ids";
import { organization } from "../org/organization.sql";
import { user } from "../user/user.sql";

export const changelogEntry = pgTable("changelog_entry", {
  id: varchar("id", { length: 256 })
    .primaryKey()
    .$defaultFn(() => createUniqueIds("log")),
  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  title: text("title").notNull(),
  description: text("description").notNull(),
  version: text("version"),

  isPublished: boolean("is_published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  scheduledFor: timestamp("scheduled_for"),

  authorId: text("author_id")
    .notNull()
    .references(() => user.id),
  coverImageUrl: text("cover_image_url"),
  tags: text("tags").array(),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

export const changelogFeedbackLink = pgTable("changelog_feedback_link", {
  id: varchar("id", { length: 256 })
    .primaryKey()
    .$defaultFn(() => createUniqueIds("log_link")),
  changelogEntryId: text("changelog_entry_id")
    .notNull()
    .references(() => changelogEntry.id, { onDelete: "cascade" }),
  feedbackPostId: text("feedback_post_id")
    .notNull()
    .references(() => feedbackPost.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Relations
export const changelogEntryRelations = relations(
  changelogEntry,
  ({ one, many }) => ({
    organization: one(organization, {
      fields: [changelogEntry.organizationId],
      references: [organization.id],
    }),
    author: one(user, {
      fields: [changelogEntry.authorId],
      references: [user.id],
    }),
    feedbackLinks: many(changelogFeedbackLink),
  })
);

export const changelogFeedbackLinkRelations = relations(
  changelogFeedbackLink,
  ({ one }) => ({
    changelogEntry: one(changelogEntry, {
      fields: [changelogFeedbackLink.changelogEntryId],
      references: [changelogEntry.id],
    }),
    feedbackPost: one(feedbackPost, {
      fields: [changelogFeedbackLink.feedbackPostId],
      references: [feedbackPost.id],
    }),
  })
);
