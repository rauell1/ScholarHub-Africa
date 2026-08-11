CREATE TABLE "accounts" (
	"userId" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"providerAccountId" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_providerAccountId_pk" PRIMARY KEY("provider","providerAccountId")
);
--> statement-breakpoint
CREATE TABLE "applicant_profiles" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"email" varchar(254) NOT NULL,
	"full_name" varchar(200) DEFAULT '' NOT NULL,
	"nationality" varchar(100) DEFAULT '' NOT NULL,
	"degree_field" varchar(200) DEFAULT '' NOT NULL,
	"graduation_year" smallint,
	"gpa" numeric(4, 2),
	"experience_years" numeric(3, 1),
	"has_ielts" boolean DEFAULT false NOT NULL,
	"ielts_score" numeric(3, 1),
	"has_toefl" boolean DEFAULT false NOT NULL,
	"toefl_score" smallint,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "applicant_profiles_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "applicant_profiles_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "change_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"scholarship_id" bigint,
	"change_type" varchar(50) DEFAULT 'update' NOT NULL,
	"field_changed" varchar(100) DEFAULT '' NOT NULL,
	"old_value" text DEFAULT '' NOT NULL,
	"new_value" text DEFAULT '' NOT NULL,
	"source" text DEFAULT '' NOT NULL,
	"changed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"changed_by" varchar(100) DEFAULT 'system' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_config" (
	"key" text PRIMARY KEY NOT NULL,
	"config" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"anonymized_ip" varchar(200) DEFAULT '' NOT NULL,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	"country" varchar(10) DEFAULT '' NOT NULL,
	"region" varchar(10) DEFAULT 'none' NOT NULL,
	"consent_string" text DEFAULT '' NOT NULL,
	"tcf_string" text DEFAULT '' NOT NULL,
	"categories" jsonb NOT NULL,
	"accepted" boolean DEFAULT false NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"language" varchar(10) DEFAULT 'en' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consent_policies" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"kind" varchar(50) NOT NULL,
	"content" text DEFAULT '' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"published_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "consent_policies_kind_unique" UNIQUE("kind")
);
--> statement-breakpoint
CREATE TABLE "countries" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"iso_code" varchar(2) NOT NULL,
	"flag_emoji" varchar(10) DEFAULT '' NOT NULL,
	"region" varchar(50) DEFAULT 'Europe' NOT NULL,
	CONSTRAINT "countries_name_unique" UNIQUE("name"),
	CONSTRAINT "countries_iso_code_unique" UNIQUE("iso_code")
);
--> statement-breakpoint
CREATE TABLE "document_items" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"profile_id" bigint NOT NULL,
	"name" varchar(200) NOT NULL,
	"status" varchar(20) DEFAULT 'not_started' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"due_date" date,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fields_of_study" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"slug" varchar(100) NOT NULL,
	"icon" varchar(50) DEFAULT '' NOT NULL,
	CONSTRAINT "fields_of_study_name_unique" UNIQUE("name"),
	CONSTRAINT "fields_of_study_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "scholarship_fields" (
	"scholarship_id" bigint NOT NULL,
	"field_id" bigint NOT NULL,
	CONSTRAINT "scholarship_fields_scholarship_id_field_id_pk" PRIMARY KEY("scholarship_id","field_id")
);
--> statement-breakpoint
CREATE TABLE "scholarships" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"slug" varchar(200) NOT NULL,
	"name" varchar(300) NOT NULL,
	"short_name" varchar(100) DEFAULT '' NOT NULL,
	"programme" varchar(300) DEFAULT '' NOT NULL,
	"university" varchar(300) DEFAULT '' NOT NULL,
	"country_id" bigint NOT NULL,
	"funding_type" varchar(20) NOT NULL,
	"funding_detail" text DEFAULT '' NOT NULL,
	"application_fee" numeric(8, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(3) DEFAULT 'USD' NOT NULL,
	"eligibility_label" varchar(2) DEFAULT 'PE' NOT NULL,
	"english_requirement" text DEFAULT '' NOT NULL,
	"age_min" smallint,
	"age_max" smallint,
	"experience_years_min" numeric(3, 1),
	"gpa_minimum" numeric(4, 2),
	"nationality_notes" text DEFAULT '' NOT NULL,
	"mba_impact" varchar(20) DEFAULT 'none' NOT NULL,
	"mba_notes" text DEFAULT '' NOT NULL,
	"score" smallint DEFAULT 0 NOT NULL,
	"competitiveness" varchar(50) DEFAULT '' NOT NULL,
	"deadline_date" date,
	"deadline_notes" text DEFAULT '' NOT NULL,
	"status" varchar(30) DEFAULT 'unknown' NOT NULL,
	"cycle_year" smallint,
	"notes" text DEFAULT '' NOT NULL,
	"action_required" text DEFAULT '' NOT NULL,
	"official_link" varchar(500) DEFAULT '' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"verified_at" timestamp with time zone,
	"verified_source" text DEFAULT '' NOT NULL,
	"is_featured" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"search_vector" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('english', coalesce("name", '')), 'A') ||
          setweight(to_tsvector('english', coalesce("short_name", '')), 'A') ||
          setweight(to_tsvector('english', coalesce("programme", '')), 'B') ||
          setweight(to_tsvector('english', coalesce("university", '')), 'B') ||
          setweight(to_tsvector('english', coalesce("notes", '')), 'C') ||
          setweight(to_tsvector('english', coalesce("funding_detail", '')), 'D')) STORED,
	CONSTRAINT "scholarships_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sessionToken" text PRIMARY KEY NOT NULL,
	"userId" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tracked_applications" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"profile_id" bigint NOT NULL,
	"scholarship_id" bigint NOT NULL,
	"stage" varchar(30) DEFAULT 'researching' NOT NULL,
	"priority" varchar(10) DEFAULT 'target' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"next_action" text DEFAULT '' NOT NULL,
	"next_action_due" date,
	"sop_status" varchar(20) DEFAULT 'not_started' NOT NULL,
	"refs_status" varchar(20) DEFAULT 'not_started' NOT NULL,
	"transcript_ready" boolean DEFAULT false NOT NULL,
	"moi_ready" boolean DEFAULT false NOT NULL,
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"emailVerified" timestamp,
	"image" text
);
--> statement-breakpoint
CREATE TABLE "verificationTokens" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verificationTokens_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applicant_profiles" ADD CONSTRAINT "applicant_profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "change_logs" ADD CONSTRAINT "change_logs_scholarship_id_scholarships_id_fk" FOREIGN KEY ("scholarship_id") REFERENCES "public"."scholarships"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_items" ADD CONSTRAINT "document_items_profile_id_applicant_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."applicant_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scholarship_fields" ADD CONSTRAINT "scholarship_fields_scholarship_id_scholarships_id_fk" FOREIGN KEY ("scholarship_id") REFERENCES "public"."scholarships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scholarship_fields" ADD CONSTRAINT "scholarship_fields_field_id_fields_of_study_id_fk" FOREIGN KEY ("field_id") REFERENCES "public"."fields_of_study"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scholarships" ADD CONSTRAINT "scholarships_country_id_countries_id_fk" FOREIGN KEY ("country_id") REFERENCES "public"."countries"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_users_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracked_applications" ADD CONSTRAINT "tracked_applications_profile_id_applicant_profiles_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."applicant_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tracked_applications" ADD CONSTRAINT "tracked_applications_scholarship_id_scholarships_id_fk" FOREIGN KEY ("scholarship_id") REFERENCES "public"."scholarships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "accounts_user_id_idx" ON "accounts" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "applicant_profiles_email_idx" ON "applicant_profiles" USING btree ("email");--> statement-breakpoint
CREATE INDEX "change_logs_scholarship_idx" ON "change_logs" USING btree ("scholarship_id");--> statement-breakpoint
CREATE INDEX "change_logs_changed_at_idx" ON "change_logs" USING btree ("changed_at");--> statement-breakpoint
CREATE INDEX "consent_logs_timestamp_idx" ON "consent_logs" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "consent_policies_kind_idx" ON "consent_policies" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "countries_name_idx" ON "countries" USING btree ("name");--> statement-breakpoint
CREATE INDEX "document_items_profile_idx" ON "document_items" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "fields_of_study_slug_idx" ON "fields_of_study" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "scholarship_fields_field_idx" ON "scholarship_fields" USING btree ("field_id");--> statement-breakpoint
CREATE INDEX "scholarship_country_idx" ON "scholarships" USING btree ("country_id");--> statement-breakpoint
CREATE INDEX "scholarship_status_idx" ON "scholarships" USING btree ("status");--> statement-breakpoint
CREATE INDEX "scholarship_score_idx" ON "scholarships" USING btree ("score");--> statement-breakpoint
CREATE INDEX "scholarship_deadline_idx" ON "scholarships" USING btree ("deadline_date");--> statement-breakpoint
CREATE INDEX "scholarships_search_vector_idx" ON "scholarships" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "tracked_applications_profile_scholarship_uniq" ON "tracked_applications" USING btree ("profile_id","scholarship_id");--> statement-breakpoint
CREATE INDEX "tracked_applications_scholarship_idx" ON "tracked_applications" USING btree ("scholarship_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");