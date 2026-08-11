#!/usr/bin/env node
/**
 * ScholarHub Africa — Django → Drizzle data migration (MIGRATION_PLAN.md §4, M2).
 *
 * Copies every row from the live Django tables into the new Drizzle tables
 * (created by `npm run db:migrate`) while PRESERVING primary keys, so the
 * foreign keys map 1:1 with zero translation except:
 *   - auth_user.id            → users.id        as `user_<id>` (Auth.js text PK)
 *   - applicant_profiles.user_id → `user_<id>`  (multi-user required FK)
 *   - duplicate auth_user emails are deduped (users.email is UNIQUE)
 *
 * Safety properties:
 *   - READ-ONLY over Django tables: no DELETE/UPDATE/DROP touches them.
 *   - Per-table skip when the target already has rows (resume-safe).
 *   - Aborts BEFORE copying if a source table is missing or a profile has no
 *     user_id (can't be mapped to the multi-user schema).
 *   - Runs inside one transaction; on error nothing is persisted.
 *   - Verifies parity (counts, FK orphans, search vector) before committing.
 *
 * Usage:
 *   DATABASE_URL=postgresql://... npm run db:migrate:data
 * (falls back to web/.env.local when DATABASE_URL is not set)
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ── Table pairs: Django source → Drizzle target ────────────────────────── */
const COPIES = [
  { source: 'scholarships_country', target: 'countries', label: 'Country' },
  { source: 'scholarships_fieldofstudy', target: 'fields_of_study', label: 'FieldOfStudy' },
  {
    source: 'scholarships_scholarship',
    target: 'scholarships',
    label: 'Scholarship',
    exclude: ['search_vector'], // GENERATED ALWAYS column - never insert into it
  },
  { source: 'scholarships_scholarship_fields', target: 'scholarship_fields', label: 'Scholarship.fields (M2M)' },
  { source: 'scholarships_changelog', target: 'change_logs', label: 'ChangeLog' },
  { source: 'auth_user', target: 'users', label: 'auth.User', special: 'users' },
  { source: 'tracker_applicantprofile', target: 'applicant_profiles', label: 'ApplicantProfile', special: 'profiles' },
  { source: 'tracker_trackedapplication', target: 'tracked_applications', label: 'TrackedApplication' },
  { source: 'tracker_documentitem', target: 'document_items', label: 'DocumentItem' },
];

/** Tables with a bigserial `id` that need their sequence advanced after the copy. */
const SEQUENCE_TABLES = [
  'countries', 'fields_of_study', 'scholarships', 'change_logs',
  'applicant_profiles', 'tracked_applications', 'document_items',
  'consent_logs', 'consent_policies',
];

const q = (ident) => `"${String(ident).replaceAll('"', '""')}"`;

/* ── Connection helpers ─────────────────────────────────────────────────── */

/** Drop params that trip up drivers (channel_binding etc.), keep sslmode. */
export function normalizeUrl(url) {
  const u = new URL(url);
  const keep = new Set(['sslmode', 'uselibpqcompat']);
  for (const key of [...u.searchParams.keys()]) {
    if (!keep.has(key)) u.searchParams.delete(key);
  }
  if (u.searchParams.get('sslmode') === 'require') {
    // Newer node-postgres treats require as verify-full already; be explicit.
    u.searchParams.set('sslmode', 'verify-full');
  }
  return u.toString();
}

/** Read DATABASE_URL from the environment or web/.env.local. */
export function loadDbUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  for (const candidate of [
    path.join(__dirname, '..', '.env.local'),
    path.join(__dirname, '..', '..', '.env.local'),
  ]) {
    if (!existsSync(candidate)) continue;
    for (const line of readFileSync(candidate, 'utf8').split('\n')) {
      const m = line.match(/^\s*DATABASE_URL\s*=\s*(.+?)\s*$/);
      if (m) return m[1];
    }
  }
  return null;
}

