import { NextRequest, NextResponse } from 'next/server';
import { eq, and } from 'drizzle-orm';

import { apiError, isDbUnavailable } from '@/lib/http';
import { queryScholarships } from '@/lib/queries';
import { getDb } from '@/lib/db';
import { apiKeys } from '@/db/schema';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // 1. Authenticate the request via database
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return apiError('Unauthorized. Missing or invalid Authorization header.', 401);
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return apiError('Unauthorized.', 401);
  }

  let db;
  try {
    db = getDb();
  } catch (err) {
    return apiError(
      isDbUnavailable(err) ? 'Database is not configured.' : 'Internal server error.',
      isDbUnavailable(err) ? 503 : 500,
    );
  }

  try {
    // Check API Key in database
    const keyRows = await db
      .select({ id: apiKeys.id })
      .from(apiKeys)
      .where(and(eq(apiKeys.token, token), eq(apiKeys.isActive, true)))
      .limit(1);

    if (keyRows.length === 0) {
      return apiError('Unauthorized. Invalid or inactive API key.', 401);
    }
  } catch (err) {
    console.error('[api/v1/export/scholarships] auth error:', err);
    return apiError('Internal server error during authentication.', 500);
  }

  // 2. Parse pagination parameters
  const searchParams = request.nextUrl.searchParams;
  let limit = parseInt(searchParams.get('limit') ?? '100', 10);
  let offset = parseInt(searchParams.get('offset') ?? '0', 10);

  // Enforce sane limits to prevent abuse/crashing
  if (isNaN(limit) || limit < 1) limit = 100;
  if (limit > 1000) limit = 1000;
  if (isNaN(offset) || offset < 0) offset = 0;

  try {
    // 3. Query the data
    const results = await queryScholarships({ limit, offset, ordering: 'id' }, db);
    
    // We return the raw array. The client can check if results.length < limit to know when to stop.
    return NextResponse.json({
      data: results,
      meta: {
        limit,
        offset,
        count: results.length,
        has_more: results.length === limit,
      }
    });
  } catch (err) {
    console.error('[api/v1/export/scholarships]', err);
    return apiError(
      isDbUnavailable(err) ? 'Database is not configured.' : 'Internal server error.',
      isDbUnavailable(err) ? 503 : 500,
    );
  }
}
