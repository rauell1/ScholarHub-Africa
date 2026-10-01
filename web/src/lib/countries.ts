import { sql } from 'drizzle-orm';

import { countries } from '@/db/schema';
import type { Db } from './db';

/**
 * Find-or-create a country by name for the AI ingestion pipelines.
 *
 * `countries.iso_code` is UNIQUE. Both pipelines used to insert every new
 * country with iso_code 'UN', so the first one succeeded and every later new
 * country hit a unique violation the `ON CONFLICT (name)` clause does not
 * cover - the save step threw and the scholarship was never stored.
 */
const KNOWN_ISO: Record<string, string> = {
  'united kingdom': 'GB', uk: 'GB', 'united states': 'US', usa: 'US', germany: 'DE',
  france: 'FR', netherlands: 'NL', sweden: 'SE', hungary: 'HU', spain: 'ES', italy: 'IT',
  belgium: 'BE', austria: 'AT', switzerland: 'CH', ireland: 'IE', denmark: 'DK',
  norway: 'NO', finland: 'FI', portugal: 'PT', poland: 'PL', turkey: 'TR', 'türkiye': 'TR',
  'czech republic': 'CZ', canada: 'CA', australia: 'AU', 'new zealand': 'NZ', japan: 'JP',
  china: 'CN', 'south korea': 'KR', korea: 'KR', taiwan: 'TW', india: 'IN', singapore: 'SG',
  malaysia: 'MY', thailand: 'TH', 'united arab emirates': 'AE', qatar: 'QA',
  'saudi arabia': 'SA', israel: 'IL', russia: 'RU', brazil: 'BR', mexico: 'MX',
  kenya: 'KE', nigeria: 'NG', 'south africa': 'ZA', ghana: 'GH', ethiopia: 'ET',
  egypt: 'EG', morocco: 'MA', rwanda: 'RW', tanzania: 'TZ', uganda: 'UG', senegal: 'SN',
  tunisia: 'TN', algeria: 'DZ', mauritius: 'MU', botswana: 'BW', zambia: 'ZM',
};

const REGION_BY_ISO: Record<string, string> = {
  GB: 'Europe', DE: 'Europe', FR: 'Europe', NL: 'Europe', SE: 'Europe', HU: 'Europe',
  ES: 'Europe', IT: 'Europe', BE: 'Europe', AT: 'Europe', CH: 'Europe', IE: 'Europe',
  DK: 'Europe', NO: 'Europe', FI: 'Europe', PT: 'Europe', PL: 'Europe', TR: 'Europe',
  CZ: 'Europe', RU: 'Europe', US: 'Americas', CA: 'Americas', BR: 'Americas', MX: 'Americas',
  AU: 'Oceania', NZ: 'Oceania', JP: 'Asia', CN: 'Asia', KR: 'Asia', TW: 'Asia', IN: 'Asia',
  SG: 'Asia', MY: 'Asia', TH: 'Asia', AE: 'Asia', QA: 'Asia', SA: 'Asia', IL: 'Asia',
  KE: 'Africa', NG: 'Africa', ZA: 'Africa', GH: 'Africa', ET: 'Africa', EG: 'Africa',
  MA: 'Africa', RW: 'Africa', TZ: 'Africa', UG: 'Africa', SN: 'Africa', TN: 'Africa',
  DZ: 'Africa', MU: 'Africa', BW: 'Africa', ZM: 'Africa',
};

/** ISO 3166 user-assigned codes - never collide with a real country. */
const FALLBACK_CODES = [
  ...'MNOPQRSTUVWXYZ'.split('').map((c) => `Q${c}`),
  ...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((c) => `X${c}`),
];

function flagFor(iso: string): string {
  if (!/^[A-Z]{2}$/.test(iso) || !REGION_BY_ISO[iso]) return '';
  return String.fromCodePoint(...[...iso].map((c) => 0x1f1a5 + c.charCodeAt(0)));
}

export async function resolveCountryId(db: Db, rawName: string): Promise<number> {
  const name = (rawName || 'Various').trim().slice(0, 100) || 'Various';
  const lookup = async () =>
    (
      await db
        .select({ id: countries.id })
        .from(countries)
        .where(sql`lower(${countries.name}) = lower(${name})`)
        .limit(1)
    )[0]?.id;

  const existing = await lookup();
  if (existing) return existing;

  const known = KNOWN_ISO[name.toLowerCase()];
  const used = new Set(
    (await db.select({ iso: countries.isoCode }).from(countries)).map((r) => r.iso),
  );
  const candidates = [
    ...(known && !used.has(known) ? [known] : []),
    ...FALLBACK_CODES.filter((c) => !used.has(c)),
  ];

  for (const isoCode of candidates.slice(0, 5)) {
    const inserted = await db
      .insert(countries)
      .values({
        name,
        isoCode,
        flagEmoji: flagFor(isoCode),
        region: REGION_BY_ISO[isoCode] ?? 'Unknown',
      })
      .onConflictDoNothing()
      .returning({ id: countries.id });
    if (inserted[0]) return inserted[0].id;
    // Conflict: either a concurrent run created this name, or the code was taken.
    const raced = await lookup();
    if (raced) return raced;
  }
  throw new Error(`Could not allocate an iso_code for country "${name}"`);
}
