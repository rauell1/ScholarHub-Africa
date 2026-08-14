import { describe, it, expect } from 'vitest';
import {
  toDateIso,
  addDays,
  daysBetween,
  daysUntilDeadline,
  deadlineState,
  scoreLabel,
  deadlineDisplay,
  formatDateEat,
  eatToday,
} from './dates';

describe('toDateIso', () => {
  it('passes through a string', () => {
    expect(toDateIso('2025-09-30')).toBe('2025-09-30');
  });
  it('converts a Date to ISO string', () => {
    expect(toDateIso(new Date('2025-01-15T12:00:00Z'))).toBe('2025-01-15');
  });
  it('returns null for null', () => {
    expect(toDateIso(null)).toBeNull();
  });
  it('returns null for undefined', () => {
    expect(toDateIso(undefined)).toBeNull();
  });
});

describe('addDays', () => {
  it('adds positive days', () => {
    expect(addDays('2025-01-01', 5)).toBe('2025-01-06');
  });
  it('handles month rollover', () => {
    expect(addDays('2025-01-30', 3)).toBe('2025-02-02');
  });
  it('handles negative days', () => {
    expect(addDays('2025-03-01', -1)).toBe('2025-02-28');
  });
  it('adding zero returns same date', () => {
    expect(addDays('2025-06-15', 0)).toBe('2025-06-15');
  });
});

describe('daysBetween', () => {
  it('returns 0 for same dates', () => {
    expect(daysBetween('2025-06-01', '2025-06-01')).toBe(0);
  });
  it('returns positive when fromIso is after toIso', () => {
    expect(daysBetween('2025-06-10', '2025-06-01')).toBe(9);
  });
  it('returns negative when fromIso is before toIso', () => {
    expect(daysBetween('2025-06-01', '2025-06-10')).toBe(-9);
  });
});

describe('daysUntilDeadline', () => {
  it('returns null for null input', () => {
    expect(daysUntilDeadline(null)).toBeNull();
  });
  it('returns null for undefined input', () => {
    expect(daysUntilDeadline(undefined)).toBeNull();
  });
  it('returns 0 or more for future dates', () => {
    const future = addDays(eatToday(), 10);
    expect(daysUntilDeadline(future)).toBeGreaterThanOrEqual(0);
  });
  it('returns 0 for past dates (floored)', () => {
    const past = addDays(eatToday(), -5);
    expect(daysUntilDeadline(past)).toBe(0);
  });
});

describe('deadlineState', () => {
  it('returns none for null', () => {
    expect(deadlineState(null)).toBe('none');
  });
  it('returns closed for past dates', () => {
    const past = addDays(eatToday(), -1);
    expect(deadlineState(past)).toBe('closed');
  });
  it('returns urgent for deadlines within 7 days', () => {
    const soon = addDays(eatToday(), 3);
    expect(deadlineState(soon)).toBe('urgent');
  });
  it('returns soon for deadlines within 30 days', () => {
    const mid = addDays(eatToday(), 20);
    expect(deadlineState(mid)).toBe('soon');
  });
  it('returns normal for deadlines beyond 30 days', () => {
    const far = addDays(eatToday(), 60);
    expect(deadlineState(far)).toBe('normal');
  });
});

describe('scoreLabel', () => {
  it.each([
    [95, 'Outstanding'],
    [87, 'Excellent'],
    [82, 'Very Strong'],
    [76, 'Good'],
    [65, 'Achievable'],
    [40, 'Stretch'],
  ])('score %i → %s', (score, label) => {
    expect(scoreLabel(score)).toBe(label);
  });
});

describe('deadlineDisplay', () => {
  it('returns "No deadline set" for null', () => {
    expect(deadlineDisplay(null).text).toBe('No deadline set');
  });
  it('returns CLOSED for a past deadline', () => {
    const past = addDays(eatToday(), -2);
    expect(deadlineDisplay(past).text).toBe('CLOSED');
  });
  it('includes "d left" for urgent deadlines', () => {
    const soon = addDays(eatToday(), 3);
    expect(deadlineDisplay(soon).text).toMatch(/d left$/);
  });
});

describe('formatDateEat', () => {
  it('returns empty string for null', () => {
    expect(formatDateEat(null)).toBe('');
  });
  it('formats a date string', () => {
    const result = formatDateEat('2025-06-15');
    expect(result).toMatch(/2025/);
  });
  it('formats a Date object', () => {
    const result = formatDateEat(new Date('2025-12-25T00:00:00Z'));
    expect(result).toMatch(/2025/);
  });
});
