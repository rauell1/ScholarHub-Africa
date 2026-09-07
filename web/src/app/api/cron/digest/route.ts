import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

import { getDigestContext, renderDigestEmail } from '@/lib/digest';
import { getDb } from '@/lib/db';
import { newsletterSubscribers } from '@/db/schema';

/**
 * GET /api/cron/digest - weekly Monday digest (Vercel Cron, 05:00 UTC =
 * 08:00 EAT, matching the Django Celery beat schedule).
 *
 * Guarded by CRON_SECRET (Authorization: Bearer). Vercel supplies that header
 * itself on scheduled invocations when CRON_SECRET is set on the project.
 *
 * Sends via the Resend REST API. Outside production, a missing RESEND_API_KEY
 * logs the rendered HTML and succeeds, so local runs need no credentials. In
 * production, having nothing to send to is a failure and is reported as one:
 * this route used to answer `200 {ok:true, dry_run:true}` whenever the key or
 * the recipient list was missing, which made a digest that had never reached
 * a single person indistinguishable from one that went out every week.
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

    if (!resendKey || recipients.length === 0) {
      const reason = !resendKey
        ? 'RESEND_API_KEY is not set'
        : 'there are no recipients (DIGEST_EMAILS is empty and no newsletter subscribers are stored)';

      // Local and preview runs legitimately have no mail credentials.
      if (process.env.NODE_ENV !== 'production') {
        console.log('[cron/digest] dry-run:', {
          reason,
          subject,
          urgent: context.urgent.length,
          newThisWeek: context.newThisWeek.length,
        });
        return NextResponse.json({
          ok: true,
          dry_run: true,
          reason,
          subject,
          urgent: context.urgent.length,
          newThisWeek: context.newThisWeek.length,
        });
      }

      // A weekly digest nobody receives is a broken weekly digest. Answering
      // 200 here is what let this fail every Monday in silence: Vercel counts
      // the invocation as successful, so nothing anywhere reports a problem.
      // Non-2xx makes the failed run visible in Vercel, and the Sentry event
      // makes it visible without anyone thinking to read cron logs at all.
      const failure = new Error(`Weekly digest sent to nobody: ${reason}.`);
      console.error('[cron/digest]', failure.message);
      Sentry.captureException(failure, { tags: { cron: 'digest' }, level: 'error' });
      await Sentry.flush(2000);
      return NextResponse.json({ ok: false, sent_to: 0, detail: failure.message }, { status: 500 });
    }

    // Resend caps `to` at 50 recipients per API call — send in batches.
    const BATCH_SIZE = 50;
    const batches: string[][] = [];
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
      batches.push(recipients.slice(i, i + BATCH_SIZE));
    }

    let failedBatches = 0;
    let deliveredTo = 0;
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
        // Reported, not merely logged. With a key present and recipients
        // resolved, a rejected send is the remaining way a digest still
        // reaches nobody -- an unverified `from` domain, for instance, fails
        // every batch identically -- and console.error left that invisible.
        // The text is Resend's own error body; it carries no credential.
        Sentry.captureException(
          new Error(`Resend rejected a digest batch: HTTP ${res.status} ${errBody.slice(0, 200)}`),
          { tags: { cron: 'digest', resend_status: String(res.status) }, level: 'error' },
        );
        failedBatches++;
      } else {
        deliveredTo += batch.length;
      }
    }

    if (failedBatches > 0) await Sentry.flush(2000);

    if (failedBatches === batches.length) {
      return NextResponse.json(
        { ok: false, sent_to: 0, batches: batches.length, failed_batches: failedBatches, detail: 'Email delivery failed for all batches.' },
        { status: 502 },
      );
    }
    // sent_to counts who was actually accepted, not the size of the list: a
    // partial failure used to report the full count behind ok:true.
    return NextResponse.json({ ok: failedBatches === 0, sent_to: deliveredTo, batches: batches.length, failed_batches: failedBatches, subject });
  } catch (err) {
    console.error('[cron/digest]', err);
    // onRequestError only sees errors that escape the handler, so a caught
    // one has to be reported explicitly or the weekly run fails unobserved.
    Sentry.captureException(err, { tags: { cron: 'digest' }, level: 'error' });
    await Sentry.flush(2000);
    return NextResponse.json({ detail: 'Internal server error.' }, { status: 500 });
  }
}
