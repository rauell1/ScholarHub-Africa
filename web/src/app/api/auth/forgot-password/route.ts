import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { users, passwordResetTokens } from '@/db/schema';
import { getDb } from '@/lib/db';

const forgotPasswordSchema = z.object({
  email: z.string().email().max(254),
});

const LIMIT_MAX = 5;
const LIMIT_WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > LIMIT_MAX;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  
  if (rateLimited(ip)) {
    return NextResponse.json({ detail: 'Too many requests. Please try again shortly.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: 'Invalid payload.' }, { status: 400 });
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ detail: 'Invalid email address.' }, { status: 400 });
  }

  const email = parsed.data.email.trim().toLowerCase();

  try {
    const existing = await getDb()
      .select({ id: users.id, name: users.name, passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing.length === 0) {
      // Secure practice: silently return success to prevent email enumeration
      return NextResponse.json({ ok: true });
    }

    const user = existing[0];

    // If the user signed up via Google, they don't have a password.
    if (!user.passwordHash) {
      return NextResponse.json(
        { detail: 'This account was created using Google. Please use the "Continue with Google" button to sign in.' },
        { status: 400 }
      );
    }

    const token = crypto.randomUUID();
    
    // Clear any existing reset tokens for this email first
    await getDb().delete(passwordResetTokens).where(eq(passwordResetTokens.identifier, email));

    // Store new token (expires in 1 hour)
    await getDb().insert(passwordResetTokens).values({
      identifier: email,
      token,
      expires: new Date(Date.now() + 1 * 60 * 60 * 1000), 
    });

    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/accounts/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
      
      const { error } = await resend.emails.send({
        from: 'onboarding@resend.dev', // Using Resend testing domain
        to: email,
        subject: 'Reset your ScholarHub password',
        html: `<p>Hi ${user.name || 'there'},</p>
               <p>We received a request to reset the password for your ScholarHub account.</p>
               <p>Click the link below to set a new password:</p>
               <p><a href="${resetUrl}">${resetUrl}</a></p>
               <p>This link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.</p>`,
      });

      if (error) {
        console.error('Resend error:', error);
      }
    } else {
      console.warn('RESEND_API_KEY is not set. Skipping forgot password email for', email);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Forgot password failed:', err);
    return NextResponse.json(
      { detail: 'Service temporarily unavailable. Please try again later.' },
      { status: 503 },
    );
  }
}
