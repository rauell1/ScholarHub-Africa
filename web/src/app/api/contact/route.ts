import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { site } from '@/lib/site';

const contactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(254),
  subject: z.string().max(200).optional(),
  hear_about: z.string().max(50).optional(),
  message: z.string().min(10).max(4000),
  /** Honeypot - hidden from humans; bots fill it in. Drop silently. */
  website: z.string().max(100).optional(),
});

const HEAR_ABOUT_LABELS: Record<string, string> = {
  google: 'Google search',
  ai_assistant: 'AI assistant (ChatGPT / Claude / Perplexity)',
  social: 'Social media',
  whatsapp: 'WhatsApp',
  friend: 'Friend or family',
  other: 'Other',
};

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

function buildAdminEmail(data: {
  name: string;
  email: string;
  subject?: string;
  hear_about?: string;
  message: string;
}): string {
  const hearAbout = data.hear_about ? HEAR_ABOUT_LABELS[data.hear_about] ?? data.hear_about : 'Not specified';
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
              <h1 style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">📩 New Contact Form Message</h1>
              <p style="margin:6px 0 0;color:#99f6e4;font-size:13px;">ScholarHub Africa · ${new Date().toUTCString()}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
                    <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:600;">From</span>
                    <p style="margin:4px 0 0;color:#111827;font-size:14px;font-weight:600;">${data.name} &lt;${data.email}&gt;</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
                    <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:600;">Subject</span>
                    <p style="margin:4px 0 0;color:#111827;font-size:14px;">${data.subject || '(none)'}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid #f3f4f6;">
                    <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:600;">Found us via</span>
                    <p style="margin:4px 0 0;color:#111827;font-size:14px;">${hearAbout}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 0 0;">
                    <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.08em;color:#9ca3af;font-weight:600;">Message</span>
                    <p style="margin:8px 0 0;color:#374151;font-size:14px;line-height:1.7;white-space:pre-wrap;">${data.message.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
                  </td>
                </tr>
              </table>
              <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;">Reply directly to this email to respond to ${data.name}.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildConfirmationEmail(name: string): string {
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
              <h2 style="margin:0;color:#111827;font-size:18px;">Thanks, ${name}!</h2>
              <p style="margin:12px 0 0;color:#374151;font-size:14px;line-height:1.7;">
                We received your message and will get back to you within 2 business days.
              </p>
              <p style="margin:12px 0 0;color:#374151;font-size:14px;line-height:1.7;">
                While you wait, explore the scholarship directory — new verified opportunities are added every week.
              </p>
              <p style="margin:24px 0 0;">
                <a href="${site.url}/scholarships/" style="display:inline-block;background:#0D9488;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:8px;">Browse scholarships →</a>
              </p>
              <p style="margin:28px 0 0;font-size:12px;color:#9ca3af;">
                ScholarHub Africa · Scholarship discovery &amp; tracking for African students
              </p>
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

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ detail: 'Invalid input.' }, { status: 400 });
  }

  // Honeypot: pretend success, do nothing.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  const { name, email, subject, hear_about, message } = parsed.data;

  const resendKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.CONTACT_EMAIL ?? site.email;
  const fromAddress = process.env.DEFAULT_FROM_EMAIL ?? `ScholarHub Africa <${site.email}>`;

  if (!resendKey) {
    // Dev / dry-run: no RESEND_API_KEY — log and succeed so local dev works.
    console.log('[contact] dry-run (no RESEND_API_KEY):', { name, email, subject });
    return NextResponse.json({ ok: true });
  }

  // Send both emails in parallel: admin notification + user confirmation.
  const [adminRes, confirmRes] = await Promise.allSettled([
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: fromAddress,
        to: [adminEmail],
        reply_to: email,
        subject: `[ScholarHub Contact] ${subject || `Message from ${name}`}`,
        html: buildAdminEmail({ name, email, subject, hear_about, message }),
      }),
    }),
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: fromAddress,
        to: [email],
        subject: `Thanks for reaching out, ${name} — ScholarHub Africa`,
        html: buildConfirmationEmail(name),
      }),
    }),
  ]);

  if (adminRes.status === 'rejected' || (adminRes.status === 'fulfilled' && !adminRes.value.ok)) {
    const detail = adminRes.status === 'fulfilled' ? await adminRes.value.text().catch(() => '') : String(adminRes.reason);
    console.error('[contact] Resend admin email failed:', detail);
    return NextResponse.json({ detail: 'Failed to send message. Please try again.' }, { status: 502 });
  }

  // Confirmation email failure is non-fatal — log it but still return success.
  if (confirmRes.status === 'rejected' || (confirmRes.status === 'fulfilled' && !confirmRes.value.ok)) {
    console.error('[contact] Resend confirmation email failed (non-fatal)');
  }

  return NextResponse.json({ ok: true });
}
