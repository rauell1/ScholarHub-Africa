/**
 * ScholarHub Africa — LOCAL end-to-end test of the M3 query layer using
 * pg-mem (in-memory Postgres emulator) + drizzle-orm/node-postgres.
 *
 * Runs the REAL query functions from src/lib/queries.ts against a seeded
 * in-memory database and asserts filter/search-adjacent behaviour:
 *   - visibility (is_active), default ordering (-score)
 *   - every ScholarshipFilter condition (country/field/funding/eligibility/
 *     status/min_score/is_open/deadline window/ordering)
 *   - serialization parity (country object, fields slugs, days_until_deadline)
 *   - facets (countries/fields counts), home stats, open_now, related
 *   - filter parsing (Zod) incl. 400-grade validation failures
 *
 * Full-text search itself (tsvector/ts_rank) is not available in pg-mem -
 * that path is exercised on real Postgres via `npm run db:verify`.
 *
 * Usage:
 *   npm run db:test:queries
 */
import { newDb } from 'pg-mem';
import { drizzle } from 'drizzle-orm/node-postgres';
import type { Pool as PgPool } from 'pg';

import * as schema from '../src/db/schema';
import { addDays, eatToday, daysBetween } from '../src/lib/dates';
import type { Db } from '../src/lib/db';
import { parseScholarshipFilters } from '../src/lib/filters';
import {
  countScholarships,
  getChangeLogs,
  getCountries,
  getCountriesByRegion,
  getFields,
  getHomeStats,
  getOpenNow,
  getRelatedScholarships,
  getScholarshipBySlug,
  getSitemapScholarships,
  queryScholarshipCards,
  queryScholarships,
} from '../src/lib/queries';

