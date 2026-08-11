#!/usr/bin/env node
/**
 * ScholarHub Africa — LOCAL end-to-end test of the data migration using
 * pg-mem (in-memory Postgres emulator). No network, no real database.
 *
 * Builds Django-shaped source tables with sample rows + the Drizzle target
 * tables, then runs the exact same runMigration() the production script uses
 * and asserts parity. pg-mem lacks some Postgres features (tsvector/GIN,
 * pg_get_serial_sequence) - those steps are skipped gracefully by design.
 *
 * Usage:
 *   npm run db:test:local
 */
import { DataType, newDb } from 'pg-mem';

import { runMigration, printReport } from './migrate-data.mjs';

const db = newDb();

// pg-mem implements few native functions; register what the migration uses
// that real Postgres has built-in.
db.public.registerFunction({
  name: 'btrim',
  args: [DataType.text],
  returns: DataType.text,
  implementation: (s) => (s == null ? null : String(s).trim()),
});

function setupSchema(db) {
  db.public.none(`
    -- ── Django source tables (subset of columns; extra columns prove the
    --    column-intersection copy logic) ───────────────────────────────
    CREATE TABLE scholarships_country (
      id bigint PRIMARY KEY, name varchar(100) NOT NULL,
      iso_code varchar(2) NOT NULL, flag_emoji varchar(10) DEFAULT '',
      region varchar(50) DEFAULT 'Europe'
    );
    CREATE TABLE scholarships_fieldofstudy (
      id bigint PRIMARY KEY, name varchar(100) NOT NULL,
      slug varchar(100) NOT NULL, icon varchar(50) DEFAULT ''
    );
    CREATE TABLE scholarships_scholarship (
      id bigint PRIMARY KEY, slug varchar(200) NOT NULL, name varchar(300) NOT NULL,
      short_name varchar(100) DEFAULT '', programme varchar(300) DEFAULT '',
      university varchar(300) DEFAULT '', country_id bigint NOT NULL,
      funding_type varchar(20) NOT NULL, funding_detail text DEFAULT '',
      application_fee numeric(8,2) DEFAULT 0, currency varchar(3) DEFAULT 'USD',
      eligibility_label varchar(2) DEFAULT 'PE', english_requirement text DEFAULT '',
      age_min smallint, age_max smallint, experience_years_min numeric(3,1),
      gpa_minimum numeric(4,2), nationality_notes text DEFAULT '',
      mba_impact varchar(20) DEFAULT 'none', mba_notes text DEFAULT '',
      score smallint DEFAULT 0, competitiveness varchar(50) DEFAULT '',
      deadline_date date, deadline_notes text DEFAULT '', status varchar(30) DEFAULT 'unknown',
      cycle_year smallint, notes text DEFAULT '', action_required text DEFAULT '',
      official_link varchar(500) DEFAULT '', is_verified boolean DEFAULT false,
      verified_at timestamptz, verified_source text DEFAULT '',
      is_featured boolean DEFAULT false, is_active boolean DEFAULT true,
      created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
    );
    CREATE TABLE scholarships_scholarship_fields (
      scholarship_id bigint NOT NULL, field_id bigint NOT NULL,
      PRIMARY KEY (scholarship_id, field_id)
    );
    CREATE TABLE scholarships_changelog (
      id bigint PRIMARY KEY, scholarship_id bigint, change_type varchar(50) DEFAULT 'update',
      field_changed varchar(100) DEFAULT '', old_value text DEFAULT '',
      new_value text DEFAULT '', source text DEFAULT '',
      changed_at timestamptz DEFAULT now(), changed_by varchar(100) DEFAULT 'system'
    );
    CREATE TABLE auth_user (
      id bigint PRIMARY KEY, password varchar(128) NOT NULL, last_login timestamptz,
      is_superuser boolean DEFAULT false, username varchar(150) NOT NULL,
      first_name varchar(150) DEFAULT '', last_name varchar(150) DEFAULT '',
      email varchar(254) NOT NULL, is_staff boolean DEFAULT false,
      is_active boolean DEFAULT true, date_joined timestamptz DEFAULT now()
    );
    CREATE TABLE tracker_applicantprofile (
      id bigint PRIMARY KEY, user_id bigint, email varchar(254) NOT NULL,
      full_name varchar(200) DEFAULT '', nationality varchar(100) DEFAULT '',
      degree_field varchar(200) DEFAULT '', graduation_year smallint, gpa numeric(4,2),
      experience_years numeric(3,1), has_ielts boolean DEFAULT false,
      ielts_score numeric(3,1), has_toefl boolean DEFAULT false, toefl_score smallint,
      notes text DEFAULT '', created_at timestamptz DEFAULT now()
    );
    CREATE TABLE tracker_trackedapplication (
      id bigint PRIMARY KEY, profile_id bigint NOT NULL, scholarship_id bigint NOT NULL,
      stage varchar(30) DEFAULT 'researching', priority varchar(10) DEFAULT 'target',
      notes text DEFAULT '', next_action text DEFAULT '', next_action_due date,
      sop_status varchar(20) DEFAULT 'not_started', refs_status varchar(20) DEFAULT 'not_started',
      transcript_ready boolean DEFAULT false, moi_ready boolean DEFAULT false,
      last_updated timestamptz DEFAULT now()
    );
    CREATE TABLE tracker_documentitem (
      id bigint PRIMARY KEY, profile_id bigint NOT NULL, name varchar(200) NOT NULL,
      status varchar(20) DEFAULT 'not_started', notes text DEFAULT '', due_date date,
      updated_at timestamptz DEFAULT now()
    );

    -- ── Drizzle target tables (mirror web/src/db/schema.ts, minus the
    --    generated search_vector column - pg-mem has no tsvector) ────────
    CREATE TABLE countries (
      id bigserial PRIMARY KEY, name varchar(100) NOT NULL UNIQUE,
      iso_code varchar(2) NOT NULL UNIQUE, flag_emoji varchar(10) DEFAULT '',
      region varchar(50) DEFAULT 'Europe'
    );
    CREATE TABLE fields_of_study (
      id bigserial PRIMARY KEY, name varchar(100) NOT NULL UNIQUE,
      slug varchar(100) NOT NULL UNIQUE, icon varchar(50) DEFAULT ''
    );
    CREATE TABLE scholarships (
      id bigserial PRIMARY KEY, slug varchar(200) NOT NULL UNIQUE,
      name varchar(300) NOT NULL, short_name varchar(100) DEFAULT '',
      programme varchar(300) DEFAULT '', university varchar(300) DEFAULT '',
      country_id bigint NOT NULL REFERENCES countries(id) ON DELETE RESTRICT,
      funding_type varchar(20) NOT NULL, funding_detail text DEFAULT '',
      application_fee numeric(8,2) DEFAULT 0, currency varchar(3) DEFAULT 'USD',
      eligibility_label varchar(2) DEFAULT 'PE', english_requirement text DEFAULT '',
      age_min smallint, age_max smallint, experience_years_min numeric(3,1),
      gpa_minimum numeric(4,2), nationality_notes text DEFAULT '',
      mba_impact varchar(20) DEFAULT 'none', mba_notes text DEFAULT '',
      score smallint DEFAULT 0, competitiveness varchar(50) DEFAULT '',
      deadline_date date, deadline_notes text DEFAULT '', status varchar(30) DEFAULT 'unknown',
      cycle_year smallint, notes text DEFAULT '', action_required text DEFAULT '',
      official_link varchar(500) DEFAULT '', is_verified boolean DEFAULT false,
      verified_at timestamptz, verified_source text DEFAULT '',
      is_featured boolean DEFAULT false, is_active boolean DEFAULT true,
      created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
    );
    CREATE TABLE scholarship_fields (
      scholarship_id bigint NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
      field_id bigint NOT NULL REFERENCES fields_of_study(id) ON DELETE CASCADE,
      PRIMARY KEY (scholarship_id, field_id)
    );
    CREATE TABLE change_logs (
      id bigserial PRIMARY KEY, scholarship_id bigint REFERENCES scholarships(id) ON DELETE SET NULL,
      change_type varchar(50) DEFAULT 'update', field_changed varchar(100) DEFAULT '',
      old_value text DEFAULT '', new_value text DEFAULT '', source text DEFAULT '',
      changed_at timestamptz DEFAULT now(), changed_by varchar(100) DEFAULT 'system'
    );
    CREATE TABLE users (
      id text PRIMARY KEY, name text, email text NOT NULL UNIQUE,
      "emailVerified" timestamptz, image text
    );
    CREATE TABLE applicant_profiles (
      id bigserial PRIMARY KEY, user_id text NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      email varchar(254) NOT NULL UNIQUE, full_name varchar(200) DEFAULT '',
      nationality varchar(100) DEFAULT '', degree_field varchar(200) DEFAULT '',
      graduation_year smallint, gpa numeric(4,2), experience_years numeric(3,1),
      has_ielts boolean DEFAULT false, ielts_score numeric(3,1),
      has_toefl boolean DEFAULT false, toefl_score smallint, notes text DEFAULT '',
      created_at timestamptz DEFAULT now()
    );
    CREATE TABLE tracked_applications (
      id bigserial PRIMARY KEY, profile_id bigint NOT NULL REFERENCES applicant_profiles(id) ON DELETE CASCADE,
      scholarship_id bigint NOT NULL REFERENCES scholarships(id) ON DELETE CASCADE,
      stage varchar(30) DEFAULT 'researching', priority varchar(10) DEFAULT 'target',
      notes text DEFAULT '', next_action text DEFAULT '', next_action_due date,
      sop_status varchar(20) DEFAULT 'not_started', refs_status varchar(20) DEFAULT 'not_started',
      transcript_ready boolean DEFAULT false, moi_ready boolean DEFAULT false,
      last_updated timestamptz DEFAULT now()
    );
    CREATE TABLE document_items (
      id bigserial PRIMARY KEY, profile_id bigint NOT NULL REFERENCES applicant_profiles(id) ON DELETE CASCADE,
      name varchar(200) NOT NULL, status varchar(20) DEFAULT 'not_started',
      notes text DEFAULT '', due_date date, updated_at timestamptz DEFAULT now()
    );
  `);

  db.public.none(`
    INSERT INTO scholarships_country (id, name, iso_code, flag_emoji, region) VALUES
      (1, 'Germany', 'DE', '🇩🇪', 'Europe'),
      (2, 'Sweden', 'SE', '🇸🇪', 'Europe');
    INSERT INTO scholarships_fieldofstudy (id, name, slug, icon) VALUES
      (1, 'Public Health', 'public-health', '🌍'),
      (2, 'Water Engineering', 'water', '💧');
    INSERT INTO scholarships_scholarship
      (id, slug, name, short_name, programme, university, country_id, funding_type,
       funding_detail, score, status, deadline_date, notes, is_verified, is_active, created_at, updated_at)
    VALUES
      (1, 'daad-epos', 'DAAD EPOS Scholarship', 'DAAD EPOS', 'MSc', 'Various German universities',
       1, 'full', 'Full tuition + living', 92, 'open_now', '2026-12-31',
       'Fully-funded master programmes for development-related fields.', true, true, now(), now()),
      (2, 'si-swedish-institute', 'Swedish Institute Scholarships', 'SI Scholarship',
       'MSc', 'Various Swedish universities', 2, 'full', 'Full tuition + stipend',
       88, 'open_now', '2027-01-15', 'Global professionals programme.', true, true, now(), now()),
      (3, 'old-closed', 'An old closed scholarship', 'Old', 'MA', 'Somewhere', 1,
       'partial', '', 50, 'closed', '2025-01-01', 'Closed.', false, false, now(), now());
    INSERT INTO scholarships_scholarship_fields (scholarship_id, field_id) VALUES
      (1, 1), (1, 2), (2, 1);
    INSERT INTO scholarships_changelog
      (id, scholarship_id, change_type, field_changed, old_value, new_value, changed_by)
    VALUES (1, 1, 'update', 'score', '90', '92', 'roy');
    INSERT INTO auth_user
      (id, password, username, first_name, last_name, email, is_superuser, is_staff, is_active, date_joined)
    VALUES
      (1, 'pbkdf2_sha256$x', 'roy', 'Roy', 'Okola', 'roy@scholarhub.africa', true, true, true, now()),
      -- duplicate email: must be deduped (lowest id wins)
      (2, 'pbkdf2_sha256$y', 'roy2', 'Roy', 'Okola', 'roy@scholarhub.africa', false, false, true, now());
    INSERT INTO tracker_applicantprofile
      (id, user_id, email, full_name, nationality, degree_field, graduation_year, gpa, has_ielts, ielts_score)
    VALUES (1, 1, 'roy@scholarhub.africa', 'Roy Okola', 'Kenyan', 'Public Health', 2019, 3.8, true, 7.5);
    INSERT INTO tracker_trackedapplication
      (id, profile_id, scholarship_id, stage, priority, notes, next_action, sop_status, refs_status)
    VALUES (1, 1, 1, 'drafting', 'target', 'First choice', 'Finish SOP', 'drafting', 'requested');
    INSERT INTO tracker_documentitem (id, profile_id, name, status, due_date) VALUES
      (1, 1, 'Transcript', 'ready', '2026-11-01'),
      (2, 1, 'Motivation letter', 'in_progress', '2026-11-15');
  `);
}

