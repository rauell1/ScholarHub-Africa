import { describe, expect, it } from 'vitest';

import {
  intOrNull,
  isMastersProgramme,
  isoDateOrNull,
  parseModelJson,
  slugify,
  statusFromDates,
  str,
} from './crawl-normalize';

describe('parseModelJson', () => {
  it('parses plain JSON', () => {
    expect(parseModelJson('{"name":"DAAD"}')).toEqual({ name: 'DAAD' });
  });
  it('parses fenced JSON', () => {
    expect(parseModelJson('```json\n{"is_scholarship":true}\n```')).toEqual({ is_scholarship: true });
  });
  it('parses JSON surrounded by prose', () => {
    expect(parseModelJson('Here you go: {"a":1} hope it helps')).toEqual({ a: 1 });
  });
  it('returns {} for garbage', () => {
    expect(parseModelJson('not json')).toEqual({});
    expect(parseModelJson(null)).toEqual({});
    expect(parseModelJson('[1,2]')).toEqual({});
  });
});

describe('isMastersProgramme', () => {
  it.each([
    'MSc Renewable Energy Management',
    "Master's in Public Policy",
    'Any eligible 1-year UK LLM',
    'MBA / MSc Business',
    'Any postgraduate degree at Oxford',
    'MA Education',
  ])('accepts %s', (p) => expect(isMastersProgramme(p)).toBe(true));

  it.each(['PhD fellowship / research visit', 'Undergraduate bachelor degree', 'Smart grid management'])(
    'rejects %s',
    (p) => expect(isMastersProgramme(p)).toBe(false),
  );
});

describe('field coercion', () => {
  it('truncates strings to the column cap', () => {
    expect(str('x'.repeat(400), 300)).toHaveLength(300);
    expect(str(42, 10)).toBe('');
  });
  it('clamps ints and rejects non-numbers', () => {
    expect(intOrNull('85/100', 0, 100)).toBe(85);
    expect(intOrNull(250, 0, 100)).toBe(100);
    expect(intOrNull('n/a', 0, 100)).toBeNull();
    expect(intOrNull(null, 0, 100)).toBeNull();
  });
  it('slugifies within 200 chars without a trailing dash', () => {
    expect(slugify('Chevening Scholarship 2026/27!')).toBe('chevening-scholarship-2026-27');
    const long = slugify(`${'a'.repeat(199)} b`);
    expect(long.length).toBeLessThanOrEqual(200);
    expect(long.endsWith('-')).toBe(false);
  });
});

describe('dates and status', () => {
  it('accepts only real ISO dates', () => {
    expect(isoDateOrNull('2026-11-05')).toBe('2026-11-05');
    expect(isoDateOrNull('2026-02-30')).toBeNull();
    expect(isoDateOrNull('5 November 2026')).toBeNull();
    expect(isoDateOrNull(null)).toBeNull();
  });
  it('derives status from deadline and opening date', () => {
    const today = '2026-10-01';
    expect(statusFromDates('2026-09-01', null, today)).toBe('closed');
    expect(statusFromDates('2027-01-15', '2026-11-01', today)).toBe('opening_soon');
    expect(statusFromDates('2027-01-15', '2026-09-01', today)).toBe('open_now');
    expect(statusFromDates(null, null, today)).toBe('unknown');
  });
});
