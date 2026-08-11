import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { apiError, isDbUnavailable } from '@/lib/http';
import { deleteApplication, listApplications, updateApplication } from '@/lib/tracker-queries';
import { z } from 'zod';

/**
 * GET/PATCH/DELETE /api/v1/tracker/applications/{id}/ - DRF
 * TrackedApplicationViewSet parity (owner-scoped).
 */
export const dynamic = 'force-dynamic';

const updateSchema = z
  .object({
    stage: z.string().optional(),
    priority: z.string().optional(),
    notes: z.string().max(4000).optional(),
    next_action: z.string().max(500).optional(),
    next_action_due: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    sop_status: z.string().optional(),
    refs_status: z.string().optional(),
    transcript_ready: z.boolean().optional(),
    moi_ready: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required.',
  });

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError('Authentication credentials were not provided.', 401);
  }
  const { id } = await params;
  const appId = Number(id);
  if (!Number.isInteger(appId) || appId < 1) return apiError('Not found.', 404);
  try {
    const rows = await listApplications(session.user.id);
    const row = rows.find((r) => r.id === appId);
    if (!row) return apiError('Not found.', 404);
    return NextResponse.json(row);
  } catch (err) {
    console.error('[api/v1/tracker/applications/[id]]', err);
    return apiError(
      isDbUnavailable(err) ? 'Database is not configured.' : 'Internal server error.',
      isDbUnavailable(err) ? 503 : 500,
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError('Authentication credentials were not provided.', 401);
  }
  const { id } = await params;
  const appId = Number(id);
  if (!Number.isInteger(appId) || appId < 1) return apiError('Not found.', 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid payload.', 400);
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError('Invalid payload.', 400);

  try {
    const row = await updateApplication(session.user.id, appId, parsed.data);
    if (!row) return apiError('Not found.', 404);
    return NextResponse.json(row);
  } catch (err) {
    console.error('[api/v1/tracker/applications/[id] PATCH]', err);
    return apiError(
      isDbUnavailable(err) ? 'Database is not configured.' : 'Internal server error.',
      isDbUnavailable(err) ? 503 : 500,
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError('Authentication credentials were not provided.', 401);
  }
  const { id } = await params;
  const appId = Number(id);
  if (!Number.isInteger(appId) || appId < 1) return apiError('Not found.', 404);
  try {
    const deleted = await deleteApplication(session.user.id, appId);
    if (!deleted) return apiError('Not found.', 404);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    console.error('[api/v1/tracker/applications/[id] DELETE]', err);
    return apiError(
      isDbUnavailable(err) ? 'Database is not configured.' : 'Internal server error.',
      isDbUnavailable(err) ? 503 : 500,
    );
  }
}
