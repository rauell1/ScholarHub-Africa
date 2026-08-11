/**
 * Shared data-fetching layer (docs/MIGRATION_PLAN.md §5 - Phase 3).
 *
 * These are the ONLY functions pages and API routes call for scholarship
 * data, so RSC pages and /api/v1/* handlers can never drift apart.
 *
 * Semantics are a faithful port of the Django originals:
 *   - apps/scholarships/views.py  (home stats, directory, detail, related)
 *   - apps/scholarships/filters.py (ScholarshipFilter query params)
 *   - apps/scholarships/search.py  (weighted full-text search, rank>=0.001)
 *   - apps/scholarships/serializers.py (JSON shapes incl. days_until_deadline)
 *   - apps/tracker/…  (Phase 5 - tracker queries land with auth)
 *
 * All functions accept an optional Db client so they can be unit-tested
 * against an in-memory Postgres (see scripts/test-queries-local.ts) and are
 * lazy over DATABASE_URL (getDb() throws only when used without it).
 */
import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  inArray,
  lte,
  ne,
  or,
  sql,
  type SQL,
} from 'drizzle-orm';

import { addDays, daysUntilDeadline, eatToday, toDateIso } from './dates';
import { getDb, type Db } from './db';
import {
  changeLogs,
  countries,
  fieldsOfStudy,
  scholarshipFields,
  scholarships,
} from '../db/schema';

/* ── Types ──────────────────────────────────────────────────────────────── */

/** Row shape projected by the shared list/detail selects (before JSON shape). */
export interface ScholarshipRowShape {
  id: number;
  eligibilityLabel: string;
  slug: string;
  name: string;
  shortName: string;
  programme: string;
  university: string;
  countryId: number;
  countryIso: string;
  countryName: string;
  countryFlag: string;
  fundingType: string;
  fundingDetail: string;
  score: number;
  status: string;
  deadlineDate: string | null;
  officialLink: string;
}

export interface ScholarshipDetailRowShape extends ScholarshipRowShape {
  eligibilityLabel: string;
  englishRequirement: string;
  ageMin: number | null;
  ageMax: number | null;
  experienceYearsMin: string | null;
  gpaMinimum: string | null;
  nationalityNotes: string;
  mbaImpact: string;
  mbaNotes: string;
  competitiveness: string;
  deadlineNotes: string;
  cycleYear: number | null;
  notes: string;
  actionRequired: string;
  isVerified: boolean;
  verifiedAt: Date | null;
  verifiedSource: string;
  applicationFee: string;
  currency: string;
  updatedAt: Date;
}

/** API JSON shape - matches DRF ScholarshipListSerializer exactly. */
export interface ScholarshipListRow {
  id: number;
  slug: string;
  name: string;
  short_name: string;
  programme: string;
  university: string;
  country: { iso_code: string; name: string; flag_emoji: string };
  country_name: string;
  fields: string[];
  funding_type: string;
  funding_detail: string;
  score: number;
  status: string;
  deadline_date: string | null;
  days_until_deadline: number | null;
  official_link: string;
}

/** API JSON shape - matches DRF ScholarshipDetailSerializer exactly. */
export interface ScholarshipDetailRow extends ScholarshipListRow {
  eligibility_label: string;
  english_requirement: string;
  age_min: number | null;
  age_max: number | null;
  experience_years_min: string | null;
  gpa_minimum: string | null;
  nationality_notes: string;
  mba_impact: string;
  mba_notes: string;
  competitiveness: string;
  deadline_notes: string;
  cycle_year: number | null;
  notes: string;
  action_required: string;
  is_verified: boolean;
  verified_at: string | null;
  verified_source: string;
  application_fee: string;
  currency: string;
}

export interface CountryRow {
  iso_code: string;
  name: string;
  flag_emoji: string;
  region: string;
  scholarship_count: number;
}

export interface FieldRow {
  slug: string;
  name: string;
  icon: string;
  scholarship_count: number;
}

export interface HomeStats {
  scholarships: number;
  countries: number;
  open_now: number;
  verified: number;
}

