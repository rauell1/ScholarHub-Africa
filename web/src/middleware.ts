/**
 * Edge middleware - combines two concerns:
 *
 * 1. Consent region detection (GDPR vs CCPA) - ported from consent-manager:
 *    stamps `sh_region` cookies + X-Consent-Region header on every response.
 * 2. Auth gate (Auth.js v5) - /tracker/* and /accounts/profile require a
 *    session; unauthenticated visitors are redirected to the login page
 *    with a callbackUrl back to where they were going.
 *
 * JWT session strategy keeps this edge bundle DB-free.
 */
import NextAuth from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authConfig } from './auth.config';

const { auth } = NextAuth(authConfig);

import { resolveRegion } from './lib/consent/regions';
import type { ConsentRegion } from './lib/consent/types';

const REGION_COOKIE = 'sh_region';
const REGION_COOKIE_HTTP = 'sh_region_http';
const REGION_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function stampConsent(request: NextRequest): NextResponse {
  const country =
    request.headers.get('x-vercel-ip-country') ??
    request.headers.get('cf-ipcountry') ??
    process.env.CONSENT_TEST_COUNTRY ??
    '';

  const region: ConsentRegion = resolveRegion(country.toUpperCase());

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

  // Stamp visitor's home country for geo-personalisation (scholarship hints,
  // chatbot context, homepage Top Picks). Only re-stamps when changed.
  const existingCountry = request.cookies.get('sh_country')?.value ?? '';
  const detectedCountry = country.toUpperCase();
  if (detectedCountry && existingCountry !== detectedCountry) {
    response.cookies.set('sh_country', detectedCountry, {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  return response;
}

export default auth((request: NextRequest & { auth?: unknown }) => {
  const response = stampConsent(request);

  const { pathname } = request.nextUrl;
  const isPrivate =
    pathname.startsWith('/tracker') ||
    pathname.startsWith('/accounts/profile') ||
    pathname.startsWith('/admin');

  if (isPrivate && !request.auth) {
    const url = request.nextUrl.clone();
    url.pathname = '/accounts/login';
    url.search = '';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }

  return response;
});

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff2?)$).*)',
  ],
};
