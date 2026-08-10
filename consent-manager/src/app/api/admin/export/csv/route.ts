import { NextRequest, NextResponse } from 'next/server';

import { isAdminRequest } from '@/lib/server/rbac';
import { readConsentLogs } from '@/lib/server/store';

const CSV_HEADERS = [
  'id',
  'timestamp',
  'country',
  'region',
  'accepted',
  'state.necessary',
  'state.analytics',
  'state.marketing',
  'state.preferences',
  'consent_string',
  'tcf_string',
  'version',
  'language',
  'anonymized_ip',
];

function escapeCsv(value: string): string {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/**
 * GET /api/admin/export/csv — download the consent log as CSV for audits.
 * RBAC: role === 'ADMIN' required.
 */
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const logs = await readConsentLogs();
  logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  const rows = logs.map((log) =>
    [
      log.id,
      log.timestamp,
      log.geolocation.country,
      log.geolocation.region,
      log.accepted ? 'true' : 'false',
      log.state.necessary ? 'true' : 'false',
      log.state.analytics ? 'true' : 'false',
      log.state.marketing ? 'true' : 'false',
      log.state.preferences ? 'true' : 'false',
      log.consentString,
      log.tcfString ?? '',
      String(log.version),
      log.language,
      log.anonymizedIp,
    ]
      .map(escapeCsv)
      .join(','),
  );

  const csv = [CSV_HEADERS.join(','), ...rows].join('\n');

  return new NextResponse('\uFEFF' + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="consent-logs-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
