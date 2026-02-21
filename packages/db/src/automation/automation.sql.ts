import { relations } from "drizzle-orm";
import {
  jsonb,
  pgEnum,
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

// API key provider type (text column, no enum — new providers don't need migrations)
export type ApiKeyProvider = string;

// PR generation job statuses
export const prJobStatuses = [
  "pending",
  "cloning",
  "analyzing",
  "implementing",
  "creating_pr",
  "completed",
  "failed",
  "cancelled",
] as const;
export type PrJobStatus = (typeof prJobStatuses)[number];
export const prJobStatusEnum = pgEnum("pr_job_status", prJobStatuses);

/**
 * Organization API keys (encrypted)
 * Stores Anthropic API keys and GitHub PATs for each organization
 */
export const organizationApiKey = pgTable(
  "organization_api_key",
  {
    id: varchar("id", { length: 256 })
      .primaryKey()
      .$defaultFn(() => createUniqueIds("api_key")),

    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),

    provider: text("provider").notNull(),

    // Encrypted API key (AES-256-GCM: iv:authTag:encryptedData)
    encryptedKey: text("encrypted_key").notNull(),

    // Last 6 chars of the key for display
    keyHint: varchar("key_hint", { length: 6 }).notNull(),

    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    // One key per provider per org
    uniqueOrgProvider: unique().on(table.organizationId, table.provider),
  })
);

/**
 * GitHub repository configuration per organization
 */
export const organizationGithubConfig = pgTable("organization_github_config", {
  id: varchar("id", { length: 256 })
    .primaryKey()
    .$defaultFn(() => createUniqueIds("api_key")),

  organizationId: text("organization_id")
    .notNull()
    .unique()
    .references(() => organization.id, { onDelete: "cascade" }),

  // Format: "owner/repo"
  repoFullName: text("repo_full_name").notNull(),

  // Default branch (e.g., "main")
  defaultBranch: varchar("default_branch", { length: 256 })
    .notNull()
    .default("main"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/**
 * Organization OAuth connections (e.g., Codex)
 * Stores device flow state and encrypted tokens
 */
export const organizationOAuthConnection = pgTable(
  "organization_oauth_connection",
  {
    id: varchar("id", { length: 256 })
      .primaryKey()
      .$defaultFn(() => createUniqueIds("oauth_conn")),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organization.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    status: text("status").notNull().default("pending"),
    deviceAuthId: text("device_auth_id"),
    userCode: text("user_code"),
    verificationUri: text("verification_uri"),
    deviceAuthExpiresAt: timestamp("device_auth_expires_at"),
    encryptedAccessToken: text("encrypted_access_token"),
    encryptedRefreshToken: text("encrypted_refresh_token"),
    tokenExpiresAt: timestamp("token_expires_at"),
    accountId: text("account_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => ({
    uniqueOrgProvider: unique().on(table.organizationId, table.provider),
  })
);

/**
 * PR generation job queue
 * Tracks AI-powered PR generation from feedback posts
 */
export const prGenerationJob = pgTable("pr_generation_job", {
  id: varchar("id", { length: 256 })
    .primaryKey()
    .$defaultFn(() => createUniqueIds("pr_job")),

  organizationId: text("organization_id")
    .notNull()
    .references(() => organization.id, { onDelete: "cascade" }),

  // The feedback post this PR is generated from
  feedbackPostId: text("feedback_post_id")
    .notNull()
    .references(() => feedbackPost.id, { onDelete: "cascade" }),

  // Who triggered the generation
  triggeredById: text("triggered_by_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),

  // Job status
  status: prJobStatusEnum("status").notNull().default("pending"),

  // AI provider used for this job (e.g., "anthropic", "codex")
  aiProvider: text("ai_provider"),

  // Additional context provided by the admin
  additionalContext: text("additional_context"),

  // Progress log: array of { ts: string, message: string }
  progressLog:
    jsonb("progress_log").$type<Array<{ ts: string; message: string }>>(),

  // Result: PR URL on success
  prUrl: text("pr_url"),

  // Branch name created
  branchName: text("branch_name"),

  // Error message on failure
  errorMessage: text("error_message"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),

  completedAt: timestamp("completed_at"),
});

// Relations
export const organizationApiKeyRelations = relations(
  organizationApiKey,
  ({ one }) => ({
    organization: one(organization, {
      fields: [organizationApiKey.organizationId],
      references: [organization.id],
    }),
  })
);

export const organizationGithubConfigRelations = relations(
  organizationGithubConfig,
  ({ one }) => ({
    organization: one(organization, {
      fields: [organizationGithubConfig.organizationId],
      references: [organization.id],
    }),
  })
);

export const organizationOAuthConnectionRelations = relations(
  organizationOAuthConnection,
  ({ one }) => ({
    organization: one(organization, {
      fields: [organizationOAuthConnection.organizationId],
      references: [organization.id],
    }),
  })
);

export const prGenerationJobRelations = relations(
  prGenerationJob,
  ({ one }) => ({
    organization: one(organization, {
      fields: [prGenerationJob.organizationId],
      references: [organization.id],
    }),
    feedbackPost: one(feedbackPost, {
      fields: [prGenerationJob.feedbackPostId],
      references: [feedbackPost.id],
    }),
    triggeredBy: one(user, {
      fields: [prGenerationJob.triggeredById],
      references: [user.id],
    }),
  })
);

// Export types
export type OrganizationApiKey = typeof organizationApiKey.$inferSelect;
export type NewOrganizationApiKey = typeof organizationApiKey.$inferInsert;

export type OrganizationGithubConfig =
  typeof organizationGithubConfig.$inferSelect;
export type NewOrganizationGithubConfig =
  typeof organizationGithubConfig.$inferInsert;

export type OrganizationOAuthConnection =
  typeof organizationOAuthConnection.$inferSelect;
export type NewOrganizationOAuthConnection =
  typeof organizationOAuthConnection.$inferInsert;

export type PrGenerationJob = typeof prGenerationJob.$inferSelect;
export type NewPrGenerationJob = typeof prGenerationJob.$inferInsert;