async function main() {
/* ── In-memory database ─────────────────────────────────────────────────── */

const mem = newDb();
const memPg = mem.adapters.createPg() as {
  Pool: { new (...a: unknown[]): PgPool; prototype: PgPool };
};
// pg-mem rejects query configs carrying pg's `types` object or `rowMode:
// 'array'` (both of which drizzle's node-postgres driver always attaches).
// Strip them before pg-mem, then convert results back to array-mode rows
// (positional values + fields) so drizzle's mapper works unchanged.
// String-style queries (text, values) pass through untouched.
const origQuery = memPg.Pool.prototype.query.bind(
  memPg.Pool.prototype,
) as (...args: unknown[]) => unknown;

function toArrayRows(result: unknown): unknown {
  const res = result as { rows: Record<string, unknown>[] };
  const rows = res.rows ?? [];
  // pg-mem returns rows as keyed objects and an EMPTY fields list, while
  // drizzle's mapper reads rows positionally - derive the column order from
  // the row keys (consistent within one result set).
  const names = rows.length > 0 ? Object.keys(rows[0]) : [];
  return {
    ...res,
    rows: rows.map((row) => names.map((name) => row[name])),
  };
}

memPg.Pool.prototype.query = function (
  this: PgPool,
  config: unknown,
  values?: unknown,
  cb?: unknown,
) {
  // String-style: text [, values] [, callback] - no rewriting needed.
  if (typeof config === 'string') {
    return origQuery(config, values, cb);
  }

  const cfg =
    config && typeof config === 'object'
      ? { ...(config as Record<string, unknown>), types: undefined, rowMode: undefined }
      : config;

  if (typeof cb === 'function') {
    origQuery(cfg, values, (err: unknown, result: unknown) => {
      if (err) return (cb as (e: unknown, r?: unknown) => void)(err);
      (cb as (e: unknown, r?: unknown) => void)(null, toArrayRows(result));
    });
    return;
  }
  return Promise.resolve(origQuery(cfg, values)).then(toArrayRows);
} as unknown as typeof memPg.Pool.prototype.query;

const pool = new memPg.Pool() as unknown as PgPool;
const client = drizzle(pool, { schema }) as unknown as Db;

// Deadlines relative to today (EAT) so the suite passes any day.
const in90 = addDays(eatToday(), 90);
const in140 = addDays(eatToday(), 140);
const in30 = addDays(eatToday(), 30);
const past = addDays(eatToday(), -200);

await pool.query(`
  CREATE TABLE countries (
    id serial PRIMARY KEY, name varchar(100) NOT NULL UNIQUE,
    iso_code varchar(2) NOT NULL UNIQUE, flag_emoji varchar(10) DEFAULT '',
    region varchar(50) DEFAULT 'Europe'
  );
  CREATE TABLE fields_of_study (
    id serial PRIMARY KEY, name varchar(100) NOT NULL UNIQUE,
    slug varchar(100) NOT NULL UNIQUE, icon varchar(50) DEFAULT ''
  );
  CREATE TABLE scholarships (
    id serial PRIMARY KEY, slug varchar(200) NOT NULL UNIQUE,
    name varchar(300) NOT NULL, short_name varchar(100) DEFAULT '',
    programme varchar(300) DEFAULT '', university varchar(300) DEFAULT '',
    country_id bigint NOT NULL, funding_type varchar(20) NOT NULL,
    funding_detail text DEFAULT '', application_fee numeric(8,2) DEFAULT 0,
    currency varchar(3) DEFAULT 'USD', eligibility_label varchar(2) DEFAULT 'PE',
    english_requirement text DEFAULT '', age_min smallint, age_max smallint,
    experience_years_min numeric(3,1), gpa_minimum numeric(4,2),
    nationality_notes text DEFAULT '', mba_impact varchar(20) DEFAULT 'none',
    mba_notes text DEFAULT '', score smallint DEFAULT 0,
    competitiveness varchar(50) DEFAULT '', deadline_date date,
    deadline_notes text DEFAULT '', status varchar(30) DEFAULT 'unknown',
    cycle_year smallint, notes text DEFAULT '', action_required text DEFAULT '',
    official_link varchar(500) DEFAULT '', is_verified boolean DEFAULT false,
    verified_at timestamptz, verified_source text DEFAULT '',
    is_featured boolean DEFAULT false, is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
  );
  CREATE TABLE scholarship_fields (
    scholarship_id bigint NOT NULL, field_id bigint NOT NULL,
    PRIMARY KEY (scholarship_id, field_id)
  );
  CREATE TABLE change_logs (
    id serial PRIMARY KEY, scholarship_id bigint NOT NULL,
    change_type varchar(50) DEFAULT 'update', field_changed varchar(100) DEFAULT '',
    old_value text DEFAULT '', new_value text DEFAULT '', source text DEFAULT '',
    changed_at timestamptz DEFAULT now(), changed_by varchar(100) DEFAULT 'system'
  );
`);

await pool.query(
  `INSERT INTO countries (id, name, iso_code, flag_emoji, region) VALUES
     (1, 'Germany', 'DE', '🇩🇪', 'Europe'),
     (2, 'Sweden', 'SE', '🇸🇪', 'Europe'),
     (3, 'Kenya', 'KE', '🇰🇪', 'Africa');
   INSERT INTO fields_of_study (id, name, slug, icon) VALUES
     (1, 'Public Health', 'public-health', '🌍'),
     (2, 'Water Engineering', 'water', '💧');
   INSERT INTO scholarships
     (id, slug, name, short_name, programme, university, country_id, funding_type,
      funding_detail, application_fee, currency, eligibility_label, score,
      deadline_date, status, notes, official_link, is_verified, is_featured, is_active)
   VALUES
     (1, 'daad-epos', 'DAAD EPOS Scholarship', 'DAAD EPOS', 'MSc', 'Universities in Germany',
      1, 'full', 'Full tuition + living', 0, 'EUR', 'CE', 92, $1, 'open_now',
      'Development-related masters.', 'https://www.daad.de', true, true, true),
     (2, 'si-scholarship', 'Swedish Institute Scholarship', 'SI', 'MSc', 'Universities in Sweden',
      2, 'full', 'Full tuition + stipend', 0, 'SEK', 'LE', 88, $2, 'open_now',
      'Global professionals.', 'https://si.se', true, false, true),
     (3, 'chevening', 'Chevening Scholarship', 'Chevening', 'MA', 'UK universities',
      2, 'partial', 'Tuition + living allowance', 0, 'GBP', 'CE', 80, $3, 'opening_soon',
      'Leadership programme.', 'https://www.chevening.org', true, false, true),
     (4, 'old-closed', 'Old Closed Scholarship', 'Old', 'BA', 'A university',
      3, 'tuition_only', '', 0, 'USD', 'NE', 45, $4, 'closed',
      'No longer accepting.', '', false, false, false);
   INSERT INTO scholarship_fields (scholarship_id, field_id) VALUES
     (1, 1), (1, 2), (2, 1), (3, 2);
   INSERT INTO change_logs (scholarship_id, change_type, field_changed, old_value, new_value, changed_by)
     VALUES (1, 'update', 'score', '90', '92', 'roy');
`,
  [in90, in140, in30, past],
);

/* ── Assertions ─────────────────────────────────────────────────────────── */

let failures = 0;
const check = (label: string, cond: boolean) => {
  console.log(`  ${cond ? '✓' : '✗'} ${label}`);
  if (!cond) failures += 1;
};
const firstSlugs = (rows: { slug: string }[]) => rows.map((r) => r.slug);

/* Visibility + default ordering */
const all = await queryScholarships({}, client);
check('list: only active scholarships (3 of 4)', all.length === 3);
check('list: default ordering -score (daad, si, chevening)', firstSlugs(all).join(',') === 'daad-epos,si-scholarship,chevening');

/* Filters */
const de = await queryScholarships({ country: ['DE'] }, client);
check('filter country=DE → 1', firstSlugs(de).join(',') === 'daad-epos');
const deSe = await queryScholarships({ country: ['DE', 'SE'] }, client);
check('filter country=DE,SE → 3', deSe.length === 3);
const water = await queryScholarships({ field: ['water'] }, client);
check('filter field=water → daad,chevening', firstSlugs(water).join(',') === 'daad-epos,chevening');
const full = await queryScholarships({ funding: 'full' }, client);
check('filter funding=full → 2', full.length === 2);
const ce = await queryScholarships({ eligibility: 'CE' }, client);
check('filter eligibility=CE → daad,chevening', firstSlugs(ce).join(',') === 'daad-epos,chevening');
const open = await queryScholarships({ status: ['open_now'] }, client);
check('filter status=open_now → 2', open.length === 2);
const minScore = await queryScholarships({ minScore: 85 }, client);
check('filter min_score=85 → daad,si', minScore.length === 2);
const isOpen = await queryScholarships({ isOpen: true }, client);
check('filter is_open=true → 3 (deadlines within 365d + open statuses)', isOpen.length === 3);
const deadlineNext = await queryScholarships({ deadlineInNext: 60 }, client);
check('filter deadline_in_next=60 → chevening only', firstSlugs(deadlineNext).join(',') === 'chevening');
const before = await queryScholarships({ deadlineBefore: in30 }, client);
check('filter deadline_before → chevening only', firstSlugs(before).join(',') === 'chevening');
const byName = await queryScholarships({ ordering: '-name' }, client);
check('ordering -name → Swedish first', byName[0]?.slug === 'si-scholarship');

/* Serialization parity */
const daad = all.find((r) => r.slug === 'daad-epos');
check('serialize: country object', daad?.country.iso_code === 'DE' && daad?.country_name === 'Germany');
check('serialize: fields slugs', daad?.fields.join(',') === 'public-health,water');
check(`serialize: days_until_deadline = 90`, daad?.days_until_deadline === daysBetween(in90, eatToday()));
check('serialize: snake_case fields', 'short_name' in (daad ?? {}) && 'official_link' in (daad ?? {}));

/* Detail */
const detail = await getScholarshipBySlug('daad-epos', client);
check('detail: full shape (application_fee, eligibility_label…)',
  detail?.application_fee === '0' && detail?.eligibility_label === 'CE' && detail?.is_verified === true);

/* Facets */
const countriesActive = await getCountries({ activeOnly: true }, client);
check('countries(active): DE(1), SE(2) → 2 rows',
  countriesActive.length === 2 && countriesActive[0].iso_code === 'DE' && countriesActive[0].scholarship_count === 1);
const countriesAll = await getCountries({}, client);
check('countries(all): KE included (count 1) → 3 rows',
  countriesAll.length === 3 && countriesAll.find((c) => c.iso_code === 'KE')?.scholarship_count === 1);
const fields = await getFields(client);
check('fields: both have 2 scholarships', fields.length === 2 && fields.every((f) => f.scholarship_count === 2));

/* Home stats */
const stats = await getHomeStats(client);
check('home stats: 3 scholarships, 2 countries, 2 open_now, 3 verified',
  stats.scholarships === 3 && stats.countries === 2 && stats.open_now === 2 && stats.verified === 3);

/* Open now + related */
const openNow = await getOpenNow(client);
check('open_now: daad before si (deadline order)', firstSlugs(openNow).join(',') === 'daad-epos,si-scholarship');
const related = await getRelatedScholarships('daad-epos', 3, client);
check('related(daad): si + chevening (shared field/country, self excluded)',
  firstSlugs(related).join(',') === 'si-scholarship,chevening');
check('related: 3 limit respected', (await getRelatedScholarships('daad-epos', 1, client)).length === 1);

/* Filter parsing (Zod) */
const parsed = parseScholarshipFilters(new URLSearchParams('country=DE,FR&field=water&min_score=80&is_open=true&q=daad'));
check('parse: CSV + coercion + is_open',
  parsed.country?.join(',') === 'DE,FR' && parsed.minScore === 80 && parsed.isOpen === true && parsed.q === 'daad');
let threw = false;
try {
  parseScholarshipFilters(new URLSearchParams('deadline_before=not-a-date'));
} catch {
  threw = true;
}
check('parse: invalid date throws (→ 400 in route)', threw);

/* New M4a query functions */
const cardRows = await queryScholarshipCards({ country: ['DE'] }, client);
check('cards: include eligibility_label', cardRows[0]?.eligibility_label === 'CE');
const countAll = await countScholarships({}, client);
check('count: all active = 3', countAll === 3);
const countDe = await countScholarships({ country: ['DE'] }, client);
check('count: country=DE = 1', countDe === 1);
const paged = await queryScholarshipCards({ limit: 2, offset: 0 }, client);
check('pagination: limit 2 → 2 rows', paged.length === 2);
const paged2 = await queryScholarshipCards({ limit: 2, offset: 2 }, client);
check('pagination: offset 2 → 1 row (chevening)', firstSlugs(paged2).join(',') === 'chevening');
const byRegion = await getCountriesByRegion(client);
check('byRegion: only Europe (active scholarships), DE+SE',
  byRegion.length === 1 && byRegion[0].region === 'Europe' && byRegion[0].countries.length === 2);
check('byRegion: SE count = 2',
  byRegion[0]?.countries.find((c) => c.iso_code === 'SE')?.count === 2);
const changelogs = await getChangeLogs(1, 12, client);
check('changeLogs: 1 row with field score', changelogs.length === 1 && changelogs[0].fieldChanged === 'score');
const sitemapRows = await getSitemapScholarships(client);
check('sitemap: 3 active slugs', sitemapRows.length === 3 && sitemapRows.every((r) => typeof r.updatedAt !== 'undefined'));
const featured = await queryScholarshipCards({ isFeatured: true }, client);
check('featured: daad only', firstSlugs(featured).join(',') === 'daad-epos');

console.log(failures === 0 ? '\n✅ QUERY LAYER TEST PASSED' : `\n❌ QUERY LAYER TEST FAILED (${failures})`);
process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('\n❌ QUERY LAYER TEST CRASHED:', err);
  process.exit(1);
});
