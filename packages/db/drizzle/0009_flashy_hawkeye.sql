-- Idempotent: tables/columns that may already exist from other branches
CREATE TABLE IF NOT EXISTS "api_key" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"key_hash" text NOT NULL,
	"key_preview" varchar(8) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp,
	"last_used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "pr_generation_job" DROP CONSTRAINT IF EXISTS "pr_generation_job_triggered_by_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "pr_generation_job" ALTER COLUMN "triggered_by_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "identified_user" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "organization_github_config" ADD COLUMN IF NOT EXISTS "project_context" text;--> statement-breakpoint
ALTER TABLE "organization_github_config" ADD COLUMN IF NOT EXISTS "project_context_updated_at" timestamp;--> statement-breakpoint
ALTER TABLE "organization_github_config" ADD COLUMN IF NOT EXISTS "analysis_status" text;--> statement-breakpoint
ALTER TABLE "organization_github_config" ADD COLUMN IF NOT EXISTS "analysis_error" text;--> statement-breakpoint
ALTER TABLE "feedback_comment" ADD COLUMN IF NOT EXISTS "is_ai_generated" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "feedback_post" ADD COLUMN IF NOT EXISTS "ai_triage_status" text;--> statement-breakpoint
ALTER TABLE "feedback_post" ADD COLUMN IF NOT EXISTS "ai_triage_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "organization" ADD COLUMN IF NOT EXISTS "onboarding" jsonb;--> statement-breakpoint
ALTER TABLE "identified_user" ADD COLUMN IF NOT EXISTS "email" text;--> statement-breakpoint
ALTER TABLE "identified_user" ADD COLUMN IF NOT EXISTS "name" text;--> statement-breakpoint
ALTER TABLE "identified_user" ADD COLUMN IF NOT EXISTS "avatar" text;--> statement-breakpoint
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'api_key_organization_id_organization_id_fk') THEN
    ALTER TABLE "api_key" ADD CONSTRAINT "api_key_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
  END IF;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "api_key_org_id_idx" ON "api_key" USING btree ("organization_id");--> statement-breakpoint
ALTER TABLE "pr_generation_job" ADD CONSTRAINT "pr_generation_job_triggered_by_id_user_id_fk" FOREIGN KEY ("triggered_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
