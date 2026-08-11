import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/auth';
import { apiError, isDbUnavailable } from '@/lib/http';
import { listDocuments, updateDocument } from '@/lib/tracker-queries';
import { z } from 'zod';

/**
 * GET /api/v1/tracker/documents/ + PATCH /api/v1/tracker/documents/{id}/
 * - DRF DocumentItemViewSet parity (owner-scoped; no create/delete in Django).
 */
export const dynamic = 'force-dynamic';

const updateSchema = z
  .object({
    status: z.string().optional(),
    notes: z.string().max(1000).optional(),
    due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field is required.',
  });

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError('Authentication credentials were not provided.', 401);
  }
  try {
    const rows = await listDocuments(session.user.id);
    return NextResponse.json(rows);
  } catch (err) {
    console.error('[api/v1/tracker/documents]', err);
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
  const docId = Number(id);
  if (!Number.isInteger(docId) || docId < 1) return apiError('Not found.', 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError('Invalid payload.', 400);
  }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return apiError('Invalid payload.', 400);

  try {
    const row = await updateDocument(session.user.id, docId, parsed.data);
    if (!row) return apiError('Not found.', 404);
    return NextResponse.json(row);
  } catch (err) {
    console.error('[api/v1/tracker/documents/[id]]', err);
    return apiError(
      isDbUnavailable(err) ? 'Database is not configured.' : 'Internal server error.',
      isDbUnavailable(err) ? 503 : 500,
    );
  }
}
