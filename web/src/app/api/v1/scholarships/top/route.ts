import { NextResponse } from 'next/server';

import { apiError, isDbUnavailable, PUBLIC_CACHE } from '@/lib/http';
import { getTop } from '@/lib/queries';

/** GET /api/v1/scholarships/top/ - DRF custom action parity (first 20 by score). */
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const results = await getTop();
    return NextResponse.json(results, { headers: PUBLIC_CACHE });
  } catch (err) {
    console.error('[api/v1/scholarships/top]', err);
    return apiError(
      isDbUnavailable(err) ? 'Database is not configured.' : 'Internal server error.',
      isDbUnavailable(err) ? 503 : 500,
    );
  }
}
