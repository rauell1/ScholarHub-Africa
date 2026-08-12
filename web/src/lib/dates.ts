/**
 * Date helpers with Django parity (System Design v1.0 §13).
 *
 * Django computes deadline math in Africa/Nairobi (EAT, UTC+3, no DST) via
 * `timezone.localdate()`. These helpers reproduce the same day boundaries so
 * `days_until_deadline` / `deadline_state` behave identically server-side.
 */

const EAT_TIME_ZONE = 'Africa/Nairobi';

const eatDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: EAT_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Today's date in EAT as YYYY-MM-DD. */
export function eatToday(): string {
  return eatDateFormatter.format(new Date());
}

/**
 * Normalize a driver-returned date to YYYY-MM-DD. Neon (drizzle date mode
 * 'string') returns strings; some drivers/emulators return Date objects -
 * this keeps both working without leaking driver details into serialization.
 */
export function toDateIso(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return value;
}

/** Add whole days to a YYYY-MM-DD date (pure calendar math, no TZ drift). */
export function addDays(dateIso: string, days: number): string {
  const [y, m, d] = dateIso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

/** Whole days from `toIso` until `fromIso` (negative when fromIso is past). */
export function daysBetween(fromIso: string, toIso: string): number {
  const [y1, m1, d1] = fromIso.split('-').map(Number);
  const [y2, m2, d2] = toIso.split('-').map(Number);
  return Math.round(
    (Date.UTC(y1, m1 - 1, d1) - Date.UTC(y2, m2 - 1, d2)) / 86_400_000,
  );
}

/**
 * Days until the deadline (Django `Scholarship.days_until_deadline`):
 * None when unset, floored at 0 for past deadlines.
 */
export function daysUntilDeadline(deadline: string | Date | null | undefined): number | null {
  const iso = toDateIso(deadline);
  if (!iso) return null;
  return Math.max(daysBetween(iso, eatToday()), 0);
}

/**
 * Urgency bucket (Django `Scholarship.deadline_state`) used by the
 * countdown badge in Phase 4.
 */
export function deadlineState(
  deadline: string | Date | null | undefined,
): 'none' | 'closed' | 'urgent' | 'soon' | 'normal' {
  const iso = toDateIso(deadline);
  if (!iso) return 'none';
  const delta = daysBetween(iso, eatToday());
  if (delta < 0) return 'closed';
  if (delta <= 7) return 'urgent';
  if (delta <= 30) return 'soon';
  return 'normal';
}

/** Score badge label (Django `Scholarship.score_label`). */
export function scoreLabel(score: number): string {
  if (score >= 90) return 'Outstanding';
  if (score >= 85) return 'Excellent';
  if (score >= 80) return 'Very Strong';
  if (score >= 74) return 'Good';
  if (score >= 60) return 'Achievable';
  return 'Stretch';
}

/**
 * Server-rendered deadline badge text + classes (port of the Django
 * deadline_badge.html + countdown.js + deadline_class tag). Text is
 * rendered server-side so SEO bots see real content without JS.
 */
export function deadlineDisplay(
  deadline: string | Date | null | undefined,
): { text: string; className: string } {
  const iso = toDateIso(deadline);
  if (!iso) return { text: 'No deadline set', className: 'text-sm text-muted-foreground' };
  const state = deadlineState(iso);
  const days = daysBetween(iso, eatToday());
  if (state === 'closed') {
    return { text: 'CLOSED', className: 'deadline-badge font-semibold text-crimson font-bold' };
  }
  if (state === 'urgent') {
    return {
      text: `${days}d left`,
      className: 'deadline-badge font-semibold text-crimson font-bold animate-pulse',
    };
  }
  if (state === 'soon') {
    return {
      text: `${days} days`,
      className: 'deadline-badge font-semibold text-amber font-semibold',
    };
  }
  return {
    text: `${days} days`,
    className: 'deadline-badge font-semibold text-accent font-semibold',
  };
}

/** Format a timestamp like Django's `date:'d M Y'` in Africa/Nairobi. */
export function formatDateEat(value: Date | string | null | undefined): string {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: EAT_TIME_ZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}
