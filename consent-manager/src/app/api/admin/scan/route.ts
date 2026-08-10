import { NextRequest, NextResponse } from 'next/server';

import { isAdminRequest } from '@/lib/server/rbac';
import { scanUrl, scanWithHeadless } from '@/lib/scanner/scanner';

/**
 * POST /api/admin/scan - trigger the Automatic Cookie & Tracker Scan.
 * RBAC: role === 'ADMIN' required.
 */
export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as { url?: string };
  const target = (body.url ?? process.env.SITE_URL ?? '').trim();

  if (!target) {
    return NextResponse.json(
      { error: 'A target URL is required (e.g. "https://scholarhub.africa")' },
      { status: 400 },
    );
  }

  // Validate the target strictly (SSRF defence) - http(s) only, real host.
  let parsed: URL;
  try {
    parsed = new URL(target);
  } catch {
    return NextResponse.json({ error: 'Target must be a valid absolute URL.' }, { status: 400 });
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return NextResponse.json({ error: 'Target must use http or https.' }, { status: 400 });
  }
  if (!parsed.hostname.includes('.')) {
    return NextResponse.json({ error: 'Target must be a public hostname.' }, { status: 400 });
  }

  try {
    const result = await scanUrl(target);
    result.cookies = await scanWithHeadless(target);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Scan failed: ${error.message}`
            : 'Scan failed - is the URL reachable?',
      },
      { status: 502 },
    );
  }
}
