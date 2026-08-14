/**
 * Drizzle schema (Phase 2 - docs/MIGRATION_PLAN.md §4).
 *
 * Full mapping of the Django models (apps/scholarships/models.py,
 * apps/tracker/models.py, django.contrib.auth User) plus the tables the
 * migration introduces:
 *   - scholarships.search_vector: GENERATED tsvector column mirroring
 *     apps/scholarships/search.py weights (A: name/short_name, B: programme/
 *     university, C: notes, D: funding_detail) with a GIN index.
 *   - users/accounts/sessions/verificationTokens: Auth.js adapter schema
 *     (Phase 5, M0 decision #2 - multi-user).
 *   - applicant_profiles.user_id: NOT NULL UNIQUE (multi-user, decision #5).
 *   - consent_logs / consent_config / consent_policies: replaces the
 *     consent-manager JSONL file store (Vercel FS is ephemeral).
 *
 * Naming: snake_case columns matching the Django columns 1:1 so the Phase 2
 * data-migration script is a straightforward copy with FK re-pointing.
 */
import { relations, sql } from 'drizzle-orm';
import {
  bigint,
  bigserial,
  boolean,
  customType,
  date,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

import type { CategoryState } from '../lib/consent/types';

/* ── PostgreSQL tsvector (used by the search GIN index) ─────────────────── */

const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

/* ── Reference data ─────────────────────────────────────────────────────── */

export const countries = pgTable(
  'countries',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    isoCode: varchar('iso_code', { length: 2 }).notNull().unique(),
    flagEmoji: varchar('flag_emoji', { length: 10 }).notNull().default(''),
    region: varchar('region', { length: 50 }).notNull().default('Europe'),
  },
  (t) => [index('countries_name_idx').on(t.name)],
);

export const fieldsOfStudy = pgTable(
  'fields_of_study',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    name: varchar('name', { length: 100 }).notNull().unique(),
    slug: varchar('slug', { length: 100 }).notNull().unique(),
    icon: varchar('icon', { length: 50 }).notNull().default(''),
  },
  (t) => [index('fields_of_study_slug_idx').on(t.slug)],
);

/* ── Scholarships (Django apps/scholarships/models.py) ──────────────────── */

export const scholarships = pgTable(
  'scholarships',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    slug: varchar('slug', { length: 200 }).notNull().unique(),
    name: varchar('name', { length: 300 }).notNull(),
    shortName: varchar('short_name', { length: 100 }).notNull().default(''),
    programme: varchar('programme', { length: 300 }).notNull().default(''),
    university: varchar('university', { length: 300 }).notNull().default(''),
    countryId: bigint('country_id', { mode: 'number' })
      .notNull()
      .references(() => countries.id, { onDelete: 'restrict' }),

    // Funding
    fundingType: varchar('funding_type', { length: 20 }).notNull(),
    fundingDetail: text('funding_detail').notNull().default(''),
    applicationFee: numeric('application_fee', { precision: 8, scale: 2 })
      .notNull()
      .default('0'),
    currency: varchar('currency', { length: 3 }).notNull().default('USD'),

    // Eligibility
    eligibilityLabel: varchar('eligibility_label', { length: 2 })
      .notNull()
      .default('PE'),
    englishRequirement: text('english_requirement').notNull().default(''),
    ageMin: smallint('age_min'),
    ageMax: smallint('age_max'),
    experienceYearsMin: numeric('experience_years_min', { precision: 3, scale: 1 }),
    gpaMinimum: numeric('gpa_minimum', { precision: 4, scale: 2 }),
    nationalityNotes: text('nationality_notes').notNull().default(''),
    mbaImpact: varchar('mba_impact', { length: 20 }).notNull().default('none'),
    mbaNotes: text('mba_notes').notNull().default(''),

    // Scoring
    score: smallint('score').notNull().default(0),
    competitiveness: text('competitiveness').notNull().default(''),

    // Deadlines & status
    deadlineDate: date('deadline_date'),
    deadlineNotes: text('deadline_notes').notNull().default(''),
    status: varchar('status', { length: 30 }).notNull().default('unknown'),
    cycleYear: smallint('cycle_year'),

    // Content
    notes: text('notes').notNull().default(''),
    actionRequired: text('action_required').notNull().default(''),
    officialLink: varchar('official_link', { length: 500 }).notNull().default(''),

    // Metadata
    isVerified: boolean('is_verified').notNull().default(false),
    verifiedAt: timestamp('verified_at', { withTimezone: true }),
    verifiedSource: text('verified_source').notNull().default(''),
    isFeatured: boolean('is_featured').notNull().default(false),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),

    /**
     * Generated full-text search vector - port of the Django SearchVector
     * (apps/scholarships/search.py) with the same A-D weights, so Phase 3
     * search queries can rank with ts_rank(search_vector, query).
     */
    searchVector: tsvector('search_vector').generatedAlwaysAs(
      sql`setweight(to_tsvector('english', coalesce("name", '')), 'A') ||
          setweight(to_tsvector('english', coalesce("short_name", '')), 'A') ||
          setweight(to_tsvector('english', coalesce("programme", '')), 'B') ||
          setweight(to_tsvector('english', coalesce("university", '')), 'B') ||
          setweight(to_tsvector('english', coalesce("notes", '')), 'C') ||
          setweight(to_tsvector('english', coalesce("funding_detail", '')), 'D')`,
    ),
  },
  (t) => [
    index('scholarship_country_idx').on(t.countryId),
    index('scholarship_status_idx').on(t.status),
    index('scholarship_score_idx').on(t.score),
    index('scholarship_deadline_idx').on(t.deadlineDate),
    index('scholarships_search_vector_idx').using('gin', t.searchVector),
  ],
);

