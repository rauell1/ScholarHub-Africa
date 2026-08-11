import { NextResponse } from 'next/server';

import { apiError, isDbUnavailable, PUBLIC_CACHE } from '@/lib/http';
import { getOpenNow } from '@/lib/queries';

/** GET /api/v1/scholarships/open_now/ - DRF custom action parity. */
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const results = await getOpenNow();
    return NextResponse.json(results, { headers: PUBLIC_CACHE });
  } catch (err) {
    console.error('[api/v1/scholarships/open_now]', err);
    return apiError(
      isDbUnavailable(err) ? 'Database is not configured.' : 'Internal server error.',
      isDbUnavailable(err) ? 503 : 500,
    );
  }
}
