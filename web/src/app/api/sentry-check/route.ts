import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

import { NO_CACHE } from '@/lib/http';

/**
 * GET /api/sentry-check - prove the Sentry pipeline end to end.
 *
 * Guarded by CRON_SECRET (Authorization: Bearer), matching the cron routes,
 * because it deliberately raises an event.
 *
 * Exists because "no events in Sentry" has two very different causes that look
 * identical from the dashboard:
 *
 *   1. Nothing has gone wrong and no request won the tracesSampleRate dice
 *      roll, so there is genuinely nothing to report.
 *   2. A DSN is configured but points at a different project, so events are
 *      landing somewhere else.
 *
 * The second is easy to miss: releases and deploys come from the build-time
 * plugin via SENTRY_ORG/SENTRY_PROJECT, entirely independent of the DSN, so a
 * mismatched DSN still shows deploys against the right project while events go
 * elsewhere. This route reports the project id the DSN actually points at and
 * returns the id of an event it just sent, so one request settles both.
 */
export const dynamic = 'force-dynamic';

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

/**
 * Pull the identifying parts out of a DSN.
 * Format: https://<publicKey>@o<orgId>.ingest.<region>.sentry.io/<projectId>
 *
 * The public key is not a secret -- it ships in the client bundle and is
 * already visible in the page source -- so reporting it here leaks nothing,
 * and it is what lets you match this against a project's Client Keys page.
 */
function describeDsn(dsn: string | undefined) {
  if (!dsn) return { configured: false as const };
  try {
    const url = new URL(dsn);
    return {
      configured: true as const,
      host: url.hostname,
      publicKey: url.username,
      projectId: url.pathname.replace(/^\//, ''),
    };
  } catch {
    return { configured: true as const, malformed: true as const };
  }
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    // Report *whether* a secret exists, never its value. Without this a 401
    // has two indistinguishable causes: the deployment has no CRON_SECRET (so
    // no request can ever pass, and Vercel's own cron invocations are 401ing
    // too), or the caller sent the wrong one. The boolean separates them in a
    // single request and discloses nothing a guesser could use.
    return NextResponse.json(
      {
        detail: 'Unauthorized.',
        cronSecretConfigured: Boolean(process.env.CRON_SECRET),
        hint: process.env.CRON_SECRET
          ? 'A CRON_SECRET is set in this deployment but the Authorization header did not match it. Send exactly `Authorization: Bearer <the value in Vercel → Settings → Environment Variables>`; a local .env.local value is unrelated to what the deployment sees.'
          : 'No CRON_SECRET in this deployment, so every caller is rejected and the three Vercel crons in vercel.json are 401ing on every run — including the Monday digest. Add CRON_SECRET in Vercel → Settings → Environment Variables (Production) and redeploy; server env vars are only picked up by a new deployment.',
      },
      { status: 401, headers: NO_CACHE },
    );
  }

  const dsn = describeDsn(process.env.NEXT_PUBLIC_SENTRY_DSN);
  const client = Sentry.getClient();

  // captureException rather than captureMessage so it lands in Issues, where a
  // real error would, and is unmistakably labelled as a deliberate test.
  const eventId = Sentry.captureException(
    new Error('ScholarHub Sentry pipeline check (deliberate, from /api/sentry-check)'),
    { tags: { deliberate_test: 'true' }, level: 'error' },
  );

  // Serverless functions freeze the moment the response is returned, which can
  // discard an in-flight event. Flushing is what makes this check trustworthy:
  // `delivered: false` means the transport genuinely failed, not that the
  // process exited early.
  const delivered = await Sentry.flush(5000);

  return NextResponse.json(
    {
      sdkInitialised: Boolean(client),
      environment: process.env.NODE_ENV,
      // enabled is gated on production in all three Sentry configs, so a
      // non-production runtime reports nothing however good the DSN is.
      enabledInThisRuntime: process.env.NODE_ENV === 'production',
      dsn,
      eventId,
      delivered,
      hint: dsn.configured
        ? 'Compare dsn.projectId and dsn.publicKey against the target project\'s Settings → Client Keys (DSN). If they differ, events are going to a different project.'
        : 'NEXT_PUBLIC_SENTRY_DSN is not set in this deployment. Note it is inlined at build time, so it must be present during the build, not merely added afterwards.',
    },
    { status: 200, headers: NO_CACHE },
  );
}