/** Filters - the Django ScholarshipFilter query-param surface. */
export interface ScholarshipFilters {
  /** ISO codes (CSV) - matches CharInFilter on country__iso_code. */
  country?: string[];
  /** Field slugs (CSV) - matches CharInFilter on fields__slug. */
  field?: string[];
  funding?: string;
  eligibility?: string;
  /** Status values (CSV). */
  status?: string[];
  minScore?: number;
  maxScore?: number;
  deadlineBefore?: string; // YYYY-MM-DD
  deadlineAfter?: string; // YYYY-MM-DD
  /** Deadlines within the next N days. */
  deadlineInNext?: number;
  /** Open window logic (365 days, open statuses). */
  isOpen?: boolean;
  /** Featured only (homepage featured section). */
  isFeatured?: boolean;
  /** updated_at >= this date (weekly digest "new this week"). */
  updatedAfter?: string;
  /** Full-text search term (Django search_scholarships). */
  q?: string;
  /** score | -score | deadline_date | -deadline_date | name | -name | updated */
  ordering?: string;
  /** Internal pagination for the directory page (API stays unpaginated). */
  limit?: number;
  offset?: number;
}

const OPEN_STATUSES = ['open_now', 'opening_soon', 'upcoming', 'not_yet_open'] as const;

/* ── Column projections (shared by list & detail queries) ───────────────── */

const listColumns = {
  id: scholarships.id,
  eligibilityLabel: scholarships.eligibilityLabel,
  slug: scholarships.slug,
  name: scholarships.name,
  shortName: scholarships.shortName,
  programme: scholarships.programme,
  university: scholarships.university,
  countryId: scholarships.countryId,
  countryIso: countries.isoCode,
  countryName: countries.name,
  countryFlag: countries.flagEmoji,
  fundingType: scholarships.fundingType,
  fundingDetail: scholarships.fundingDetail,
  score: scholarships.score,
  status: scholarships.status,
  deadlineDate: scholarships.deadlineDate,
  officialLink: scholarships.officialLink,
};

const detailColumns = {
  ...listColumns,
  eligibilityLabel: scholarships.eligibilityLabel,
  englishRequirement: scholarships.englishRequirement,
  ageMin: scholarships.ageMin,
  ageMax: scholarships.ageMax,
  experienceYearsMin: scholarships.experienceYearsMin,
  gpaMinimum: scholarships.gpaMinimum,
  nationalityNotes: scholarships.nationalityNotes,
  mbaImpact: scholarships.mbaImpact,
  mbaNotes: scholarships.mbaNotes,
  competitiveness: scholarships.competitiveness,
  deadlineNotes: scholarships.deadlineNotes,
  cycleYear: scholarships.cycleYear,
  notes: scholarships.notes,
  actionRequired: scholarships.actionRequired,
  isVerified: scholarships.isVerified,
  verifiedAt: scholarships.verifiedAt,
  verifiedSource: scholarships.verifiedSource,
  applicationFee: scholarships.applicationFee,
  currency: scholarships.currency,
  updatedAt: scholarships.updatedAt,
};

/* ── Serialization (DRF shape parity) ───────────────────────────────────── */

function toListRow(row: ScholarshipRowShape, fieldSlugs: string[]): ScholarshipListRow {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    short_name: row.shortName,
    programme: row.programme,
    university: row.university,
    country: {
      iso_code: row.countryIso,
      name: row.countryName,
      flag_emoji: row.countryFlag,
    },
    country_name: row.countryName,
    fields: fieldSlugs,
    funding_type: row.fundingType,
    funding_detail: row.fundingDetail,
    score: row.score,
    status: row.status,
    deadline_date: toDateIso(row.deadlineDate),
    days_until_deadline: daysUntilDeadline(row.deadlineDate),
    official_link: row.officialLink,
  };
}

function toDetailRow(row: ScholarshipDetailRowShape, fieldSlugs: string[]): ScholarshipDetailRow {
  return {
    ...toListRow(row, fieldSlugs),
    eligibility_label: row.eligibilityLabel,
    english_requirement: row.englishRequirement,
    age_min: row.ageMin,
    age_max: row.ageMax,
    experience_years_min: row.experienceYearsMin,
    gpa_minimum: row.gpaMinimum,
    nationality_notes: row.nationalityNotes,
    mba_impact: row.mbaImpact,
    mba_notes: row.mbaNotes,
    competitiveness: row.competitiveness,
    deadline_notes: row.deadlineNotes,
    cycle_year: row.cycleYear,
    notes: row.notes,
    action_required: row.actionRequired,
    is_verified: row.isVerified,
    verified_at: row.verifiedAt ? row.verifiedAt.toISOString() : null,
    verified_source: row.verifiedSource,
    application_fee: row.applicationFee,
    currency: row.currency,
  };
}

