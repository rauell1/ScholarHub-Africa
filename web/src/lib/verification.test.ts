import { describe, expect, it } from 'vitest';

import {
  VerificationParseError,
  parseVerification,
  parseVerified,
  parseVerifiedAt,
} from './verification';

const row = (over: Record<string, string> = {}) => ({
  Scholarship: 'Test Scholarship',
  'Verified?': '',
  'Verified On': '',
  'Verified Via': '',
  ...over,
});

describe('parseVerified', () => {
  it.each(['Yes', 'yes', 'YES', ' y ', 'true', 'Verified'])('accepts %s as verified', (v) => {
    expect(parseVerified(v)).toBe(true);
  });

  it.each(['No', 'no', 'N', 'false', 'unverified', 'pending'])('accepts %s as unverified', (v) => {
    expect(parseVerified(v)).toBe(false);
  });

  it('treats blank and missing as unverified, not verified', () => {
    // Fail-safe direction: absence must not grant the badge, which is how the
    // hardcoded `isVerified: true` behaved.
    expect(parseVerified('')).toBe(false);
    expect(parseVerified('   ')).toBe(false);
    expect(parseVerified(undefined)).toBe(false);
  });

  it('throws on an unrecognised value rather than guessing', () => {
    expect(() => parseVerified('maybe')).toThrow(VerificationParseError);
    expect(() => parseVerified('1')).toThrow(VerificationParseError);
  });
});

describe('parseVerifiedAt', () => {
  it('parses YYYY-MM-DD at UTC midnight', () => {
    expect(parseVerifiedAt('2026-08-24')?.toISOString()).toBe('2026-08-24T00:00:00.000Z');
  });

  it('allows blank — a row can be verified without the date recorded', () => {
    expect(parseVerifiedAt('')).toBeNull();
    expect(parseVerifiedAt(undefined)).toBeNull();
  });

  it('rejects other formats', () => {
    expect(() => parseVerifiedAt('24 Aug 2026')).toThrow(VerificationParseError);
    expect(() => parseVerifiedAt('2026/08/24')).toThrow(VerificationParseError);
  });

  it('rejects a date that does not exist', () => {
    // Date.UTC would roll this over to 3 March rather than complain.
    expect(() => parseVerifiedAt('2026-02-31')).toThrow(VerificationParseError);
    expect(() => parseVerifiedAt('2026-13-01')).toThrow(VerificationParseError);
  });
});

describe('parseVerification', () => {
  it('maps a verified row with full evidence', () => {
    const result = parseVerification(
      row({ 'Verified?': 'Yes', 'Verified On': '2026-08-12', 'Verified Via': 'daad.de' }),
    );
    expect(result.isVerified).toBe(true);
    expect(result.verifiedAt?.toISOString()).toBe('2026-08-12T00:00:00.000Z');
    expect(result.verifiedSource).toBe('daad.de');
  });

  it('maps a verified row with no evidence recorded', () => {
    // The 157 curated rows: verified, but the date and source were never
    // written down, so they stay empty rather than being invented.
    const result = parseVerification(row({ 'Verified?': 'Yes' }));
    expect(result).toEqual({ isVerified: true, verifiedAt: null, verifiedSource: '' });
  });

  it('maps an unverified row', () => {
    // Unicaf: unicaf.org was unreachable, so the badge must not claim a check.
    const result = parseVerification(row({ 'Verified?': 'No' }));
    expect(result).toEqual({ isVerified: false, verifiedAt: null, verifiedSource: '' });
  });

  it('rejects evidence attached to an unverified row', () => {
    // A contradiction worth surfacing: someone recorded a source and left the
    // flag off, so the site would show amber despite the row being checked.
    expect(() => parseVerification(row({ 'Verified?': 'No', 'Verified Via': 'daad.de' })))
      .toThrow(VerificationParseError);
    expect(() => parseVerification(row({ 'Verified?': '', 'Verified On': '2026-08-12' })))
      .toThrow(VerificationParseError);
  });

  it('defaults a row with no verification columns at all to unverified', () => {
    expect(parseVerification({ Scholarship: 'Legacy row' })).toEqual({
      isVerified: false,
      verifiedAt: null,
      verifiedSource: '',
    });
  });
});
