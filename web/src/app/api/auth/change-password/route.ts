import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

import { auth } from '@/auth';
import { getDb } from '@/lib/db';
import { users } from '@/db/schema';
import { apiError } from '@/lib/http';

const changePasswordSchema = z.object({
  current_password: z.string().min(1),
  new_password: z.string().min(8).max(128),
});

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

  const parsed = changePasswordSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('New password must be at least 8 characters.', 400);
  }

  const db = getDb();
  const rows = await db
    .select({ id: users.id, passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  const user = rows[0];
  if (!user?.passwordHash) {
    // OAuth-only users have no password — they must use their provider.
    return apiError(
      'Your account uses social login and has no password to change. Sign in via Google instead.',
      400,
    );
  }

  const valid = await bcrypt.compare(parsed.data.current_password, user.passwordHash);
  if (!valid) {
    return apiError('Current password is incorrect.', 400);
  }

  const newHash = await bcrypt.hash(parsed.data.new_password, 12);
  await db
    .update(users)
    .set({ passwordHash: newHash })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ ok: true });
}