/* ── Field slugs helper (batched - no N+1) ──────────────────────────────── */

async function fetchFieldSlugs(client: Db, ids: number[]): Promise<Map<number, string[]>> {
  const map = new Map<number, string[]>();
  if (ids.length === 0) return map;
  const rows = await client
    .select({
      scholarshipId: scholarshipFields.scholarshipId,
      slug: fieldsOfStudy.slug,
    })
    .from(scholarshipFields)
    .innerJoin(fieldsOfStudy, eq(scholarshipFields.fieldId, fieldsOfStudy.id))
    .where(inArray(scholarshipFields.scholarshipId, ids));
  for (const row of rows) {
    const list = map.get(row.scholarshipId) ?? [];
    list.push(row.slug);
    map.set(row.scholarshipId, list);
  }
  return map;
}

/* ── Ordering (Django directory ORDERING_CHOICES + DRF ordering_fields) ─── */

function buildOrdering(ordering: string | undefined, rank: SQL<number> | null): SQL[] {
  if (rank) return [desc(rank), desc(scholarships.score)];
  switch (ordering ?? '-score') {
    case 'score':
    case '-score':
      return [desc(scholarships.score)];
    case 'deadline':
    case 'deadline_date':
      return [asc(scholarships.deadlineDate), desc(scholarships.score)];
    case '-deadline':
    case '-deadline_date':
      return [desc(scholarships.deadlineDate), desc(scholarships.score)];
    case 'name':
      return [asc(scholarships.name)];
    case '-name':
      return [desc(scholarships.name)];
    case 'updated':
      return [desc(scholarships.updatedAt)];
    default:
      return [desc(scholarships.score)];
  }
}

/* ── Main list query (filters + search + ordering + pagination) ─────────── */

export function buildScholarshipConditions(
  filters: ScholarshipFilters,
  client: Db,
): { conditions: SQL[]; rank: SQL<number> | null } {
  const conditions: SQL[] = [eq(scholarships.isActive, true)];
  const today = eatToday();

  if (filters.country && filters.country.length > 0) {
    conditions.push(
      inArray(
        scholarships.countryId,
        client
          .select({ id: countries.id })
          .from(countries)
          .where(inArray(countries.isoCode, filters.country)),
      ),
    );
  }
  if (filters.field && filters.field.length > 0) {
    conditions.push(
      inArray(
        scholarships.id,
        client
          .select({ id: scholarshipFields.scholarshipId })
          .from(scholarshipFields)
          .innerJoin(fieldsOfStudy, eq(scholarshipFields.fieldId, fieldsOfStudy.id))
          .where(inArray(fieldsOfStudy.slug, filters.field)),
      ),
    );
  }
  if (filters.funding) conditions.push(eq(scholarships.fundingType, filters.funding));
  if (filters.eligibility) {
    conditions.push(eq(scholarships.eligibilityLabel, filters.eligibility));
  }
  if (filters.status && filters.status.length > 0) {
    conditions.push(inArray(scholarships.status, filters.status));
  }
  if (filters.minScore !== undefined) conditions.push(gte(scholarships.score, filters.minScore));
  if (filters.maxScore !== undefined) conditions.push(lte(scholarships.score, filters.maxScore));
  if (filters.deadlineBefore) conditions.push(lte(scholarships.deadlineDate, filters.deadlineBefore));
  if (filters.deadlineAfter) conditions.push(gte(scholarships.deadlineDate, filters.deadlineAfter));
  if (filters.deadlineInNext !== undefined) {
    conditions.push(
      gte(scholarships.deadlineDate, today),
      lte(scholarships.deadlineDate, addDays(today, filters.deadlineInNext)),
    );
  }
  if (filters.isOpen === true) {
    // Django filter_is_open: deadline within [today, today+365] AND open statuses.
    conditions.push(
      gte(scholarships.deadlineDate, today),
      lte(scholarships.deadlineDate, addDays(today, 365)),
      inArray(scholarships.status, [...OPEN_STATUSES]),
    );
  }

  if (filters.isFeatured === true) {
    conditions.push(eq(scholarships.isFeatured, true));
  }
  if (filters.updatedAfter) {
    conditions.push(gte(scholarships.updatedAt, new Date(`${filters.updatedAfter}T00:00:00Z`)));
  }

  let rank: SQL<number> | null = null;
  const q = filters.q?.trim();
  if (q) {
    rank = sql<number>`ts_rank(${scholarships.searchVector}, websearch_to_tsquery('english', ${q}))`;
    conditions.push(
      sql`${scholarships.searchVector} @@ websearch_to_tsquery('english', ${q})`,
      gte(rank, 0.001),
    );
  }

  return { conditions, rank };
}

