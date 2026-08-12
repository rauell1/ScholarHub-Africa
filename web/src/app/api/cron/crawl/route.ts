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

  await inngest.send({ name: 'crawl.discover', data: {} });

  return NextResponse.json({ ok: true, message: 'Discovery job dispatched.' });
}
