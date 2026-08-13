import { type NextRequest, NextResponse } from 'next/server';
import { lt, and, eq, ne } from 'drizzle-orm';
import { getDb } from '@/lib/db';
import { scholarships } from '@/db/schema';

export const dynamic = 'force-dynamic';

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

/**
 * GET /api/cron/close-expired
 * Runs daily (see vercel.json). Marks any active scholarship whose
 * deadline_date is in the past as 'closed'. Scholarships with a cycle_year
 * remain trackable — the front-end surfaces a "Reopens YYYY" chip.
 */
export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ detail: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const db = getDb();
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const updated = await db
      .update(scholarships)
      .set({ status: 'closed' })
      .where(
        and(
          eq(scholarships.isActive, true),
          ne(scholarships.status, 'closed'),
          lt(scholarships.deadlineDate, today),
        ),
      )
      .returning({ id: scholarships.id, slug: scholarships.slug });

    console.log(`[cron/close-expired] closed ${updated.length} scholarships`);
    return NextResponse.json({ ok: true, closed: updated.length, ids: updated.map((r) => r.id) });
  } catch (err) {
    console.error('[cron/close-expired]', err);
    return NextResponse.json({ detail: 'Internal server error.' }, { status: 500 });
  }
}