/** Raw rows + field slugs for pages (cards need eligibility_label). */
export interface ScholarshipCardRow extends ScholarshipListRow {
  eligibility_label: string;
}

export async function queryScholarshipCards(
  filters: ScholarshipFilters = {},
  client: Db = getDb(),
): Promise<ScholarshipCardRow[]> {
  const { conditions, rank } = buildScholarshipConditions(filters, client);

  const query = client
    .select(listColumns)
    .from(scholarships)
    .innerJoin(countries, eq(scholarships.countryId, countries.id))
    .where(and(...conditions))
    .orderBy(...buildOrdering(filters.ordering, rank));

  const rows =
    filters.limit !== undefined || filters.offset !== undefined
      ? await query.limit(filters.limit ?? 100).offset(filters.offset ?? 0)
      : await query;
  const fieldMap = await fetchFieldSlugs(client, rows.map((r) => r.id));
  return rows.map((row) => ({
    ...toListRow(row, fieldMap.get(row.id) ?? []),
    eligibility_label: row.eligibilityLabel,
  }));
}

/** Serialized list rows - DRF ScholarshipListSerializer parity (API). */
export async function queryScholarships(
  filters: ScholarshipFilters = {},
  client: Db = getDb(),
): Promise<ScholarshipListRow[]> {
  const cards = await queryScholarshipCards(filters, client);
  return cards.map((card) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- rest-sibling strip of the page-only field
    const { eligibility_label, ...row } = card;
    return row;
  });
}

/** Total row count for the same filters - directory pagination (Django Paginator.count). */
export async function countScholarships(
  filters: ScholarshipFilters = {},
  client: Db = getDb(),
): Promise<number> {
  const { conditions } = buildScholarshipConditions(filters, client);
  const rows = await client
    .select({ n: count() })
    .from(scholarships)
    .innerJoin(countries, eq(scholarships.countryId, countries.id))
    .where(and(...conditions));
  return rows[0]?.n ?? 0;
}

/** GET /api/v1/scholarships/open_now/ - status=open_now, deadline order. */
export function getOpenNow(client: Db = getDb()): Promise<ScholarshipListRow[]> {
  return queryScholarships({ status: ['open_now'], ordering: 'deadline_date' }, client);
}

/** Homepage featured section - is_featured, score order (Django home()). */
export function getFeatured(client: Db = getDb()): Promise<ScholarshipListRow[]> {
  return queryScholarships({ isFeatured: true, ordering: '-score', limit: 4 }, client);
}

/** GET /api/v1/scholarships/top/ - first 20 by score. */
export function getTop(client: Db = getDb()): Promise<ScholarshipListRow[]> {
  return queryScholarships({ ordering: '-score', limit: 20 }, client);
}

/** GET /api/v1/search/?q= - first 10 ranked results. */
export function searchScholarships(
  q: string,
  client: Db = getDb(),
): Promise<ScholarshipListRow[]> {
  const term = (q ?? '').trim();
  if (!term) return Promise.resolve([]);
  return queryScholarships({ q: term, limit: 10 }, client);
}

/* ── Change log (Django detail view change_logs, newest 12) ─────────────── */

export interface ChangeLogRow {
  fieldChanged: string;
  oldValue: string;
  newValue: string;
  changedAt: Date;
}

