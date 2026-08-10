import { NextRequest, NextResponse } from 'next/server';

import { computeAnalytics } from '@/lib/analytics';
import { isAdminRequest } from '@/lib/server/rbac';
import { readConsentLogs } from '@/lib/server/store';

/**
 * GET /api/admin/analytics — opt-in rates over time for the dashboard charts.
 * RBAC: role === 'ADMIN' required.
 */
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const days = Math.min(90, Math.max(7, Number(request.nextUrl.searchParams.get('days') ?? 30)));
  const logs = await readConsentLogs();
  return NextResponse.json(computeAnalytics(logs, days));
}
