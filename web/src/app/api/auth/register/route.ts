import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { users, verificationTokens } from '@/db/schema';
import { getDb } from '@/lib/db';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

/**
 * POST /api/auth/register - create a Credentials account (Phase 5).
 *
 * Mirrors the Django contact-form security posture: a hidden honeypot field
 * silently drops bots, and everything is re-validated server-side (Zod).
 * Rate-limited per IP (in-memory, like the consent API).
 */
const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  /** Honeypot - hidden from humans; bots fill it in. Drop silently. */
  website: z.string().max(100).optional(),
});

function buildVerificationEmail(name: string, verifyUrl: string): string {
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
              <h2 style="margin:0;color:#111827;font-size:20px;font-weight:700;">Verify your email address</h2>
              <p style="margin:12px 0 0;color:#374151;font-size:14px;line-height:1.7;">
                Hi ${name},
              </p>
              <p style="margin:12px 0 0;color:#374151;font-size:14px;line-height:1.7;">
                Thanks for creating a ScholarHub Africa account. Click the button below to verify your email address and activate your account.
              </p>
              <p style="margin:28px 0;">
                <a href="${verifyUrl}" style="display:inline-block;background:#0D9488;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:13px 28px;border-radius:8px;">Verify my email →</a>
              </p>
              <p style="margin:0;color:#6b7280;font-size:13px;line-height:1.6;">
                This link expires in <strong>24 hours</strong>. If you didn't create an account, you can safely ignore this email.
              </p>
              <hr style="border:none;border-top:1px solid #f3f4f6;margin:24px 0;" />
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                Button not working? Copy and paste this link into your browser:<br />
                <a href="${verifyUrl}" style="color:#0D9488;word-break:break-all;">${verifyUrl}</a>
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
  const { limited } = await checkRateLimit(getClientIp(request), 'register', 10, '1 m');
  if (limited) {
    return NextResponse.json({ detail: 'Too many requests. Please try again shortly.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: 'Invalid payload.' }, { status: 400 });
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ detail: 'Invalid input.' }, { status: 400 });
  }

  // Honeypot: pretend success, do nothing (Django parity).
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  const email = parsed.data.email.trim().toLowerCase();
  try {
    const db = getDb();
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json(
        { detail: 'An account with this email already exists.' },
        { status: 409 },
      );
    }
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    const userId = `user_${crypto.randomUUID()}`;
    const token = crypto.randomUUID();

    await db.insert(users).values({
      id: userId,
      name: parsed.data.name.trim(),
      email,
      passwordHash,
    });

    await db.insert(verificationTokens).values({
      identifier: email,
      token,
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    });

    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import('resend');
      const resend = new Resend(process.env.RESEND_API_KEY);
      
      const baseUrl = request.nextUrl.origin;
      const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}&email=${encodeURIComponent(email)}`;
      
      const { error } = await resend.emails.send({
        from: 'ScholarHub <info@rauell.systems>',
        to: email,
        subject: 'Verify your ScholarHub Africa account',
        html: buildVerificationEmail(parsed.data.name.trim(), verifyUrl),
      });

      if (error) {
        console.error('Resend verification email failed:', error);
      }
    } else {
      console.warn('RESEND_API_KEY is not set. Skipping verification email for', email);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Registration failed:', err);
    return NextResponse.json(
      { detail: 'Registration is temporarily unavailable. Please try again.' },
      { status: 503 },
    );
  }
}