export async function getChangeLogs(
  scholarshipId: number,
  limit = 12,
  client: Db = getDb(),
): Promise<ChangeLogRow[]> {
  const rows = await client
    .select({
      fieldChanged: changeLogs.fieldChanged,
      oldValue: changeLogs.oldValue,
      newValue: changeLogs.newValue,
      changedAt: changeLogs.changedAt,
    })
    .from(changeLogs)
    .where(eq(changeLogs.scholarshipId, scholarshipId))
    .orderBy(desc(changeLogs.changedAt))
    .limit(limit);
  return rows;
}

/* ── Sitemap (Phase 4 - active detail URLs with lastmod) ────────────────── */

export async function getSitemapScholarships(
  client: Db = getDb(),
): Promise<Array<{ slug: string; updatedAt: Date }>> {
  const rows = await client
    .select({ slug: scholarships.slug, updatedAt: scholarships.updatedAt })
    .from(scholarships)
    .where(eq(scholarships.isActive, true))
    .orderBy(asc(scholarships.slug));
  return rows;
}

/* ── By-country grouping (Django by_country view: region → countries) ───── */

export interface CountryGroup {
  region: string;
  countries: Array<{
    iso_code: string;
    name: string;
    flag_emoji: string;
    count: number;
  }>;
}

const REGION_ORDER = ['Europe', 'Asia', 'Americas', 'Africa', 'Oceania'];

export async function getCountriesByRegion(
  client: Db = getDb(),
): Promise<CountryGroup[]> {
  const rows = await client
    .select({
      region: countries.region,
      isoCode: countries.isoCode,
      name: countries.name,
      flagEmoji: countries.flagEmoji,
      count: count(scholarships.id),
    })
    .from(countries)
    .innerJoin(scholarships, eq(scholarships.countryId, countries.id))
    .where(eq(scholarships.isActive, true))
    .groupBy(countries.id, countries.region, countries.isoCode, countries.name, countries.flagEmoji)
    .orderBy(asc(countries.region), asc(countries.name));

  const grouped = new Map<string, CountryGroup>();
  for (const row of rows) {
    const group = grouped.get(row.region) ?? {
      region: row.region,
      countries: [],
    };
    group.countries.push({
      iso_code: row.isoCode,
      name: row.name,
      flag_emoji: row.flagEmoji,
      count: row.count,
    });
    grouped.set(row.region, group);
  }

  // Django region order: Europe, Asia, Americas, Africa, Oceania, then any others.
  const ordered: CountryGroup[] = [];
  for (const region of REGION_ORDER) {
    const group = grouped.get(region);
    if (group) ordered.push(group);
  }
  for (const [region, group] of grouped) {
    if (!REGION_ORDER.includes(region)) ordered.push(group);
  }
  return ordered;
}

/* ── Detail (Django detail view: active-only for anonymous/non-staff) ───── */

async function fetchDetail(
  client: Db,
  condition: SQL,
): Promise<ScholarshipDetailRow | null> {
  const rows = await client
    .select(detailColumns)
    .from(scholarships)
    .innerJoin(countries, eq(scholarships.countryId, countries.id))
    .where(and(eq(scholarships.isActive, true), condition))
    .limit(1);
  if (rows.length === 0) return null;
  const row = rows[0] as ScholarshipDetailRowShape;
  const fieldMap = await fetchFieldSlugs(client, [row.id]);
  return toDetailRow(row, fieldMap.get(row.id) ?? []);
}

export function getScholarshipBySlug(
  slug: string,
  client: Db = getDb(),
): Promise<ScholarshipDetailRow | null> {
  return fetchDetail(client, eq(scholarships.slug, slug));
}

export function getScholarshipById(
  id: number,
  client: Db = getDb(),
): Promise<ScholarshipDetailRow | null> {
  return fetchDetail(client, eq(scholarships.id, id));
}

/* ── Facets (counts) - Django API + directory sidebar ───────────────────── */

