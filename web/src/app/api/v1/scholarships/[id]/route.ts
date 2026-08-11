import { NextRequest, NextResponse } from 'next/server';

import { apiError, isDbUnavailable, PUBLIC_CACHE } from '@/lib/http';
import { getScholarshipById } from '@/lib/queries';

/**
 * GET /api/v1/scholarships/{id}/ - DRF ScholarshipViewSet.retrieve parity
 * (lookup field is the numeric pk; detail serializer shape).
 */
export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const pk = Number(id);
  if (!Number.isInteger(pk) || pk < 1) {
    return apiError('Not found.', 404);
  }

  try {
    const row = await getScholarshipById(pk);
    if (!row) return apiError('Not found.', 404);
    return NextResponse.json(row, { headers: PUBLIC_CACHE });
  } catch (err) {
    console.error('[api/v1/scholarships/[id]]', err);
    return apiError(
      isDbUnavailable(err) ? 'Database is not configured.' : 'Internal server error.',
      isDbUnavailable(err) ? 503 : 500,
    );
  }
}
