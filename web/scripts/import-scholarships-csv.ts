/**
 * Direct CSV importer — scholarships_data.csv → Neon
 *
 * Bypasses the AI pipeline: the CSV is already clean and structured,
 * so columns map 1:1 to the Drizzle schema.
 *
 * Usage (from web/ directory):
 *   npx tsx scripts/import-scholarships-csv.ts ../scholarships_data.csv
 *
 * Requires DATABASE_URL in web/.env.local (Neon pooled connection string).
 */

import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq, and, count, notInArray } from 'drizzle-orm';
import * as schema from '../src/db/schema';

// ── Load .env.local ──────────────────────────────────────────────────────────
import { config } from 'dotenv';
config({ path: path.join(import.meta.dirname, '../.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌  DATABASE_URL not set in .env.local');
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql, { schema });

// ── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '').substring(0, 190);
}

function parseStatus(raw: string): string {
  const u = raw.toUpperCase();
  if (u.includes('OPEN NOW') || u.includes('CRITICAL')) return 'open';
  if (u.includes('CLOSED') || u.includes('INELIGIBLE')) return 'closed';
  if (u.includes('OPENING SOON') || u.includes('NOT YET') || u.includes('UPCOMING')) return 'upcoming';
  return 'unknown';
}

function parseFundingType(raw: string): 'full' | 'partial' | 'tuition' | 'unknown' {
  const u = raw.toLowerCase();
  if (u.includes('fully funded') || u.startsWith('full')) return 'full';
  if (u.includes('partial')) return 'partial';
  if (u.includes('tuition')) return 'tuition';
  return 'unknown';
}

function parseEligibility(raw: string): string {
  const clean = raw.trim().toUpperCase().replace(/[^A-Z]/g, '').substring(0, 2);
  return ['PE', 'AA', 'GM', 'CE', 'LE', 'NE'].includes(clean) ? clean : 'PE';
}

function parseDeadline(raw: string): string | null {
  const match = raw.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+(\d{4})/i);
  if (match) {
    const d = new Date(`${match[2]} ${match[1]} ${match[3]}`);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  }
  return null;
}

function inferRegion(country: string): string {
  const map: [string[], string][] = [
    [['United Kingdom', 'Germany', 'France', 'Netherlands', 'Sweden', 'Hungary', 'Spain',
      'Italy', 'Belgium', 'Austria', 'Switzerland', 'Ireland', 'Denmark', 'Norway', 'Finland',
      'Portugal', 'Czech', 'Poland', 'Turkey'], 'Europe'],
    [['South Korea', 'Japan', 'China', 'India', 'Singapore', 'Taiwan'], 'Asia'],
    [['Algeria', 'Nigeria', 'Kenya', 'South Africa', 'Ghana', 'Ethiopia', 'Rwanda',
      'Tanzania', 'Uganda', 'Senegal', 'Egypt', 'Morocco', 'Tunisia'], 'Africa'],
    [['Australia', 'New Zealand'], 'Oceania'],
    [['United States', 'Canada', 'Mexico'], 'North America'],
  ];
  for (const [names, region] of map) {
    if (names.some(n => country.includes(n))) return region;
  }
  return 'Global';
}

// ── Country + field caches (avoid redundant DB calls) ────────────────────────

// Well-known ISO codes so real countries get real codes
const KNOWN_ISO: Record<string, string> = {
  'United Kingdom': 'GB', 'Germany': 'DE', 'France': 'FR', 'Netherlands': 'NL',
  'Sweden': 'SE', 'Hungary': 'HU', 'Spain': 'ES', 'Italy': 'IT', 'Belgium': 'BE',
  'Austria': 'AT', 'Switzerland': 'CH', 'Ireland': 'IE', 'Denmark': 'DK',
  'Norway': 'NO', 'Finland': 'FI', 'Portugal': 'PT', 'Poland': 'PL', 'Turkey': 'TR',
  'South Korea': 'KR', 'Japan': 'JP', 'China': 'CN', 'India': 'IN', 'Singapore': 'SG',
  'Australia': 'AU', 'New Zealand': 'NZ',
  'United States': 'US', 'Canada': 'CA', 'Mexico': 'MX',
  'Kenya': 'KE', 'Nigeria': 'NG', 'South Africa': 'ZA', 'Ghana': 'GH',
  'Ethiopia': 'ET', 'Algeria': 'DZ', 'Egypt': 'EG', 'Morocco': 'MA', 'Rwanda': 'RW',
  'Tanzania': 'TZ', 'Uganda': 'UG', 'Senegal': 'SN', 'Tunisia': 'TN',
};

// Fallback counter for unknown countries (ZA–ZZ range unlikely to clash with ISO)
let isoCounter = 0;
function nextFallbackCode(): string {
  const letters = 'BCDFGHJKLMNPQRSTVWXYZ';
  const a = letters[Math.floor(isoCounter / letters.length) % letters.length];
  const b = letters[isoCounter % letters.length];
  isoCounter++;
  return `${a}${b}`;
}

