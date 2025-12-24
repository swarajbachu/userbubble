import { sql } from "drizzle-orm";
import { pgTable } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const Post = pgTable("post", (t) => ({
  id: t.uuid().notNull().primaryKey().defaultRandom(),
  title: t.varchar({ length: 256 }).notNull(),
  content: t.text().notNull(),
  createdAt: t.timestamp().defaultNow().notNull(),
  updatedAt: t
    .timestamp({ mode: "date", withTimezone: true })
    .$onUpdateFn(() => sql`now()`),
}));

export const CreatePostSchema = createInsertSchema(Post, {
  title: z.string().max(256),
  content: z.string().max(256),
}).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Changelog schemas (entries, feedback links)
export * from "./changelog/changelog.sql";
// Feedback schemas (posts, votes, comments)
export * from "./feedback/feedback.sql";
export * from "./feedback/feedback.validators";
// Slug utilities
export * from "./lib/slug";
// API Key schemas
export * from "./org/api-key.sql";
// API Key validators
export * from "./org/api-key.validators";
// Organization schemas (Better Auth organization plugin tables)
export * from "./org/organization.sql";
// Organization validators
export * from "./org/organization.validators";
// Organization settings (public access, branding)
export * from "./org/organization-settings";
export * from "./user/identified-user.sql";
// User schemas (Better Auth core tables + userbubble extensions)
export * from "./user/user.sql";
