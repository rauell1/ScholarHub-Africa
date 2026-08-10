import { NextRequest, NextResponse } from 'next/server';

import { isAdminRequest } from '@/lib/server/rbac';
import { readConsentLogs } from '@/lib/server/store';

/**
 * GET /api/admin/logs - consent audit log with pagination & filters.
 * RBAC: role === 'ADMIN' required.
 */
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const params = request.nextUrl.searchParams;
  const page = Math.max(1, Number(params.get('page') ?? 1));
  const pageSize = Math.min(100, Math.max(1, Number(params.get('page_size') ?? 20)));
  const region = params.get('region');
  const accepted = params.get('accepted');
  const from = params.get('from');
  const to = params.get('to');

  let logs = await readConsentLogs();

  if (region) logs = logs.filter((l) => l.geolocation.region === region);
  if (accepted === 'true' || accepted === 'false') {
    logs = logs.filter((l) => l.accepted === (accepted === 'true'));
  }
  if (from) logs = logs.filter((l) => l.timestamp >= from);
  if (to) logs = logs.filter((l) => l.timestamp <= `${to}T23:59:59.999Z`);

  // Newest first
  logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const total = logs.length;
  const start = (page - 1) * pageSize;
  const items = logs.slice(start, start + pageSize);

  return NextResponse.json({
    items,
    total,
    page,
    pages: Math.ceil(total / pageSize),
    pageSize,
  });
}
