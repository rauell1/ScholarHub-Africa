CREATE TABLE "api_keys" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"client_name" varchar(200) NOT NULL,
	"token" varchar(255) NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "api_keys_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE INDEX "api_keys_token_idx" ON "api_keys" USING btree ("token");