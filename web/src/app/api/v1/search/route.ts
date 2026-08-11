import { NextRequest, NextResponse } from 'next/server';

import { apiError, isDbUnavailable, PUBLIC_CACHE } from '@/lib/http';
import { searchScholarships } from '@/lib/queries';

/**
 * GET /api/v1/search/?q=<query> - DRF SearchView parity.
 * Returns { query, results } with the top 10 ranked hits
 * (weighted full-text search, rank >= 0.001).
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  if (!query) {
    return NextResponse.json({ query: '', results: [] }, { headers: PUBLIC_CACHE });
  }

  try {
    const results = await searchScholarships(query);
    return NextResponse.json({ query, results }, { headers: PUBLIC_CACHE });
  } catch (err) {
    console.error('[api/v1/search]', err);
    return apiError(
      isDbUnavailable(err) ? 'Database is not configured.' : 'Internal server error.',
      isDbUnavailable(err) ? 503 : 500,
    );
  }
}
