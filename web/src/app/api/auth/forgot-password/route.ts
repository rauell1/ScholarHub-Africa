import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { users, passwordResetTokens } from '@/db/schema';
import { getDb } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

const forgotPasswordSchema = z.object({
  email: z.string().email().max(254),
});

function buildPasswordResetEmail(name: string, resetUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Inter,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr>
            <td style="background:#0D9488;padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">🎓 ScholarHub <span style="color:#99f6e4;">Africa</span></h1>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <h2 style="margin:0;color:#111827;font-size:20px;font-weight:700;">Reset your password</h2>
              <p style="margin:12px 0 0;color:#374151;font-size:14px;line-height:1.7;">
                Hi ${name},
              </p>
              <p style="margin:12px 0 0;color:#374151;font-size:14px;line-height:1.7;">
                We received a request to reset your ScholarHub Africa password. Click the button below to choose a new one.
              </p>
              <p style="margin:28px 0;">
                <a href="${resetUrl}" style="display:inline-block;background:#0D9488;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:13px 28px;border-radius:8px;">Reset my password →</a>
              </p>
              <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
                This link expires in <strong>1 hour</strong>. If you didn't request a password reset, you can safely ignore this email — your password won't change.
              </p>
              <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;" />
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Button not working? Copy and paste this link into your browser:<br />
                <a href="${resetUrl}" style="color:#0D9488;word-break:break-all;">${resetUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px;background:#f9fafb;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">ScholarHub Africa · Scholarship discovery &amp; tracking for African students</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  const { limited } = await checkRateLimit(getClientIp(request), 'forgot-password', 5, '1 m');
  if (limited) {
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
    const db = getDb();
    const existing = await db
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
    await db.delete(passwordResetTokens).where(eq(passwordResetTokens.identifier, email));

    // Store new token (expires in 1 hour)
    await db.insert(passwordResetTokens).values({
      identifier: email,
      token,
      expires: new Date(Date.now() + 1 * 60 * 60 * 1000), 
    });

    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);

      const baseUrl = request.nextUrl.origin;
      const resetUrl = `${baseUrl}/accounts/reset-password?token=${token}&email=${encodeURIComponent(email)}`;

      const { error } = await resend.emails.send({
        from: 'ScholarHub <info@rauell.systems>',
        to: email,
        subject: 'Reset your ScholarHub Africa password',
        html: buildPasswordResetEmail(user.name || 'there', resetUrl),
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
