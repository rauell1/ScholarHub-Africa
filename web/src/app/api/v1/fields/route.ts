import { NextResponse } from 'next/server';

import { apiError, isDbUnavailable, PUBLIC_CACHE } from '@/lib/http';
import { getFields } from '@/lib/queries';

/**
 * GET /api/v1/fields/ - DRF FieldViewSet parity:
 * all fields of study with at least one scholarship + count.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const results = await getFields();
    return NextResponse.json(results, { headers: PUBLIC_CACHE });
  } catch (err) {
    console.error('[api/v1/fields]', err);
    return apiError(
      isDbUnavailable(err) ? 'Database is not configured.' : 'Internal server error.',
      isDbUnavailable(err) ? 503 : 500,
    );
  }
}