const countryCache: Record<string, number> = {};
async function getOrCreateCountry(name: string): Promise<number> {
  if (countryCache[name]) return countryCache[name];

  const existing = await db.query.countries.findFirst({
    where: eq(schema.countries.name, name),
    columns: { id: true },
  });
  if (existing) {
    countryCache[name] = existing.id;
    return existing.id;
  }

  // Find matching ISO from known map or fallback
  let isoCode = Object.entries(KNOWN_ISO).find(([k]) => name.includes(k))?.[1] ?? nextFallbackCode();

  // Keep trying fallback codes if iso_code collides
  while (true) {
    try {
      const [rec] = await db
        .insert(schema.countries)
        .values({ name, isoCode, region: inferRegion(name) })
        .returning({ id: schema.countries.id });
      countryCache[name] = rec.id;
      return rec.id;
    } catch (err: unknown) {
      const msg = String(err);
      if (msg.includes('iso_code')) {
        isoCode = nextFallbackCode(); // try another code
        continue;
      }
      if (msg.includes('name')) {
        // Name was inserted by concurrent call — fetch it
        const found = await db.query.countries.findFirst({
          where: eq(schema.countries.name, name), columns: { id: true },
        });
        countryCache[name] = found!.id;
        return found!.id;
      }
      throw err;
    }
  }
}

