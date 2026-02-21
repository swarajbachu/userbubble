CREATE TYPE "public"."pr_job_status" AS ENUM('pending', 'cloning', 'analyzing', 'implementing', 'creating_pr', 'completed', 'failed', 'cancelled');--> statement-breakpoint
CREATE TABLE "organization_api_key" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"provider" text NOT NULL,
	"encrypted_key" text NOT NULL,
	"key_hint" varchar(6) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_api_key_organization_id_provider_unique" UNIQUE("organization_id","provider")
);
--> statement-breakpoint
CREATE TABLE "organization_github_config" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"repo_full_name" text NOT NULL,
	"default_branch" varchar(256) DEFAULT 'main' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_github_config_organization_id_unique" UNIQUE("organization_id")
);
--> statement-breakpoint
CREATE TABLE "organization_oauth_connection" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"provider" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"device_auth_id" text,
	"user_code" text,
	"verification_uri" text,
	"device_auth_expires_at" timestamp,
	"encrypted_access_token" text,
	"encrypted_refresh_token" text,
	"token_expires_at" timestamp,
	"account_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organization_oauth_connection_organization_id_provider_unique" UNIQUE("organization_id","provider")
);
--> statement-breakpoint
CREATE TABLE "pr_generation_job" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"feedback_post_id" text NOT NULL,
	"triggered_by_id" text NOT NULL,
	"status" "pr_job_status" DEFAULT 'pending' NOT NULL,
	"ai_provider" text,
	"additional_context" text,
	"progress_log" jsonb,
	"pr_url" text,
	"branch_name" text,
	"error_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "organization_api_key" ADD CONSTRAINT "organization_api_key_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_github_config" ADD CONSTRAINT "organization_github_config_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_oauth_connection" ADD CONSTRAINT "organization_oauth_connection_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pr_generation_job" ADD CONSTRAINT "pr_generation_job_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pr_generation_job" ADD CONSTRAINT "pr_generation_job_feedback_post_id_feedback_post_id_fk" FOREIGN KEY ("feedback_post_id") REFERENCES "public"."feedback_post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pr_generation_job" ADD CONSTRAINT "pr_generation_job_triggered_by_id_user_id_fk" FOREIGN KEY ("triggered_by_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;