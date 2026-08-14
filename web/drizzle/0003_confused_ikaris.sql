CREATE TABLE "newsletter_subscribers" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"email" varchar(254) NOT NULL,
	"name" varchar(200) DEFAULT '' NOT NULL,
	"source" varchar(50) DEFAULT 'footer' NOT NULL,
	"confirmed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE UNIQUE INDEX "newsletter_subscribers_email_idx" ON "newsletter_subscribers" USING btree ("email");