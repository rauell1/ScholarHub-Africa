/**
 * Core scholarship sync logic — shared by the admin "Sync from GitHub" action
 * and the CLI import script.
 *
 * Fetches scholarships_data.csv from the GitHub repo and upserts every row
 * directly into Neon. No LLM involved — the CSV is already structured.
 */

import Papa from 'papaparse';
import { eq } from 'drizzle-orm';
import { getDb } from './db';
import * as schema from '@/db/schema';

const GITHUB_CSV_URL =
  'https://raw.githubusercontent.com/rauell1/ScholarHub-Africa/main/scholarships_data.csv';

export interface SyncResult {
  upserted: number;
  skipped: number;
  total: number;
  errors: string[];
}

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
      'Portugal', 'Czech', 'Poland', 'Turkey', 'Romanian', 'Israeli'], 'Europe'],
    [['South Korea', 'Japan', 'China', 'India', 'Singapore', 'Taiwan', 'Russian'], 'Asia'],
    [['Algeria', 'Nigeria', 'Kenya', 'South Africa', 'Ghana', 'Ethiopia', 'Rwanda',
      'Tanzania', 'Uganda', 'Senegal', 'Egypt', 'Morocco', 'Tunisia'], 'Africa'],
    [['Australia', 'New Zealand'], 'Oceania'],
    [['United States', 'Canada', 'Mexico', 'Brazilian'], 'North America'],
  ];
  for (const [names, region] of map) {
    if (names.some(n => country.includes(n))) return region;
  }
  return 'Global';
}

const KNOWN_ISO: Record<string, string> = {
  'United Kingdom': 'GB', 'Germany': 'DE', 'France': 'FR', 'Netherlands': 'NL',
  'Sweden': 'SE', 'Hungary': 'HU', 'Spain': 'ES', 'Italy': 'IT', 'Belgium': 'BE',
  'Austria': 'AT', 'Switzerland': 'CH', 'Ireland': 'IE', 'Denmark': 'DK',
  'Norway': 'NO', 'Finland': 'FI', 'Portugal': 'PT', 'Poland': 'PL', 'Turkey': 'TR',
  'South Korea': 'KR', 'Japan': 'JP', 'China': 'CN', 'India': 'IN', 'Singapore': 'SG',
  'Australia': 'AU', 'New Zealand': 'NZ', 'United States': 'US', 'Canada': 'CA',
  'Kenya': 'KE', 'Nigeria': 'NG', 'South Africa': 'ZA', 'Ghana': 'GH',
  'Ethiopia': 'ET', 'Algeria': 'DZ', 'Egypt': 'EG', 'Morocco': 'MA', 'Rwanda': 'RW',
  'Tanzania': 'TZ', 'Uganda': 'UG', 'Senegal': 'SN', 'Tunisia': 'TN',
  'Brazil': 'BR', 'Israel': 'IL', 'Russia': 'RU', 'Taiwan': 'TW',
  'Czech Republic': 'CZ', 'Romania': 'RO',
};

// ── Country & field caches ────────────────────────────────────────────────────

function makeCountryCache() {
  const cache: Record<string, number> = {};
  let counter = 0;

  function nextCode(): string {
    const letters = 'BCDFGHJKLMNPQRSTVWXYZ';
    const a = letters[Math.floor(counter / letters.length) % letters.length];
    const b = letters[counter % letters.length];
    counter++;
    return `${a}${b}`;
  }

  async function getOrCreate(db: ReturnType<typeof getDb>, name: string): Promise<number> {
    if (cache[name]) return cache[name];

    const existing = await db.query.countries.findFirst({
      where: eq(schema.countries.name, name),
      columns: { id: true },
    });
    if (existing) { cache[name] = existing.id; return existing.id; }

    let isoCode = Object.entries(KNOWN_ISO).find(([k]) => name.includes(k))?.[1] ?? nextCode();

    while (true) {
      try {
        const [rec] = await db
          .insert(schema.countries)
          .values({ name, isoCode, region: inferRegion(name) })
          .returning({ id: schema.countries.id });
        cache[name] = rec.id;
        return rec.id;
      } catch (err: unknown) {
        const msg = String(err);
        if (msg.includes('iso_code')) { isoCode = nextCode(); continue; }
        const found = await db.query.countries.findFirst({
          where: eq(schema.countries.name, name), columns: { id: true },
        });
        if (found) { cache[name] = found.id; return found.id; }
        throw err;
      }
    }
  }

  return { getOrCreate };
}

function makeFieldCache() {
  const cache: Record<string, number> = {};

  async function getOrCreate(db: ReturnType<typeof getDb>, name: string): Promise<number> {
    const t = name.trim();
    if (!t) return -1;
    if (cache[t]) return cache[t];
    const slug = toSlug(t);
    const [rec] = await db
      .insert(schema.fieldsOfStudy)
      .values({ name: t, slug })
      .onConflictDoUpdate({ target: schema.fieldsOfStudy.slug, set: { name: t } })
      .returning({ id: schema.fieldsOfStudy.id });
    cache[t] = rec.id;
    return rec.id;
  }

  return { getOrCreate };
}

// ── Core upsert ───────────────────────────────────────────────────────────────

export async function syncScholarshipsFromCsv(csvText: string): Promise<SyncResult> {
  const db = getDb();
  const { data: rows } = Papa.parse<Record<string, string>>(csvText, {
    header: true, skipEmptyLines: true,
  });

  const countryCache = makeCountryCache();
  const fieldCache = makeFieldCache();
  const errors: string[] = [];
  let upserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = row['Scholarship']?.trim();
    if (!name) { skipped++; continue; }

    try {
      const countryId = await countryCache.getOrCreate(db, row['Country']?.trim() || 'Various');
      const fundingRaw = row['Funding']?.trim() || '';

      const [rec] = await db
        .insert(schema.scholarships)
        .values({
          slug: toSlug(name),
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

      const fieldNames = (row['Field'] || '').split(',').map(f => f.trim()).filter(Boolean);
      for (const fieldName of fieldNames) {
        const fieldId = await fieldCache.getOrCreate(db, fieldName);
        if (fieldId < 0) continue;
        await db
          .insert(schema.scholarshipFields)
          .values({ scholarshipId: rec.id, fieldId })
          .onConflictDoNothing();
      }

      upserted++;
    } catch (err) {
      errors.push(`${name}: ${String(err).substring(0, 120)}`);
      skipped++;
    }
  }

  return { upserted, skipped, total: rows.length, errors };
}

export async function fetchAndSyncFromGitHub(): Promise<SyncResult> {
  const res = await fetch(GITHUB_CSV_URL, { cache: 'no-store' });
  if (!res.ok) throw new Error(`GitHub fetch failed: HTTP ${res.status}`);
  const csvText = await res.text();
  return syncScholarshipsFromCsv(csvText);
}