const fieldCache: Record<string, number> = {};
async function getOrCreateField(name: string): Promise<number> {
  const t = name.trim();
  if (!t) return -1;
  if (fieldCache[t]) return fieldCache[t];
  const slug = toSlug(t);
  const [rec] = await db
    .insert(schema.fieldsOfStudy)
    .values({ name: t, slug })
    .onConflictDoUpdate({ target: schema.fieldsOfStudy.slug, set: { name: t } })
    .returning({ id: schema.fieldsOfStudy.id });
  fieldCache[t] = rec.id;
  return rec.id;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error('Usage: npx tsx scripts/import-scholarships-csv.ts <path/to/scholarships_data.csv>');
    process.exit(1);
  }

  const raw = fs.readFileSync(path.resolve(csvPath), 'utf-8');
  const { data: rows, errors } = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
  });

  if (errors.length) console.warn('Parse warnings:', errors.slice(0, 3));

  // ── Pre-flight: slug collisions ────────────────────────────────────────────
  // Rows are upserted on `slug`, which is derived from the Scholarship name
  // alone. Two rows with the same name collapse into one DB row, so the CSV
  // row count and the site's scholarship count legitimately differ. Surface
  // that here instead of leaving it as an unexplained gap on the dashboard.
  const slugGroups = new Map<string, string[]>();
  for (const row of rows) {
    const name = row['Scholarship']?.trim();
    if (!name) continue;
    const key = toSlug(name);
    const ids = slugGroups.get(key) ?? [];
    ids.push(row['ID']?.trim() || '?');
    slugGroups.set(key, ids);
  }
  const collisions = [...slugGroups.entries()].filter(([, ids]) => ids.length > 1);

  if (collisions.length) {
    const lost = collisions.reduce((n, [, ids]) => n + ids.length - 1, 0);
    console.warn(
      `\n⚠️   ${collisions.length} duplicate scholarship name(s) in the CSV ` +
      `— ${lost} row(s) will merge into an existing record:`,
    );
    for (const [slug, ids] of collisions) {
      console.warn(`      ${slug}  (CSV IDs: ${ids.join(', ')})`);
    }
    console.warn(
      `\n    Dedupe these rows in scholarships_data.csv if you want the CSV ` +
      `row count\n    and the site's scholarship count to agree.`,
    );
  }

  console.log(
    `\nImporting ${rows.length} CSV rows → ${slugGroups.size} distinct scholarships into Neon...\n`,
  );

  let upserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = row['Scholarship']?.trim();
    if (!name) { skipped++; continue; }

    try {
      const countryId = await getOrCreateCountry(row['Country']?.trim() || 'Various');
      const slug = toSlug(name);
      const fundingRaw = row['Funding']?.trim() || '';

      const [rec] = await db
        .insert(schema.scholarships)
        .values({
          slug,
          name,
          shortName: '',
          programme: row['Programme']?.trim() || '',
          university: row['University']?.trim() || '',
          countryId,
          fundingType: parseFundingType(fundingRaw),
          fundingDetail: fundingRaw,
          applicationFee: '0',
          currency: 'USD',
          eligibilityLabel: parseEligibility(row['Elig.'] || ''),
          englishRequirement: row['English']?.trim() || '',
          score: parseInt(row['Score'] || '0', 10) || 0,
          competitiveness: row['Competitiveness']?.trim() || '',
          deadlineDate: parseDeadline(row['Deadline'] || ''),
          deadlineNotes: row['Deadline']?.trim() || '',
          status: parseStatus(row['Status'] || ''),
          notes: row['Notes / Action']?.trim() || '',
          actionRequired: '',
          officialLink: row['Official Link']?.trim() || '',
          isVerified: true,
          isFeatured: row['Category']?.trim() === 'Roy Priority',
        })
        .onConflictDoUpdate({
          target: schema.scholarships.slug,
          set: {
            programme: row['Programme']?.trim() || '',
            university: row['University']?.trim() || '',
            fundingType: parseFundingType(fundingRaw),
            fundingDetail: fundingRaw,
            eligibilityLabel: parseEligibility(row['Elig.'] || ''),
            englishRequirement: row['English']?.trim() || '',
            score: parseInt(row['Score'] || '0', 10) || 0,
            competitiveness: row['Competitiveness']?.trim() || '',
            deadlineDate: parseDeadline(row['Deadline'] || ''),
            deadlineNotes: row['Deadline']?.trim() || '',
            status: parseStatus(row['Status'] || ''),
            notes: row['Notes / Action']?.trim() || '',
            officialLink: row['Official Link']?.trim() || '',
            isVerified: true,
            isFeatured: row['Category']?.trim() === 'Roy Priority',
          },
        })
        .returning({ id: schema.scholarships.id });

      // Wire up fields of study. The CSV's Field column is the source of truth,
      // so associations are replaced rather than only added -- inserting alone
      // leaves links from a since-removed duplicate row attached forever, and
      // queries.ts joins these for field filters and counts.
      const fieldNames = (row['Field'] || '').split(',').map(f => f.trim()).filter(Boolean);
      const fieldIds: number[] = [];
      for (const fieldName of fieldNames) {
        const fieldId = await getOrCreateField(fieldName);
        if (fieldId < 0) continue;
        fieldIds.push(fieldId);
        await db
          .insert(schema.scholarshipFields)
          .values({ scholarshipId: rec.id, fieldId })
          .onConflictDoNothing();
      }

      // Drop associations this scholarship no longer claims. Scoped to the row
      // being imported, so scholarships absent from the CSV are left untouched.
      await db
        .delete(schema.scholarshipFields)
        .where(
          fieldIds.length
            ? and(
                eq(schema.scholarshipFields.scholarshipId, rec.id),
                notInArray(schema.scholarshipFields.fieldId, fieldIds),
              )
            : eq(schema.scholarshipFields.scholarshipId, rec.id),
        );

      upserted++;
      process.stdout.write(`  ✓ ${upserted}/${rows.length} — ${name.substring(0, 60)}\r`);
    } catch (err) {
      console.error(`\n  ✗ Failed: ${name}`, err);
      skipped++;
    }
  }

  console.log(
    `\n\n${skipped > 0 ? '⚠️ ' : '✅'}  Done — ${upserted} upserted, ` +
    `${skipped} skipped (${rows.length} total)`,
  );
  console.log(`    "Roy Priority" scholarships marked as featured (isFeatured = true)`);

  // ── Reconcile against what the site actually counts ────────────────────────
  // Every public query filters on is_active = true, so this is the number the
  // homepage renders in "Browse N scholarships". Print it next to the CSV
  // figures so a mismatch is caught here rather than on the live dashboard.
  const [activeRow] = await db
    .select({ n: count() })
    .from(schema.scholarships)
    .where(eq(schema.scholarships.isActive, true));
  const activeCount = activeRow?.n ?? 0;

  const csvSlugs = new Set(slugGroups.keys());
  const dbActive = await db
    .select({ slug: schema.scholarships.slug })
    .from(schema.scholarships)
    .where(eq(schema.scholarships.isActive, true));
  const orphans = dbActive.filter((r) => !csvSlugs.has(r.slug));

  console.log(`\n📊  Count reconciliation`);
  console.log(`    CSV rows ................. ${rows.length}`);
  console.log(`    Distinct scholarships .... ${slugGroups.size}`);
  console.log(`    Active in DB (site shows)  ${activeCount}`);

  if (orphans.length) {
    // The importer only ever inserts or updates — it never deactivates. Rows
    // dropped from the CSV linger as active records and inflate the count.
    console.log(
      `\n⚠️   ${orphans.length} active scholarship(s) in the DB are not in this CSV:`,
    );
    for (const o of orphans.slice(0, 20)) console.log(`      ${o.slug}`);
    if (orphans.length > 20) console.log(`      ... and ${orphans.length - 20} more`);
    console.log(
      `\n    The importer never deactivates, so these persist from earlier ` +
      `imports.\n    Set is_active = false on any that should drop off the site.`,
    );
  }

  if (activeCount !== slugGroups.size) {
    console.log(
      `\n⚠️   Site count (${activeCount}) != distinct CSV scholarships ` +
      `(${slugGroups.size}) — see the warnings above.`,
    );
  }

  // Row failures are caught per row so one bad record cannot abort the run, but
  // resolving normally afterwards would report success to CI even if every row
  // failed -- a wrong DATABASE_URL would sync nothing and still go green. Fail
  // the process instead, so an automated import cannot silently do nothing.
  //
  // Deliberately not failing on the count mismatch above: orphaned rows are a
  // data-curation question, not an import failure, and a known pre-CSV record
  // would leave the workflow permanently red.
  if (skipped > 0) {
    console.error(
      `\n❌  ${skipped} of ${rows.length} row(s) failed to import — see the errors above.`,
    );
    process.exit(1);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
