/**
 * Deadline parsing for the CSV import paths.
 *
 * Replaces a local `parseDeadline` that was duplicated verbatim in
 * scripts/import-scholarships-csv.ts and lib/sync-scholarships.ts, and carried
 * two defects:
 *
 * 1. It matched only "13 Oct 2026" form, so every ISO-dated row -- 58 of 158 at
 *    the time of writing, including Gates Cambridge (2026-10-13) and the
 *    Commonwealth Shared Scholarships -- stored deadline_date = NULL despite
 *    having an exact date. Those rows rendered no countdown, no "N days
 *    remaining", and could not appear on the calendar or sort by deadline.
 *
 * 2. It built the date with `new Date("Oct 13 2026")`, which is parsed at local
 *    midnight, then took .toISOString() -- shifting the day backwards in any
 *    timezone ahead of UTC. In Africa/Nairobi (UTC+3) "13 Oct 2026" became
 *    2026-10-12. Correct on a UTC CI runner, silently wrong when run locally.
 *
 * Dates here are calendar days, so everything is computed from integer
 * components through Date.UTC and read back with getUTC*. No local-time
 * parsing is involved at any point.
 *
 * Kept dependency-free so the standalone import script can import it without
 * pulling in the app's module aliases.
 */

const ISO_DATE = /\b(\d{4})-(\d{2})-(\d{2})\b/;

const TEXT_DATE = /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\.?\s+(\d{4})\b/i;

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/**
 * Format y/m/d as YYYY-MM-DD, or null when the triple is not a real calendar
 * date. Date.UTC happily rolls 2026-02-31 over to 3 March, so the round-trip
 * check is what rejects it.
 */
function toIsoDate(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Extract a calendar date from a free-text Deadline cell.
 *
 * Accepts an exact ISO date ("2026-10-13") or a day-month-year phrase
 * ("31 Oct 2026", "~31 Oct 2026 (verify at daad.de)"). Returns null for
 * anything without a specific day -- "Check website", "~Feb 2027",
 * "Dec 2026 - Jan 2027" -- since a month or a range is not a deadline the
 * site can count down to. ISO wins when a cell somehow carries both.
 */
export function parseDeadline(raw: string | null | undefined): string | null {
  const value = (raw ?? '').trim();
  if (!value) return null;

  const iso = ISO_DATE.exec(value);
  if (iso) {
    const parsed = toIsoDate(Number(iso[1]), Number(iso[2]), Number(iso[3]));
    if (parsed) return parsed;
  }

  const text = TEXT_DATE.exec(value);
  if (text) {
    const month = MONTHS[text[2].slice(0, 3).toLowerCase()];
    if (month) {
      const parsed = toIsoDate(Number(text[3]), month, Number(text[1]));
      if (parsed) return parsed;
    }
  }

  return null;
}
