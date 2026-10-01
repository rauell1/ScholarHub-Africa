import { type NextRequest, NextResponse } from 'next/server';
import { inngest } from '@/inngest/client';

export const dynamic = 'force-dynamic';

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ detail: 'Unauthorized.' }, { status: 401 });
  }

  try {
    await inngest.send({ name: 'crawl.discover', data: {} });
  } catch (err) {
    // Usually a missing/invalid INNGEST_EVENT_KEY - log it so the nightly
    // crawl failing is visible instead of an opaque 500.
    console.error('[cron/crawl] could not dispatch crawl.discover', err);
    return NextResponse.json({ detail: 'Could not dispatch crawl job.' }, { status: 502 });
  }

  return NextResponse.json({ ok: true, message: 'Discovery job dispatched.' });
}
