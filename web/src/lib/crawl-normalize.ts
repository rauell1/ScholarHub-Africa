/**
 * Pure helpers that turn the crawler's LLM output into a row the
 * `scholarships` table will accept. Kept free of DB/network imports so they
 * can be unit-tested (crawl-normalize.test.ts).
 *
 * Every varchar column has a length cap and `score` is a smallint, so an
 * over-long name or a "score": "85/100" string from the model used to make
 * the INSERT throw and the whole Inngest step burn its retries.
 */

/** JS mirror of MASTERS_PROGRAMME_PATTERN in queries.ts. */
const MASTERS_RE =
  /master|postgraduate|\b(msc|m\.sc|ma|mba|llm|mphil|mres|meng|mph|mpa|mpp|mfa|med|mst|mcomm|m\.a)\b/i;

export function isMastersProgramme(programme: string): boolean {
  return MASTERS_RE.test(programme);
}

/** Parse model output that may be wrapped in ```json fences or prose. */
export function parseModelJson(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  const text = raw.trim();
  const candidates = [text];
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) candidates.push(fenced[1]);
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end > start) candidates.push(text.slice(start, end + 1));
  for (const candidate of candidates) {
    try {
      const parsed: unknown = JSON.parse(candidate);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      // try the next candidate
    }
  }
  return {};
}

export function str(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

export function intOrNull(value: unknown, min: number, max: number): number | null {
  const n = typeof value === 'number' ? value : parseInt(String(value ?? ''), 10);
  if (!Number.isFinite(n)) return null;
  return Math.min(Math.max(Math.round(n), min), max);
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 200)
    .replace(/-$/, '');
}

/** Accept only a real calendar date in YYYY-MM-DD form. */
export function isoDateOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const date = new Date(`${match[0]}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== match[0]) return null;
  return match[0];
}

/**
 * Status from the extracted dates, using the directory's vocabulary
 * (lib/labels.ts STATUS_LABELS). Without a deadline we cannot claim the
 * scholarship is open, so it stays 'unknown'.
 */
export function statusFromDates(
  deadline: string | null,
  opensOn: string | null,
  today: string,
): string {
  if (deadline && deadline < today) return 'closed';
  if (opensOn && opensOn > today) return 'opening_soon';
  if (deadline) return 'open_now';
  return 'unknown';
}
