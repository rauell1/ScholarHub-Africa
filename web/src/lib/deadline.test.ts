import { describe, expect, it } from 'vitest';

import { parseDeadline } from './deadline';

describe('parseDeadline — ISO dates (the 58 rows that were silently lost)', () => {
  it.each([
    ['2026-10-13', '2026-10-13'], // Gates Cambridge
    ['2026-11-13', '2026-11-13'], // Commonwealth Shared Scholarship
    ['2027-02-15', '2027-02-15'], // Türkiye Bursları
    ['2026-09-30', '2026-09-30'],
  ])('parses %s', (input, expected) => {
    expect(parseDeadline(input)).toBe(expected);
  });

  it('finds an ISO date embedded in surrounding text', () => {
    expect(parseDeadline('2026-10-13 (confirm on the official site)')).toBe('2026-10-13');
  });
});

describe('parseDeadline — day-month-year text', () => {
  it.each([
    ['31 Oct 2026', '2026-10-31'],
    ['~31 Oct 2026 (verify at daad.de)', '2026-10-31'], // DAAD EPOS
    ['1 Jan 2027', '2027-01-01'],
    ['9 Sept 2026', '2026-09-09'],
    ['15 December 2026', '2026-12-15'],
  ])('parses %s', (input, expected) => {
    expect(parseDeadline(input)).toBe(expected);
  });
});

describe('parseDeadline — no specific day means no deadline', () => {
  it.each([
    'Check website',
    '~Feb 2027',
    'Dec 2026 - Jan 2027 (course-dependent)',
    'Autumn 2026 (exact date TBC)',
    'Varies by partner university (typically Oct-Jan for Sep start)',
    'TBD – OFID paused programme; monitor opecfund.org',
    'Check website (rolling intakes - see notes)', // the Unicaf guard
    '',
  ])('returns null for %s', (input) => {
    expect(parseDeadline(input)).toBeNull();
  });

  it('returns null for null and undefined', () => {
    expect(parseDeadline(null)).toBeNull();
    expect(parseDeadline(undefined)).toBeNull();
  });
});

describe('parseDeadline — rejects impossible dates', () => {
  it.each(['2026-02-31', '2026-13-01', '2026-00-10', '31 Feb 2026'])(
    'returns null for %s',
    (input) => {
      // Date.UTC would roll 2026-02-31 over to 3 March rather than complain.
      expect(parseDeadline(input)).toBeNull();
    },
  );
});

describe('parseDeadline — timezone independence', () => {
  it('gives the same day regardless of the host timezone', () => {
    // The previous implementation used `new Date("Oct 13 2026")` (local
    // midnight) then .toISOString(), which shifted the day back in any zone
    // ahead of UTC: in Africa/Nairobi "13 Oct 2026" became 2026-10-12.
    const original = process.env.TZ;
    const results = new Set<string | null>();
    for (const tz of ['UTC', 'Africa/Nairobi', 'Pacific/Kiritimati', 'America/Los_Angeles']) {
      process.env.TZ = tz;
      results.add(parseDeadline('13 Oct 2026'));
      results.add(parseDeadline('2026-10-13'));
    }
    process.env.TZ = original;
    expect([...results]).toEqual(['2026-10-13']);
  });
});
