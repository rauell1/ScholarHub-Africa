import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { auth } from '@/auth';
import { getDb } from '@/lib/db';
import { apiError, isDbUnavailable } from '@/lib/http';
import { getOrCreateProfile, updateProfile } from '@/lib/tracker-queries';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

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
    console.error('[api/v1/tracker/profile GET]', err);
    return apiError(
      isDbUnavailable(err) ? 'Database is not configured.' : 'Internal server error.',
      isDbUnavailable(err) ? 503 : 500,
    );
  }
}

const profilePatchSchema = z.object({
  full_name: z.string().min(1).max(200).optional(),
  nationality: z.string().max(100).optional(),
  degree_field: z.string().max(200).optional(),
  graduation_year: z.number().int().min(1990).max(2040).nullable().optional(),
  gpa: z.string().max(10).nullable().optional(),
  experience_years: z.string().max(10).nullable().optional(),
  has_ielts: z.boolean().optional(),
  ielts_score: z.string().max(10).nullable().optional(),
  has_toefl: z.boolean().optional(),
  toefl_score: z.number().int().min(0).max(120).nullable().optional(),
  notes: z.string().max(2000).optional(),
});

export async function PATCH(request: NextRequest) {
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
  const parsed = profilePatchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('Invalid input.', 400);
  }
  try {
    const updated = await updateProfile(session.user.id, parsed.data);
    if (!updated) return apiError('Profile not found.', 404);
    return NextResponse.json(updated);
  } catch (err) {
    console.error('[api/v1/tracker/profile PATCH]', err);
    return apiError(
      isDbUnavailable(err) ? 'Database is not configured.' : 'Internal server error.',
      isDbUnavailable(err) ? 503 : 500,
    );
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return apiError('Authentication credentials were not provided.', 401);
  }
  try {
    const db = getDb();
    // Deleting the user cascades to applicant_profiles → tracked_applications,
    // document_items, accounts, sessions, and verificationTokens.
    await db.delete(users).where(eq(users.id, session.user.id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/v1/tracker/profile DELETE]', err);
    return apiError(
      isDbUnavailable(err) ? 'Database is not configured.' : 'Internal server error.',
      isDbUnavailable(err) ? 503 : 500,
    );
  }
}
