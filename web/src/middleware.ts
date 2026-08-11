/**
 * Edge middleware - Geolocation / Region detection (GDPR vs CCPA).
 *
 * Runs at the edge (Vercel Edge Functions, Cloudflare via cf-ipcountry, etc.)
 * BEFORE the request reaches the app, and stamps every response with:
 *   • `sh_region`        - readable cookie the client `useConsent` hook reads
 *   • `sh_region_http`   - HTTP-only cookie used by API routes as the authority
 *   • `X-Consent-Region` - response header for debugging / proxies
 *
 * The region determines the DEFAULT consent posture:
 *   GDPR (EU/EEA/UK) → STRICT OPT-IN  (all non-essential categories OFF)
 *   CCPA (US states) → OPT-OUT        (categories ON unless user opts out)
 */
import { NextRequest, NextResponse } from 'next/server';

import { resolveRegion } from './lib/consent/regions';
import type { ConsentRegion } from './lib/consent/types';

const REGION_COOKIE = 'sh_region';
const REGION_COOKIE_HTTP = 'sh_region_http';
const REGION_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

export function middleware(request: NextRequest): NextResponse {
  // 1) Resolve the country from edge geolocation. On Vercel the country
  //    arrives via the `x-vercel-ip-country` header; Cloudflare users get
  //    `cf-ipcountry`; the env fallback lets you simulate a region in dev.
  const country =
    request.headers.get('x-vercel-ip-country') ??
    request.headers.get('cf-ipcountry') ??
    process.env.CONSENT_TEST_COUNTRY ??
    '';

  const region: ConsentRegion = resolveRegion(country.toUpperCase());

  // 2) Stamp the response with cookies + header.
  const response = NextResponse.next();

  response.cookies.set(REGION_COOKIE, region, {
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: REGION_MAX_AGE,
  });
  response.cookies.set(REGION_COOKIE_HTTP, region, {
    path: '/',
    sameSite: 'lax',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: REGION_MAX_AGE,
  });
  response.headers.set('X-Consent-Region', region);

  return response;
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff2?)$).*)',
  ],
};
