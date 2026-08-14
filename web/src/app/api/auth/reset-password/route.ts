import { NextRequest, NextResponse } from 'next/server';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { users, passwordResetTokens } from '@/db/schema';
import { getDb } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const resetPasswordSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  password: z.string().min(8).max(128),
});

export async function POST(request: NextRequest) {
  const { limited } = await checkRateLimit(getClientIp(request), 'reset-password', 5, '1 m');
  if (limited) {
    return NextResponse.json({ detail: 'Too many requests. Please try again shortly.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: 'Invalid payload.' }, { status: 400 });
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ detail: 'Invalid input.' }, { status: 400 });
  }

  const { email: rawEmail, token, password } = parsed.data;
  const email = rawEmail.trim().toLowerCase();

  try {
    const db = getDb();

    // 1. Validate token
    const tokenRows = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.identifier, email),
          eq(passwordResetTokens.token, token),
          gt(passwordResetTokens.expires, new Date()) // Must not be expired
        )
      )
      .limit(1);

    if (tokenRows.length === 0) {
      return NextResponse.json(
        { detail: 'Invalid or expired reset link. Please request a new one.' },
        { status: 400 }
      );
    }

    // 2. Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Update user password (and verify email if not verified)
    await db
      .update(users)
      .set({ 
        passwordHash,
        emailVerified: new Date(), // implicitly verify email on password reset
      })
      .where(eq(users.email, email));

    // 4. Delete the token so it can't be used again
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.identifier, email));

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Reset password failed:', err);
    return NextResponse.json(
      { detail: 'Service temporarily unavailable. Please try again later.' },
      { status: 503 },
    );
  }
}
