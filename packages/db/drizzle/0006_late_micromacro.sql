ALTER TABLE "identified_user" ALTER COLUMN "user_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "identified_user" ADD COLUMN "email" text NOT NULL;--> statement-breakpoint
ALTER TABLE "identified_user" ADD COLUMN "name" text;--> statement-breakpoint
ALTER TABLE "identified_user" ADD COLUMN "avatar" text;