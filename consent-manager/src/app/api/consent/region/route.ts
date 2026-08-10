import { NextRequest, NextResponse } from 'next/server';

import { resolveRegion } from '@/lib/consent/regions';

/**
 * GET /api/consent/region — authoritative region resolution for the client
 * hook when the middleware cookie hasn't been read yet.
 */
export async function GET(request: NextRequest) {
  const cookie = request.cookies.get('sh_region')?.value;
  const country =
    request.headers.get('x-vercel-ip-country') ??
    request.headers.get('cf-ipcountry') ??
    process.env.CONSENT_TEST_COUNTRY ??
    '';

  const region =
    cookie === 'gdpr' || cookie === 'ccpa' || cookie === 'none'
      ? cookie
      : resolveRegion(country);

  return NextResponse.json({ region, country });
}
