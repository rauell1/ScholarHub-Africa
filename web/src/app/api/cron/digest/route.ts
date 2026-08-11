import { NextRequest, NextResponse } from 'next/server';

import { getDigestContext, renderDigestEmail } from '@/lib/digest';

/**
 * GET /api/cron/digest - weekly Monday digest (Vercel Cron, 05:00 UTC =
 * 08:00 EAT, matching the Django Celery beat schedule).
 *
 * Guarded by CRON_SECRET (Authorization: Bearer) or the Vercel cron header.
 * Sends via the Resend REST API when RESEND_API_KEY is set; otherwise logs
 * the rendered HTML (local/dev) and returns 200 so cron monitoring works.
 */
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ detail: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const context = await getDigestContext();
    const html = renderDigestEmail(context);

    const resendKey = process.env.RESEND_API_KEY;
    const recipients = (process.env.DIGEST_EMAILS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
    const from = process.env.DEFAULT_FROM_EMAIL ?? 'ScholarHub Africa <digest@scholarhub.africa>';
    const subject = `📚 Scholarship Digest - Week of ${context.generatedOn}`;

    if (resendKey && recipients.length > 0) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: recipients,
          subject,
          html,
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        console.error('[cron/digest] Resend error', res.status, body);
        return NextResponse.json({ detail: 'Email delivery failed.' }, { status: 502 });
      }
      return NextResponse.json({ ok: true, sent_to: recipients.length, subject });
    }

    // Dev/dry-run: no RESEND_API_KEY configured - log and succeed.
    console.log('[cron/digest] dry-run (no RESEND_API_KEY):', { subject, urgent: context.urgent.length, newThisWeek: context.newThisWeek.length });
    return NextResponse.json({ ok: true, dry_run: true, subject, urgent: context.urgent.length, newThisWeek: context.newThisWeek.length });
  } catch (err) {
    console.error('[cron/digest]', err);
    return NextResponse.json({ detail: 'Internal server error.' }, { status: 500 });
  }
}
