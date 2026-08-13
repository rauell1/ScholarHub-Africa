import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { apiError, isDbUnavailable } from '@/lib/http';
import { createApplication, listApplications } from '@/lib/tracker-queries';
import { z } from 'zod';

/**
 * GET/POST /api/v1/tracker/applications/ - DRF TrackedApplicationViewSet
 * parity (auth required, scoped to the session user).
 */
export const dynamic = 'force-dynamic';

const createSchema = z.object({
  scholarship: z.number().int().positive(),
  stage: z.string().optional(),
  priority: z.string().optional(),
  notes: z.string().max(4000).optional(),
  next_action: z.string().max(500).optional(),
  next_action_due: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  sop_status: z.string().optional(),
  refs_status: z.string().optional(),
  transcript_ready: z.boolean().optional(),
  moi_ready: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError('Authentication credentials were not provided.', 401);
  }
  try {
    const rows = await listApplications(session.user.id);
    return NextResponse.json(rows);
  } catch (err) {
    console.error('[api/v1/tracker/applications]', err);
    return apiError(
      isDbUnavailable(err) ? 'Database is not configured.' : 'Internal server error.',
      isDbUnavailable(err) ? 503 : 500,
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError('Authentication credentials were not provided.', 401);
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid payload.', 400);
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('Invalid payload.', 400);
  }
  try {
    const row = await createApplication(session.user.id, parsed.data.scholarship, {
      stage: parsed.data.stage,
      priority: parsed.data.priority,
      notes: parsed.data.notes,
      next_action: parsed.data.next_action,
      next_action_due: parsed.data.next_action_due ?? null,
      sop_status: parsed.data.sop_status,
      refs_status: parsed.data.refs_status,
      transcript_ready: parsed.data.transcript_ready,
      moi_ready: parsed.data.moi_ready,
    });
    if (!row) return apiError('Scholarship not found.', 404);
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    const msg = String(err);
    if (msg.includes('profile_scholarship_uniq') || msg.includes('duplicate key')) {
      // Already tracked — return the existing row as 200 so the client shows "already tracked"
      const { listApplications } = await import('@/lib/tracker-queries');
      const existing = await listApplications(session.user.id);
      const match = existing.find((r) => r.scholarship === parsed.data.scholarship);
      return NextResponse.json(match ?? {}, { status: 200 });
    }
    console.error('[api/v1/tracker/applications POST]', err);
    return apiError(
      isDbUnavailable(err) ? 'Database is not configured.' : 'Internal server error.',
      isDbUnavailable(err) ? 503 : 500,
    );
  }
}
