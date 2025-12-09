CREATE TABLE "changelog_entry" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"organization_id" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"version" text,
	"is_published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"scheduled_for" timestamp,
	"author_id" text NOT NULL,
	"cover_image_url" text,
	"tags" text[],
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "changelog_feedback_link" (
	"id" varchar(256) PRIMARY KEY NOT NULL,
	"changelog_entry_id" text NOT NULL,
	"feedback_post_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "feedback_comment" ALTER COLUMN "author_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "feedback_vote" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "feedback_comment" ADD COLUMN "author_name" text;--> statement-breakpoint
ALTER TABLE "feedback_post" ADD COLUMN "author_email" text;--> statement-breakpoint
ALTER TABLE "feedback_vote" ADD COLUMN "session_id" text;--> statement-breakpoint
ALTER TABLE "changelog_entry" ADD CONSTRAINT "changelog_entry_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "changelog_entry" ADD CONSTRAINT "changelog_entry_author_id_user_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "changelog_feedback_link" ADD CONSTRAINT "changelog_feedback_link_changelog_entry_id_changelog_entry_id_fk" FOREIGN KEY ("changelog_entry_id") REFERENCES "public"."changelog_entry"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "changelog_feedback_link" ADD CONSTRAINT "changelog_feedback_link_feedback_post_id_feedback_post_id_fk" FOREIGN KEY ("feedback_post_id") REFERENCES "public"."feedback_post"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_vote" ADD CONSTRAINT "feedback_vote_post_id_session_id_unique" UNIQUE("post_id","session_id");