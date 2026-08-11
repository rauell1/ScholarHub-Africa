import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/cron/crawl - daily scholarship crawler (Vercel Cron, 03:00 UTC).
 *
 * Guarded by CRON_SECRET like the digest. The Django crawler
 * (apps/scholarships/management/commands/crawl_scholarships.py) is ported to
 * a Node script in a later milestone; this endpoint exists so the cron slot
 * is wired and can be swapped in without touching vercel.json.
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
  // TODO(M6 follow-up): port crawl_scholarships.py to a Node/cheerio script
  // (start URL: the directory homepage) and invoke it here.
  return NextResponse.json({
    ok: true,
    message: 'Crawler not yet implemented - port of crawl_scholarships.py pending.',
  });
}