/** Connect with certificate verification; retry insecure (warning) if blocked. */
export async function connect(url) {
  const errors = [];
  for (const ssl of [{ rejectUnauthorized: true }, { rejectUnauthorized: false }]) {
    const pool = new pg.Pool({
      connectionString: normalizeUrl(url),
      ssl,
      max: 1,
      connectionTimeoutMillis: 20000,
    });
    try {
      await pool.query('SELECT 1');
      const server = await pool.query('SELECT version()');
      return {
        pool,
        sslVerified: ssl.rejectUnauthorized,
        server: server.rows[0].version,
      };
    } catch (err) {
      errors.push(`${ssl.rejectUnauthorized ? 'verify' : 'insecure'}: ${err.message}`);
      await pool.end().catch(() => {});
    }
  }
  throw new Error(`Could not connect to the database:\n  ${errors.join('\n  ')}`);
}

/* ── Preflight ──────────────────────────────────────────────────────────── */

export async function tableExists(client, name) {
  const r = await client.query(
    `SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=$1`,
    [name],
  );
  return r.rows.length > 0;
}

export async function preflight(client) {
  const missingSources = [];
  for (const c of COPIES) {
    if (!(await tableExists(client, c.source))) missingSources.push(c.source);
  }
  if (missingSources.length) {
    throw new Error(
      `Django source tables missing (${missingSources.join(', ')}). ` +
        'Expected app tables: scholarships_*, tracker_*, auth_user. ' +
        'If your Django app uses different table names, adjust COPIES in this script.',
    );
  }
  const missingTargets = [];
  for (const c of COPIES) {
    if (!(await tableExists(client, c.target))) missingTargets.push(c.target);
  }
  if (missingTargets.length) {
    throw new Error(
      `New Drizzle tables missing (${missingTargets.join(', ')}). ` +
        'Run `npm run db:migrate` (drizzle-kit migrate) first.',
    );
  }

  // Multi-user safety gate: profiles without a user cannot be mapped.
  const orphanProfiles = await client.query(
    `SELECT count(*)::int AS n FROM tracker_applicantprofile WHERE user_id IS NULL`,
  );
  if (orphanProfiles.rows[0].n > 0) {
    throw new Error(
      `${orphanProfiles.rows[0].n} applicant profile(s) have no user_id. ` +
        'The new schema requires a user per profile (multi-user). ' +
        'Assign a user to these profiles in Django before migrating.',
    );
  }

  const dupEmails = await client.query(
    `SELECT email, n FROM (
       SELECT email, count(*)::int AS n FROM auth_user GROUP BY email
     ) t WHERE n > 1 ORDER BY n DESC`,
  );
  if (dupEmails.rows.length) {
    console.warn(
      `⚠ Duplicate auth_user emails will be deduped (keep lowest id): ` +
        dupEmails.rows.map((r) => `"${r.email}" x${r.n}`).join(', '),
    );
  }
  return { missingSources, missingTargets };
}

/* ── Copy helpers ───────────────────────────────────────────────────────── */

/** Column names present in BOTH source and target, in source order. */
export async function sharedColumns(client, source, target, exclude = []) {
  const src = await client.query(
    `SELECT column_name FROM information_schema.columns
      WHERE table_schema='public' AND table_name=$1 ORDER BY ordinal_position`,
    [source],
  );
  const tgt = new Set(
    (
      await client.query(
        `SELECT column_name FROM information_schema.columns
          WHERE table_schema='public' AND table_name=$1`,
        [target],
      )
    ).rows.map((r) => r.column_name),
  );
  return src.rows
    .map((r) => r.column_name)
    .filter((c) => tgt.has(c) && !exclude.includes(c));
}

async function targetRowCount(client, target) {
  const r = await client.query(`SELECT count(*)::int AS n FROM ${q(target)}`);
  return r.rows[0].n;
}

async function copyGeneric(client, copy) {
  const existing = await targetRowCount(client, copy.target);
  if (existing > 0) {
    console.log(`  · ${copy.label.padEnd(28)} already has ${existing} rows — skip`);
    return { copied: 0, skipped: true };
  }
  const cols = await sharedColumns(client, copy.source, copy.target, copy.exclude ?? []);
  if (!cols.length) throw new Error(`No shared columns between ${copy.source} and ${copy.target}`);
  const sql = `INSERT INTO ${q(copy.target)} (${cols.map(q).join(', ')})
               SELECT ${cols.map(q).join(', ')} FROM ${q(copy.source)}`;
  const res = await client.query(sql);
  console.log(`  · ${copy.label.padEnd(28)} copied ${res.rowCount} rows`);
  return { copied: res.rowCount ?? 0, skipped: false };
}

