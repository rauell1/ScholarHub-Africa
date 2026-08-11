import { NextResponse } from 'next/server';

import { apiError, isDbUnavailable, PUBLIC_CACHE } from '@/lib/http';
import { getCountries } from '@/lib/queries';

/**
 * GET /api/v1/countries/ - DRF CountryViewSet parity:
 * all countries with at least one ACTIVE scholarship + count.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const results = await getCountries({ activeOnly: true });
    return NextResponse.json(results, { headers: PUBLIC_CACHE });
  } catch (err) {
    console.error('[api/v1/countries]', err);
    return apiError(
      isDbUnavailable(err) ? 'Database is not configured.' : 'Internal server error.',
      isDbUnavailable(err) ? 503 : 500,
    );
  }
}
