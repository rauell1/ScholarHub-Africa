import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

import { getDb } from '@/lib/db';
import { newsletterSubscribers } from '@/db/schema';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { site } from '@/lib/site';

const subscribeSchema = z.object({
  email: z.string().email().max(254),
  name: z.string().max(200).optional(),
  source: z.string().max(50).optional(),
});

export async function POST(request: NextRequest) {
  const { limited } = await checkRateLimit(getClientIp(request), 'newsletter', 10, '1 m');
  if (limited) {
    return NextResponse.json({ detail: 'Too many requests.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: 'Invalid payload.' }, { status: 400 });
  }

  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ detail: 'Invalid email address.' }, { status: 400 });
  }

  const { email, name = '', source = 'footer' } = parsed.data;

  const db = getDb();

  // Idempotent: silently succeed if already subscribed.
  const existing = await db
    .select({ id: newsletterSubscribers.id })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email))
    .limit(1)
    .catch(() => []);

  if (existing.length > 0) {
    return NextResponse.json({ ok: true, already_subscribed: true });
  }

  await db
    .insert(newsletterSubscribers)
    .values({ email, name, source })
    .catch((err: unknown) => {
      console.error('[newsletter/subscribe] insert failed', err);
      throw err;
    });

  // Send welcome email if Resend is configured.
  const resendKey = process.env.RESEND_API_KEY;
  const fromAddress = process.env.DEFAULT_FROM_EMAIL ?? `ScholarHub Africa <${site.email}>`;

  if (resendKey) {
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Inter,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:24px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr><td style="background:#0D9488;padding:24px 32px;"><h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">🎓 ScholarHub <span style="color:#99f6e4;">Africa</span></h1></td></tr>
          <tr>
            <td style="padding:28px 32px;">
              <h2 style="margin:0;color:#111827;font-size:18px;">You're in${name ? `, ${name}` : ''}!</h2>
              <p style="margin:12px 0 0;color:#374151;font-size:14px;line-height:1.7;">
                You'll receive our weekly digest every Monday — closing soon scholarships and newly verified opportunities, straight to your inbox.
              </p>
              <p style="margin:24px 0 0;">
                <a href="${site.url}/scholarships/" style="display:inline-block;background:#0D9488;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px;">Explore scholarships now →</a>
              </p>
              <p style="margin:24px 0 0;font-size:11px;color:#9ca3af;">
                To unsubscribe, reply to any digest email with "unsubscribe" in the subject.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: fromAddress,
        to: [email],
        subject: `Welcome to the ScholarHub Africa weekly digest`,
        html,
      }),
    }).catch((err: unknown) => console.error('[newsletter/subscribe] welcome email failed (non-fatal)', err));
  }

  return NextResponse.json({ ok: true });
}
