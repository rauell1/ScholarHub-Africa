CREATE TABLE "csv_uploads" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"filename" text NOT NULL,
	"rows" jsonb NOT NULL,
	"status" varchar(50) DEFAULT 'processing' NOT NULL,
	"total_processed" integer DEFAULT 0 NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "passwordResetTokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "passwordResetTokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
