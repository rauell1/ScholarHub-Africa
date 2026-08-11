import { NextResponse } from 'next/server';

import { env } from '@/lib/env';

/**
 * Health check for the Vercel deployment + cron monitoring.
 * Never cached; reports DB configuration status without connecting
 * (connectivity checks land with the Phase 3 query layer).
 */
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json({
    ok: true,
    service: 'scholarhub-africa-web',
    version: '0.1.0-m1',
    time: new Date().toISOString(),
    db: env.DATABASE_URL ? 'configured' : 'not-configured',
  });
}