/** M2M junction - Django Scholarship.fields ManyToManyField. */
export const scholarshipFields = pgTable(
  'scholarship_fields',
  {
    scholarshipId: bigint('scholarship_id', { mode: 'number' })
      .notNull()
      .references(() => scholarships.id, { onDelete: 'cascade' }),
    fieldId: bigint('field_id', { mode: 'number' })
      .notNull()
      .references(() => fieldsOfStudy.id, { onDelete: 'cascade' }),
  },
  (t) => [
    primaryKey({ columns: [t.scholarshipId, t.fieldId] }),
    index('scholarship_fields_field_idx').on(t.fieldId),
  ],
);

/** Audit trail of edits - Django ChangeLog. */
export const changeLogs = pgTable(
  'change_logs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    scholarshipId: bigint('scholarship_id', { mode: 'number' }).references(() => scholarships.id, {
      onDelete: 'set null',
    }),
    changeType: varchar('change_type', { length: 50 }).notNull().default('update'),
    fieldChanged: varchar('field_changed', { length: 100 }).notNull().default(''),
    oldValue: text('old_value').notNull().default(''),
    newValue: text('new_value').notNull().default(''),
    source: text('source').notNull().default(''),
    changedAt: timestamp('changed_at', { withTimezone: true }).notNull().defaultNow(),
    changedBy: varchar('changed_by', { length: 100 }).notNull().default('system'),
  },
  (t) => [
    index('change_logs_scholarship_idx').on(t.scholarshipId),
    index('change_logs_changed_at_idx').on(t.changedAt),
  ],
);

/* ── Auth.js adapter tables (Phase 5 - M0 decision #2) ──────────────────── */

export const users = pgTable(
  'users',
  {
    /** Text id (Auth.js default) - the Phase 2 migration copies Django's
     *  auth_user.id here so applicant_profiles.user_id keeps its identity. */
    id: text('id').primaryKey(),
    name: text('name'),
    email: text('email').notNull(),
    emailVerified: timestamp('emailVerified', { mode: 'date' }),
    image: text('image'),
    /** bcrypt hash for the Credentials provider (registration, Phase 5).
     *  Null for OAuth-only users. */
    passwordHash: text('password'),
  },
  (t) => [uniqueIndex('users_email_idx').on(t.email)],
);

export const accounts = pgTable(
  'accounts',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refreshToken: text('refresh_token'),
    accessToken: text('access_token'),
    expiresAt: integer('expires_at'),
    tokenType: text('token_type'),
    scope: text('scope'),
    idToken: text('id_token'),
    sessionState: text('session_state'),
  },
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index('accounts_user_id_idx').on(t.userId),
  ],
);

export const sessions = pgTable(
  'sessions',
  {
    sessionToken: text('sessionToken').primaryKey(),
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (t) => [index('sessions_user_id_idx').on(t.userId)],
);

export const verificationTokens = pgTable(
  'verificationTokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

export const passwordResetTokens = pgTable(
  'passwordResetTokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { mode: 'date' }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

/* ── Tracker (Django apps/tracker/models.py) ────────────────────────────── */

export const applicantProfiles = pgTable(
  'applicant_profiles',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    /** Multi-user (M0 decision #5): required unique FK, not nullable like
     *  Django's (Django allowed an anonymous demo profile). */
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 254 }).notNull().unique(),
    fullName: varchar('full_name', { length: 200 }).notNull().default(''),
    nationality: varchar('nationality', { length: 100 }).notNull().default(''),
    degreeField: varchar('degree_field', { length: 200 }).notNull().default(''),
    graduationYear: smallint('graduation_year'),
    gpa: numeric('gpa', { precision: 4, scale: 2 }),
    experienceYears: numeric('experience_years', { precision: 3, scale: 1 }),
    hasIelts: boolean('has_ielts').notNull().default(false),
    ieltsScore: numeric('ielts_score', { precision: 3, scale: 1 }),
    hasToefl: boolean('has_toefl').notNull().default(false),
    toeflScore: smallint('toefl_score'),
    notes: text('notes').notNull().default(''),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('applicant_profiles_email_idx').on(t.email)],
);

