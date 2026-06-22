CREATE EXTENSION IF NOT EXISTS pgcrypto;--> statement-breakpoint
CREATE TABLE "workboard_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" text NOT NULL UNIQUE,
	"encrypted_token" text NOT NULL,
	"token_hash" text NOT NULL,
	"workboard_base_url" text NOT NULL,
	"workboard_v2_base_url" text NOT NULL,
	"last_verified_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "workboard_tokens_user_id_idx" ON "workboard_tokens" ("user_id");--> statement-breakpoint
CREATE INDEX "workboard_tokens_token_hash_idx" ON "workboard_tokens" ("token_hash");
