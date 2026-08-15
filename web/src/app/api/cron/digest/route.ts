import { NextRequest, NextResponse } from 'next/server';

import { getDigestContext, renderDigestEmail } from '@/lib/digest';
import { getDb } from '@/lib/db';
import { newsletterSubscribers } from '@/db/schema';

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
    const envRecipients = (process.env.DIGEST_EMAILS ?? '').split(',').map((s) => s.trim()).filter(Boolean);

    // Merge env list with confirmed newsletter subscribers from DB.
    let dbEmails: string[] = [];
    try {
      const rows = await getDb()
        .select({ email: newsletterSubscribers.email })
        .from(newsletterSubscribers);
      dbEmails = rows.map((r) => r.email);
    } catch {
      dbEmails = [];
    }
    const recipients = [...new Set([...envRecipients, ...dbEmails])];

    const from = process.env.DEFAULT_FROM_EMAIL ?? 'ScholarHub Africa <digest@scholarhub.africa>';
    const subject = `📚 Scholarship Digest - Week of ${context.generatedOn}`;

    if (resendKey && recipients.length > 0) {
      // Resend caps `to` at 50 recipients per API call — send in batches.
      const BATCH_SIZE = 50;
      const batches: string[][] = [];
      for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        batches.push(recipients.slice(i, i + BATCH_SIZE));
      }

      let failedBatches = 0;
      for (const batch of batches) {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ from, to: batch, subject, html }),
        });
        if (!res.ok) {
          const errBody = await res.text();
          console.error('[cron/digest] Resend batch error', res.status, errBody);
          failedBatches++;
        }
      }

      if (failedBatches === batches.length) {
        return NextResponse.json({ detail: 'Email delivery failed for all batches.' }, { status: 502 });
      }
      return NextResponse.json({ ok: true, sent_to: recipients.length, batches: batches.length, failed_batches: failedBatches, subject });
    }

    // Dev/dry-run: no RESEND_API_KEY configured - log and succeed.
    console.log('[cron/digest] dry-run (no RESEND_API_KEY):', { subject, urgent: context.urgent.length, newThisWeek: context.newThisWeek.length });
    return NextResponse.json({ ok: true, dry_run: true, subject, urgent: context.urgent.length, newThisWeek: context.newThisWeek.length });
  } catch (err) {
    console.error('[cron/digest]', err);
    return NextResponse.json({ detail: 'Internal server error.' }, { status: 500 });
  }
}
