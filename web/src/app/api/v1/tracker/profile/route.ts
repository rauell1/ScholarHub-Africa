import { NextResponse } from 'next/server';

import { auth } from '@/auth';
import { apiError, isDbUnavailable } from '@/lib/http';
import { getOrCreateProfile } from '@/lib/tracker-queries';

/**
 * GET /api/v1/tracker/profile/ - DRF ProfileViewSet parity.
 * Returns the session user's applicant profile (creating it + the 24-item
 * checklist on first access, like the Django dashboard).
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError('Authentication credentials were not provided.', 401);
  }
  try {
    const profile = await getOrCreateProfile(
      session.user.id,
      session.user.email ?? session.user.id,
      session.user.name,
    );
    return NextResponse.json(profile);
  } catch (err) {
    console.error('[api/v1/tracker/profile]', err);
    return apiError(
      isDbUnavailable(err) ? 'Database is not configured.' : 'Internal server error.',
      isDbUnavailable(err) ? 503 : 500,
    );
  }
}

export async function PATCH() {
  // Phase 2 roadmap (profile editing) - the serializer exposes the fields
  // read-only in Django; edits land with the Phase 2 roadmap.
  return apiError('Profile editing is not available yet.', 405);
}
