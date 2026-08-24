/**
 * Verification status from the CSV.
 *
 * Both write paths -- the CLI importer (`scripts/import-scholarships-csv.ts`)
 * and the admin "Sync from GitHub" action (`sync-scholarships.ts`) -- used to
 * hardcode `isVerified: true` for every row. The site's front page promises
 * "human-verified against official sources" and renders a green badge plus a
 * "{n}% human-verified data" statistic off that flag, so stamping it
 * unconditionally made both claims decoration rather than data: 100% verified
 * by construction, with `verified_at` and `verified_source` never populated at
 * all.
 *
 * Deliberately asymmetric about failure. An unrecognised value is an error --
 * silently guessing is how the original bug read -- but an absent or empty
 * value resolves to *unverified*, so the fail-safe direction is the humbler
 * claim rather than the stronger one.
 *
 * Kept dependency-free so the standalone script can import it without pulling
 * in the app's module aliases.
 */

export interface VerificationFields {
  isVerified: boolean;
  verifiedAt: Date | null;
  verifiedSource: string;
}

export const VERIFIED_COLUMN = 'Verified?';
export const VERIFIED_ON_COLUMN = 'Verified On';
export const VERIFIED_VIA_COLUMN = 'Verified Via';

const TRUTHY = new Set(['yes', 'y', 'true', 'verified']);
const FALSY = new Set(['no', 'n', 'false', 'unverified', 'pending']);

export class VerificationParseError extends Error {}

/**
 * Parse `Verified?` into a boolean. Blank or missing means unverified;
 * anything unrecognised throws so the caller can refuse the whole import.
 */
export function parseVerified(raw: string | undefined): boolean {
  const value = (raw ?? '').trim().toLowerCase();
  if (!value) return false;
  if (TRUTHY.has(value)) return true;
  if (FALSY.has(value)) return false;
  throw new VerificationParseError(
    `unrecognised "${VERIFIED_COLUMN}" value ${JSON.stringify(raw)} ` +
    `- use one of: ${[...TRUTHY, ...FALSY].join(', ')}`,
  );
}

/**
 * Parse `Verified On` as a calendar date. Stored at UTC midnight because the
 * column records a day, not an instant. Blank is allowed -- a row can be
 * verified without the date having been written down.
 */
export function parseVerifiedAt(raw: string | undefined): Date | null {
  const value = (raw ?? '').trim();
  if (!value) return null;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new VerificationParseError(
      `"${VERIFIED_ON_COLUMN}" must be YYYY-MM-DD, got ${JSON.stringify(raw)}`,
    );
  }

  const [, y, m, d] = match;
  const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  // Rejects 2026-02-31 and friends, which Date.UTC would silently roll over.
  if (
    date.getUTCFullYear() !== Number(y) ||
    date.getUTCMonth() !== Number(m) - 1 ||
    date.getUTCDate() !== Number(d)
  ) {
    throw new VerificationParseError(
      `"${VERIFIED_ON_COLUMN}" is not a real date: ${JSON.stringify(raw)}`,
    );
  }
  return date;
}

/** Resolve all three verification columns for one CSV row. */
export function parseVerification(row: Record<string, string>): VerificationFields {
  const isVerified = parseVerified(row[VERIFIED_COLUMN]);
  const verifiedAt = parseVerifiedAt(row[VERIFIED_ON_COLUMN]);
  const verifiedSource = (row[VERIFIED_VIA_COLUMN] ?? '').trim();

  // A date or source without the flag is a contradiction worth surfacing: it
  // means someone recorded evidence and left the row marked unverified.
  if (!isVerified && (verifiedAt || verifiedSource)) {
    throw new VerificationParseError(
      `"${VERIFIED_COLUMN}" is not set, but "${VERIFIED_ON_COLUMN}"/` +
      `"${VERIFIED_VIA_COLUMN}" carry a value - set "${VERIFIED_COLUMN}" to Yes ` +
      `or clear the evidence columns`,
    );
  }

  return { isVerified, verifiedAt, verifiedSource };
}
