import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { parseScholarshipFilters } from '@/lib/filters';
import { apiError, isDbUnavailable, PUBLIC_CACHE } from '@/lib/http';
import { queryScholarships } from '@/lib/queries';

/**
 * GET /api/v1/scholarships/ - DRF ScholarshipViewSet.list parity.
 * Filterable, searchable; plain-array response (DRF PageNumberPagination is
 * disabled here because PAGE_SIZE is unset, so no pagination wrapper).
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  let filters;
  try {
    filters = parseScholarshipFilters(request.nextUrl.searchParams);
  } catch (err) {
    if (err instanceof ZodError) {
      return apiError('Invalid query parameters.', 400);
    }
    throw err;
  }

  try {
    const results = await queryScholarships(filters);
    return NextResponse.json(results, { headers: PUBLIC_CACHE });
  } catch (err) {
    console.error('[api/v1/scholarships]', err);
    return apiError(
      isDbUnavailable(err) ? 'Database is not configured.' : 'Internal server error.',
      isDbUnavailable(err) ? 503 : 500,
    );
  }
}