export const trackedApplications = pgTable(
  'tracked_applications',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    profileId: bigint('profile_id', { mode: 'number' })
      .notNull()
      .references(() => applicantProfiles.id, { onDelete: 'cascade' }),
    scholarshipId: bigint('scholarship_id', { mode: 'number' })
      .notNull()
      .references(() => scholarships.id, { onDelete: 'cascade' }),
    stage: varchar('stage', { length: 30 }).notNull().default('researching'),
    priority: varchar('priority', { length: 10 }).notNull().default('target'),
    notes: text('notes').notNull().default(''),
    nextAction: text('next_action').notNull().default(''),
    nextActionDue: date('next_action_due'),
    sopStatus: varchar('sop_status', { length: 20 }).notNull().default('not_started'),
    refsStatus: varchar('refs_status', { length: 20 }).notNull().default('not_started'),
    transcriptReady: boolean('transcript_ready').notNull().default(false),
    moiReady: boolean('moi_ready').notNull().default(false),
    lastUpdated: timestamp('last_updated', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex('tracked_applications_profile_scholarship_uniq').on(
      t.profileId,
      t.scholarshipId,
    ),
    index('tracked_applications_scholarship_idx').on(t.scholarshipId),
  ],
);

export const documentItems = pgTable(
  'document_items',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    profileId: bigint('profile_id', { mode: 'number' })
      .notNull()
      .references(() => applicantProfiles.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 200 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('not_started'),
    notes: text('notes').notNull().default(''),
    dueDate: date('due_date'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('document_items_profile_idx').on(t.profileId)],
);

/* ── Consent (replaces consent-manager JSONL file store) ────────────────── */

export const consentLogs = pgTable(
  'consent_logs',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    anonymizedIp: varchar('anonymized_ip', { length: 200 }).notNull().default(''),
    timestamp: timestamp('timestamp', { withTimezone: true }).notNull().defaultNow(),
    country: varchar('country', { length: 10 }).notNull().default(''),
    region: varchar('region', { length: 10 }).notNull().default('none'),
    consentString: text('consent_string').notNull().default(''),
    tcfString: text('tcf_string').notNull().default(''),
    categories: jsonb('categories').$type<CategoryState>().notNull(),
    accepted: boolean('accepted').notNull().default(false),
    version: integer('version').notNull().default(1),
    language: varchar('language', { length: 10 }).notNull().default('en'),
  },
  (t) => [index('consent_logs_timestamp_idx').on(t.timestamp)],
);

export const consentConfig = pgTable('consent_config', {
  key: text('key').primaryKey(),
  config: jsonb('config').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const consentPolicies = pgTable(
  'consent_policies',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    kind: varchar('kind', { length: 50 }).notNull().unique(),
    content: text('content').notNull().default(''),
    version: integer('version').notNull().default(1),
    publishedAt: timestamp('published_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('consent_policies_kind_idx').on(t.kind)],
);

/* ── Newsletter subscribers ──────────────────────────────────────────────── */

export const newsletterSubscribers = pgTable(
  'newsletter_subscribers',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    email: varchar('email', { length: 254 }).notNull().unique(),
    name: varchar('name', { length: 200 }).notNull().default(''),
    source: varchar('source', { length: 50 }).notNull().default('footer'),
    confirmed: boolean('confirmed').notNull().default(false),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('newsletter_subscribers_email_idx').on(t.email)],
);

/* 📄 CSV Uploads */

export const csvUploads = pgTable(
  'csv_uploads',
  {
    id: bigserial('id', { mode: 'number' }).primaryKey(),
    filename: text('filename').notNull(),
    rows: jsonb('rows').notNull(),
    status: varchar('status', { length: 50 }).notNull().default('processing'),
    totalProcessed: integer('total_processed').notNull().default(0),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow(),
  }
);

/* 🔗 Relations (used by Phase 3 query layer) 🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗 */

export const scholarshipsRelations = relations(scholarships, ({ many, one }) => ({
  country: one(countries, {
    fields: [scholarships.countryId],
    references: [countries.id],
  }),
  fields: many(scholarshipFields),
  trackedBy: many(trackedApplications),
}));

export const scholarshipFieldsRelations = relations(scholarshipFields, ({ one }) => ({
  scholarship: one(scholarships, {
    fields: [scholarshipFields.scholarshipId],
    references: [scholarships.id],
  }),
  field: one(fieldsOfStudy, {
    fields: [scholarshipFields.fieldId],
    references: [fieldsOfStudy.id],
  }),
}));

export const applicantProfilesRelations = relations(applicantProfiles, ({ many, one }) => ({
  user: one(users, { fields: [applicantProfiles.userId], references: [users.id] }),
  applications: many(trackedApplications),
  documents: many(documentItems),
}));

export const trackedApplicationsRelations = relations(trackedApplications, ({ one }) => ({
  profile: one(applicantProfiles, {
    fields: [trackedApplications.profileId],
    references: [applicantProfiles.id],
  }),
  scholarship: one(scholarships, {
    fields: [trackedApplications.scholarshipId],
    references: [scholarships.id],
  }),
}));
