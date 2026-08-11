/**
 * Query-param parsing for the scholarship API (DRF/django-filter parity).
 *
 * Matches the query surface of apps/scholarships/filters.py + api_views.py:
 *   ?country=DE,FR&field=water,energy&funding=full&eligibility=CE
 *    &status=open_now&min_score=80&max_score=95
 *    &deadline_before=2027-01-01&deadline_after=2026-09-01
 *    &deadline_in_next=30&is_open=true&q=daad&ordering=deadline
 */
import { z } from 'zod';

import type { ScholarshipFilters } from './queries';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const querySchema = z.object({
  country: z.string().optional(),
  field: z.string().optional(),
  funding: z.string().optional(),
  eligibility: z.string().optional(),
  status: z.string().optional(),
  min_score: z.coerce.number().int().optional(),
  max_score: z.coerce.number().int().optional(),
  deadline_before: z.string().regex(dateRegex).optional(),
  deadline_after: z.string().regex(dateRegex).optional(),
  deadline_in_next: z.coerce.number().int().nonnegative().optional(),
  is_open: z.enum(['true', 'false', '1', '0']).optional(),
  q: z.string().optional(),
  search: z.string().optional(),
  ordering: z.string().optional(),
});

const csv = (value: string | undefined): string[] | undefined =>
  value
    ?.split(',')
    .map((v) => v.trim())
    .filter(Boolean) || undefined;

/**
 * Parse a URLSearchParams object into ScholarshipFilters.
 * Throws ZodError on invalid values (route handlers map to 400).
 */
export function parseScholarshipFilters(params: URLSearchParams): ScholarshipFilters {
  const raw = querySchema.parse(Object.fromEntries(params.entries()));

  const filters: ScholarshipFilters = {
    country: csv(raw.country),
    field: csv(raw.field),
    funding: raw.funding || undefined,
    eligibility: raw.eligibility || undefined,
    status: csv(raw.status),
    minScore: raw.min_score,
    maxScore: raw.max_score,
    deadlineBefore: raw.deadline_before,
    deadlineAfter: raw.deadline_after,
    deadlineInNext: raw.deadline_in_next,
    isOpen: raw.is_open ? raw.is_open === 'true' || raw.is_open === '1' : undefined,
    q: raw.q ?? raw.search ?? undefined,
    ordering: raw.ordering || undefined,
  };
  return filters;
}
