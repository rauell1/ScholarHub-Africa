import { NextRequest, NextResponse } from 'next/server';

import { computeAnalytics } from '@/lib/analytics';
import { isAdminRequest } from '@/lib/server/rbac';
import { readConsentLogs } from '@/lib/server/store';

/**
 * GET /api/admin/export/report — printable compliance report (PDF via browser
 * print). RBAC: role === 'ADMIN' required.
 */
export async function GET(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const logs = await readConsentLogs();
  const analytics = computeAnalytics(logs, 30);
  const generatedAt = new Date().toISOString();

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Consent Compliance Report</title>
<style>
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; margin: 40px; }
  h1 { color: #1F3864; border-bottom: 3px solid #1ABC9C; padding-bottom: 8px; }
  h2 { color: #1F3864; margin-top: 28px; }
  table { border-collapse: collapse; width: 100%; font-size: 12px; }
  th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; }
  th { background: #eef2f7; }
  .stats { display: flex; gap: 16px; margin: 16px 0; }
  .stat { border: 1px solid #d1d5db; border-radius: 8px; padding: 12px 20px; }
  .stat b { font-size: 22px; color: #1ABC9C; display: block; }
  .muted { color: #6b7280; font-size: 12px; }
  @media print { body { margin: 0; } }
</style>
</head>
<body>
  <h1>Consent Compliance Report</h1>
  <p class="muted">Generated ${generatedAt.replace('T', ' ').slice(0, 19)} UTC · ScholarHub Consent Manager</p>

  <div class="stats">
    <div class="stat"><b>${analytics.totalRecords}</b> records</div>
    <div class="stat"><b>${analytics.overallOptInRate}%</b> overall opt-in</div>
    <div class="stat"><b>${analytics.daily.filter(d => d.total > 0).length}</b> active days (30d)</div>
  </div>

  <h2>Daily opt-in rate (last 30 days)</h2>
  <table>
    <tr><th>Date</th><th>Total</th><th>Accepted</th><th>Opt-in rate</th></tr>
    ${analytics.daily
      .filter((d) => d.total > 0)
      .map(
        (d) =>
          `<tr><td>${d.date}</td><td>${d.total}</td><td>${d.accepted}</td><td>${d.optInRate}%</td></tr>`,
      )
      .join('')}
  </table>

  <h2>Region breakdown</h2>
  <table>
    <tr><th>Region</th><th>Records</th></tr>
    ${Object.entries(analytics.regionBreakdown)
      .map(([region, count]) => `<tr><td>${region}</td><td>${count}</td></tr>`)
      .join('')}
  </table>

  <h2>Consent log (${logs.length} rows)</h2>
  <table>
    <tr><th>Timestamp</th><th>Region</th><th>Accepted</th><th>Analytics</th><th>Marketing</th><th>Version</th></tr>
    ${logs
      .slice(0, 200)
      .map(
        (log) =>
          `<tr><td>${log.timestamp}</td><td>${log.geolocation.region} (${log.geolocation.country})</td>
           <td>${log.accepted}</td><td>${log.state.analytics}</td><td>${log.state.marketing}</td>
           <td>${log.version}</td></tr>`,
      )
      .join('')}
  </table>
</body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Disposition': 'inline; filename="consent-report.html"',
    },
  });
}