async function copyUsers(client) {
  const existing = await targetRowCount(client, 'users');
  if (existing > 0) {
    console.log(`  · auth.User (users)            already has ${existing} rows — skip`);
    return { copied: 0, skipped: true };
  }
  const res = await client.query(
    `INSERT INTO "users" ("id", "name", "email", "emailVerified", "image")
     SELECT
       'user_' || id::text,
       CASE WHEN btrim(first_name || ' ' || last_name) <> ''
            THEN btrim(first_name || ' ' || last_name)
            ELSE username END,
       COALESCE(email, ''),
       NULL,
       NULL
     FROM (SELECT DISTINCT ON (email) * FROM "auth_user" ORDER BY email, id) u`,
  );
  console.log(`  · auth.User (users)            copied ${res.rowCount} rows`);
  return { copied: res.rowCount ?? 0, skipped: false };
}

async function copyProfiles(client) {
  const existing = await targetRowCount(client, 'applicant_profiles');
  if (existing > 0) {
    console.log(`  · ApplicantProfile             already has ${existing} rows — skip`);
    return { copied: 0, skipped: true };
  }
  const res = await client.query(
    `INSERT INTO "applicant_profiles"
       ("id", "user_id", "email", "full_name", "nationality", "degree_field",
        "graduation_year", "gpa", "experience_years", "has_ielts", "ielts_score",
        "has_toefl", "toefl_score", "notes", "created_at")
     SELECT
       id, 'user_' || user_id::text, email, full_name, nationality, degree_field,
       graduation_year, gpa, experience_years, has_ielts, ielts_score,
       has_toefl, toefl_score, notes, created_at
     FROM "tracker_applicantprofile"`,
  );
  console.log(`  · ApplicantProfile             copied ${res.rowCount} rows`);
  return { copied: res.rowCount ?? 0, skipped: false };
}

/** Advance every bigserial sequence past the copied ids. */
export async function fixSequences(client) {
  for (const table of SEQUENCE_TABLES) {
    try {
      await client.query(
        `SELECT setval(
           pg_get_serial_sequence(format('public.%I', $1), 'id')::regclass,
           GREATEST((SELECT COALESCE(MAX(id), 1) FROM ${q(table)}), 1),
           true
         )`,
        [table],
      );
    } catch (err) {
      console.warn(`  ⚠ sequence fix skipped for ${table}: ${err.message}`);
    }
  }
}

/* ── Verification ───────────────────────────────────────────────────────── */