export async function getCountries(
  opts: { activeOnly?: boolean } = {},
  client: Db = getDb(),
): Promise<CountryRow[]> {
  const joinOn = opts.activeOnly
    ? and(eq(scholarships.countryId, countries.id), eq(scholarships.isActive, true))
    : eq(scholarships.countryId, countries.id);
  const rows = await client
    .select({
      isoCode: countries.isoCode,
      name: countries.name,
      flagEmoji: countries.flagEmoji,
      region: countries.region,
      scholarshipCount: count(scholarships.id),
    })
    .from(countries)
    .leftJoin(scholarships, joinOn)
    .groupBy(countries.id, countries.isoCode, countries.name, countries.flagEmoji, countries.region)
    .orderBy(asc(countries.name));
  // Django filters scholarship_count > 0; filtering in JS keeps the SQL
  // portable (same result set, trivial cardinality: <100 countries).
  return rows
    .filter((r) => r.scholarshipCount > 0)
    .map((r) => ({
      iso_code: r.isoCode,
      name: r.name,
      flag_emoji: r.flagEmoji,
      region: r.region,
      scholarship_count: r.scholarshipCount,
    }));
}

export async function getFields(client: Db = getDb()): Promise<FieldRow[]> {
  const rows = await client
    .select({
      slug: fieldsOfStudy.slug,
      name: fieldsOfStudy.name,
      icon: fieldsOfStudy.icon,
      scholarshipCount: count(scholarshipFields.scholarshipId),
    })
    .from(fieldsOfStudy)
    .leftJoin(scholarshipFields, eq(scholarshipFields.fieldId, fieldsOfStudy.id))
    .groupBy(fieldsOfStudy.id, fieldsOfStudy.slug, fieldsOfStudy.name, fieldsOfStudy.icon)
    .orderBy(asc(fieldsOfStudy.name));
  return rows
    .filter((r) => r.scholarshipCount > 0)
    .map((r) => ({
      slug: r.slug,
      name: r.name,
      icon: r.icon,
      scholarship_count: r.scholarshipCount,
    }));
}

/* ── Homepage stats (Django home() aggregations, in SQL) ────────────────── */

export async function getHomeStats(client?: Db): Promise<HomeStats> {
  // Lazy client resolution: getDb() may throw when DATABASE_URL is unset
  // (preview builds) - resolve INSIDE the try so the fallback applies.
  try {
    const db = client ?? getDb();
    const [total, openNow, verified] = await Promise.all([
      db
        .select({ n: count() })
        .from(scholarships)
        .where(eq(scholarships.isActive, true)),
      db
        .select({ n: count() })
        .from(scholarships)
        .where(and(eq(scholarships.isActive, true), eq(scholarships.status, 'open_now'))),
      db
        .select({ n: count() })
        .from(scholarships)
        .where(and(eq(scholarships.isActive, true), eq(scholarships.isVerified, true))),
    ]);
    const countryRows = await getCountries({ activeOnly: true }, db);
    return {
      scholarships: total[0].n,
      countries: countryRows.length,
      open_now: openNow[0].n,
      verified: verified[0].n,
    };
  } catch {
    // Build-safe fallback (no DATABASE_URL in previews) - stats stay hidden.
    return { scholarships: 0, countries: 0, open_now: 0, verified: 0 };
  }
}

/* ── Related scholarships (Django detail view internal linking) ─────────── */

export async function getRelatedScholarships(
  slug: string,
  limit = 3,
  client: Db = getDb(),
): Promise<ScholarshipListRow[]> {
  const base = await getScholarshipBySlug(slug, client);
  if (!base) return [];
  const baseIso = base.country.iso_code;

  const rows = await client
    .select(listColumns)
    .from(scholarships)
    .innerJoin(countries, eq(scholarships.countryId, countries.id))
    .where(
      and(
        eq(scholarships.isActive, true),
        ne(scholarships.slug, slug),
        or(
          eq(countries.isoCode, baseIso),
          inArray(
            scholarships.id,
            client
              .select({ id: scholarshipFields.scholarshipId })
              .from(scholarshipFields)
              .innerJoin(fieldsOfStudy, eq(scholarshipFields.fieldId, fieldsOfStudy.id))
              .where(inArray(fieldsOfStudy.slug, base.fields)),
          ),
        ),
      ),
    )
    .orderBy(desc(scholarships.score))
    .limit(limit);

  const fieldMap = await fetchFieldSlugs(client, rows.map((r) => r.id));
  return rows.map((row) => toListRow(row, fieldMap.get(row.id) ?? []));
}
