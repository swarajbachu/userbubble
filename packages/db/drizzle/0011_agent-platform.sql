CREATE TABLE "activity" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" text,
	"actor_id" text,
	"agent_id" text,
	"operation" text NOT NULL,
	"outcome" text NOT NULL,
	"request_id" text NOT NULL,
	"resource_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_reference" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"post_id" text NOT NULL,
	"url" text NOT NULL,
	"title" text NOT NULL,
	"author_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "feedback_reference_post_id_url_unique" UNIQUE("post_id","url")
);
--> statement-breakpoint
CREATE TABLE "operation_receipt" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text NOT NULL,
	"organization_id" text NOT NULL,
	"operation" text NOT NULL,
	"input_hash" text NOT NULL,
	"result" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"user_id" text,
	"host_id" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"mode" text DEFAULT 'delegated' NOT NULL,
	"public_key" text NOT NULL,
	"kid" text,
	"jwks_url" text,
	"last_used_at" timestamp,
	"activated_at" timestamp,
	"expires_at" timestamp,
	"metadata" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_capability_grant" (
	"id" text PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"capability" text NOT NULL,
	"denied_by" text,
	"granted_by" text,
	"expires_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"reason" text,
	"constraints" text
);
--> statement-breakpoint
CREATE TABLE "agent_host" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"user_id" text,
	"default_capabilities" text,
	"public_key" text,
	"kid" text,
	"jwks_url" text,
	"enrollment_token_hash" text,
	"enrollment_token_expires_at" timestamp,
	"status" text DEFAULT 'active' NOT NULL,
	"activated_at" timestamp,
	"expires_at" timestamp,
	"last_used_at" timestamp,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_request" (
	"id" text PRIMARY KEY NOT NULL,
	"method" text NOT NULL,
	"agent_id" text,
	"host_id" text,
	"user_id" text,
	"capabilities" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"user_code_hash" text,
	"login_hint" text,
	"binding_message" text,
	"client_notification_token" text,
	"client_notification_endpoint" text,
	"delivery_mode" text,
	"interval" integer NOT NULL,
	"last_polled_at" timestamp,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
-- Preserve implementation links before removing hosted execution records.
INSERT INTO "feedback_reference" ("id", "organization_id", "post_id", "url", "title", "author_id", "created_at")
SELECT 'legacy-' || "id", "organization_id", "feedback_post_id", "pr_url", 'Implementation', "triggered_by_id", "created_at"
FROM "pr_generation_job"
WHERE "pr_url" IS NOT NULL AND "pr_url" <> ''
ON CONFLICT ("post_id", "url") DO NOTHING;
--> statement-breakpoint
INSERT INTO "activity" ("id", "organization_id", "actor_id", "operation", "outcome", "request_id", "resource_id", "created_at")
SELECT 'legacy-' || "id", "organization_id", "triggered_by_id", 'implementation.history', "status"::text, "id", "feedback_post_id", "created_at"
FROM "pr_generation_job";
--> statement-breakpoint
DROP TABLE "organization_api_key" CASCADE;--> statement-breakpoint
DROP TABLE "organization_github_config" CASCADE;--> statement-breakpoint
DROP TABLE "organization_oauth_connection" CASCADE;--> statement-breakpoint
DROP TABLE "pr_generation_job" CASCADE;--> statement-breakpoint
ALTER TABLE "feedback_reference" ADD CONSTRAINT "feedback_reference_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_reference" ADD CONSTRAINT "feedback_reference_post_id_feedback_post_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."feedback_post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_reference" ADD CONSTRAINT "feedback_reference_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent" ADD CONSTRAINT "agent_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent" ADD CONSTRAINT "agent_host_id_agent_host_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."agent_host"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_capability_grant" ADD CONSTRAINT "agent_capability_grant_agent_id_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_capability_grant" ADD CONSTRAINT "agent_capability_grant_denied_by_user_id_fk" FOREIGN KEY ("denied_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_capability_grant" ADD CONSTRAINT "agent_capability_grant_granted_by_user_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_host" ADD CONSTRAINT "agent_host_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_request" ADD CONSTRAINT "approval_request_agent_id_agent_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_request" ADD CONSTRAINT "approval_request_host_id_agent_host_id_fk" FOREIGN KEY ("host_id") REFERENCES "public"."agent_host"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_request" ADD CONSTRAINT "approval_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_organization_time_idx" ON "activity" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "agent_user_id_idx" ON "agent" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "agent_host_id_idx" ON "agent" USING btree ("host_id");--> statement-breakpoint
CREATE INDEX "agent_status_idx" ON "agent" USING btree ("status");--> statement-breakpoint
CREATE INDEX "agent_kid_idx" ON "agent" USING btree ("kid");--> statement-breakpoint
CREATE INDEX "agent_capability_grant_agent_id_idx" ON "agent_capability_grant" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "agent_capability_grant_capability_idx" ON "agent_capability_grant" USING btree ("capability");--> statement-breakpoint
CREATE INDEX "agent_capability_grant_granted_by_idx" ON "agent_capability_grant" USING btree ("granted_by");--> statement-breakpoint
CREATE INDEX "agent_capability_grant_status_idx" ON "agent_capability_grant" USING btree ("status");--> statement-breakpoint
CREATE INDEX "agent_host_user_id_idx" ON "agent_host" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "agent_host_kid_idx" ON "agent_host" USING btree ("kid");--> statement-breakpoint
CREATE INDEX "agent_host_enrollment_token_hash_idx" ON "agent_host" USING btree ("enrollment_token_hash");--> statement-breakpoint
CREATE INDEX "agent_host_status_idx" ON "agent_host" USING btree ("status");--> statement-breakpoint
CREATE INDEX "approval_request_agent_id_idx" ON "approval_request" USING btree ("agent_id");--> statement-breakpoint
CREATE INDEX "approval_request_host_id_idx" ON "approval_request" USING btree ("host_id");--> statement-breakpoint
CREATE INDEX "approval_request_user_id_idx" ON "approval_request" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "approval_request_status_idx" ON "approval_request" USING btree ("status");--> statement-breakpoint
ALTER TABLE "feedback_post" DROP COLUMN "ai_triage_status";--> statement-breakpoint
ALTER TABLE "feedback_post" DROP COLUMN "ai_triage_count";--> statement-breakpoint
DROP TYPE "public"."pr_job_status";