setupSchema(db);
const pg = db.adapters.createPg();
const client = new pg.Client();
await client.connect();

let failures = 0;
const check = (label, cond) => {
  console.log(`  ${cond ? '✓' : '✗'} ${label}`);
  if (!cond) failures += 1;
};

try {
  const result = await runMigration(client);
  printReport(result);

  console.log('\n=== Targeted assertions ===');
  const users = await client.query('SELECT id, name, email FROM users ORDER BY id');
  check('users: 1 row (duplicate email deduped)', users.rows.length === 1);
  check('users: id mapped to user_1', users.rows[0]?.id === 'user_1');
  check('users: name from first/last name', users.rows[0]?.name === 'Roy Okola');

  const profiles = await client.query('SELECT id, user_id, email FROM applicant_profiles');
  check('applicant_profiles: 1 row', profiles.rows.length === 1);
  check('applicant_profiles: user_id mapped to user_1', profiles.rows[0]?.user_id === 'user_1');

  const tracked = await client.query('SELECT id, profile_id, scholarship_id FROM tracked_applications');
  check('tracked_applications: 1 row with preserved FKs', tracked.rows.length === 1
    && tracked.rows[0].profile_id === 1 && tracked.rows[0].scholarship_id === 1);

  const documents = await client.query('SELECT count(*)::int AS n FROM document_items');
  check('document_items: 2 rows', documents.rows[0].n === 2);

  const scholarships = await client.query(
    'SELECT id, slug FROM scholarships WHERE is_active ORDER BY id');
  check(
    'scholarships: active ids preserved (1,2)',
    scholarships.rows.map((r) => Number(r.id)).join(',') === '1,2',
  );
  const allScholarships = await client.query('SELECT count(*)::int AS n FROM scholarships');
  check('scholarships: all 3 rows copied (incl. inactive)', allScholarships.rows[0].n === 3);

  const m2m = await client.query('SELECT count(*)::int AS n FROM scholarship_fields');
  check('scholarship_fields: 3 junction rows', m2m.rows[0].n === 3);

  const changelog = await client.query('SELECT scholarship_id FROM change_logs');
  check('change_logs: FK preserved', changelog.rows[0]?.scholarship_id === 1);

  // Re-run must be a no-op (target tables non-empty → skip).
  const before = await client.query('SELECT count(*)::int AS n FROM scholarships');
  await runMigration(client);
  const after = await client.query('SELECT count(*)::int AS n FROM scholarships');
  check('re-run is idempotent (no duplicates)', before.rows[0].n === after.rows[0].n);
} catch (err) {
  console.error('\n❌ Migration failed:', err.message);
  failures += 1;
} finally {
  await client.end();
}

console.log(failures === 0 ? '\n✅ LOCAL TEST PASSED' : `\n❌ LOCAL TEST FAILED (${failures})`);
process.exit(failures === 0 ? 0 : 1);