export async function runVerification(client) {
  const report = [];
  let ok = true;

  for (const c of COPIES) {
    const tgt = await client.query(`SELECT count(*)::int AS n FROM ${q(c.target)}`);
    let expected;
    if (c.special === 'users') {
      // Duplicate emails are deduped (kept lowest id) - expect distinct emails.
      expected = await client.query(
        `SELECT count(DISTINCT email)::int AS n FROM ${q(c.source)}`,
      );
    } else {
      expected = await client.query(`SELECT count(*)::int AS n FROM ${q(c.source)}`);
    }
    const match = expected.rows[0].n === tgt.rows[0].n;
    if (!match) ok = false;
    report.push({
      table: c.target,
      source: expected.rows[0].n,
      target: tgt.rows[0].n,
      match,
    });
  }

  const orphanChecks = [
    ['tracked_applications → scholarships', `SELECT count(*)::int AS n FROM tracked_applications t LEFT JOIN scholarships s ON s.id = t.scholarship_id WHERE s.id IS NULL`],
    ['tracked_applications → applicant_profiles', `SELECT count(*)::int AS n FROM tracked_applications t LEFT JOIN applicant_profiles p ON p.id = t.profile_id WHERE p.id IS NULL`],
    ['applicant_profiles → users', `SELECT count(*)::int AS n FROM applicant_profiles p LEFT JOIN users u ON u.id = p.user_id WHERE u.id IS NULL`],
    ['scholarship_fields → scholarships', `SELECT count(*)::int AS n FROM scholarship_fields f LEFT JOIN scholarships s ON s.id = f.scholarship_id WHERE s.id IS NULL`],
    ['scholarship_fields → fields_of_study', `SELECT count(*)::int AS n FROM scholarship_fields f LEFT JOIN fields_of_study fo ON fo.id = f.field_id WHERE fo.id IS NULL`],
    ['change_logs → scholarships', `SELECT count(*)::int AS n FROM change_logs c LEFT JOIN scholarships s ON s.id = c.scholarship_id WHERE s.id IS NULL`],
  ];
  for (const [label, sql] of orphanChecks) {
    const r = await client.query(sql);
    const bad = r.rows[0].n > 0;
    if (bad) ok = false;
    report.push({ table: label, orphans: r.rows[0].n, match: !bad });
  }

  // Full-text search smoke test (skipped gracefully on drivers without FTS).
  let fts = null;
  try {
    for (const term of ['DAAD', 'scholarship', 'Germany']) {
      const r = await client.query(
        `SELECT count(*)::int AS n FROM scholarships
          WHERE search_vector @@ websearch_to_tsquery('english', $1)`,
        [term],
      );
      fts = { ...(fts ?? {}), [term]: r.rows[0].n };
    }
  } catch {
    fts = 'skipped (FTS unavailable)';
  }

  return { report, fts, ok };
}

export function printReport({ report, fts, ok }) {
  console.log('\n=== Parity report ===');
  for (const row of report) {
    if ('source' in row) {
      const flag = row.match ? '✓' : '✗';
      console.log(
        `  ${flag} ${row.table.padEnd(34)} django=${row.source}  drizzle=${row.target}`,
      );
    } else {
      const flag = row.match ? '✓' : '✗';
      console.log(`  ${flag} ${row.table.padEnd(34)} orphans=${row.orphans}`);
    }
  }
  if (fts && fts !== 'skipped (FTS unavailable)') {
    console.log(`  ✓ full-text search hits: ${JSON.stringify(fts)}`);
  } else if (fts) {
    console.log(`  - ${fts}`);
  }
  console.log(ok ? '\n✅ Parity OK' : '\n❌ Parity MISMATCH');
  return ok;
}

/* ── Orchestration ──────────────────────────────────────────────────────── */

export async function runMigration(client) {
  console.log('Preflight…');
  await preflight(client);

  console.log('Copying data (single transaction)…');
  await client.query('BEGIN');
  try {
    for (const copy of COPIES) {
      if (copy.special === 'users') await copyUsers(client);
      else if (copy.special === 'profiles') await copyProfiles(client);
      else await copyGeneric(client, copy);
    }
    await fixSequences(client);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  }

  console.log('Verifying…');
  const result = await runVerification(client);
  if (!result.ok) {
    await client.query('ROLLBACK');
    const err = new Error(
      'Parity verification failed - transaction rolled back; nothing persisted.',
    );
    err.report = result;
    throw err;
  }
  await client.query('COMMIT');
  return result;
}

/* ── CLI ────────────────────────────────────────────────────────────────── */

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  const url = loadDbUrl();
  if (!url) {
    console.error('DATABASE_URL not set. Add it to web/.env.local (Neon POOLED connection string) or export it.');
    process.exit(1);
  }
  const { pool, sslVerified, server } = await connect(url);
  console.log(`Connected: ${server}`);
  if (!sslVerified) {
    console.warn('⚠ Connected WITHOUT TLS certificate verification (check your network/CA).');
  }
  try {
    const client = await pool.connect();
    try {
      const result = await runMigration(client);
      printReport(result);
      process.exit(result.ok ? 0 : 1);
    } catch (err) {
      if (err.report) printReport(err.report);
      console.error(`\n❌ ${err.message}`);
      process.exit(1);
    } finally {
      client.release();
    }
  } finally {
    await pool.end();
  }
}
