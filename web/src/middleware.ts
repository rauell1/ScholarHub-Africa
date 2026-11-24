/**
 * Edge middleware - combines two concerns:
 *
 * 1. Consent region detection (GDPR vs CCPA) - ported from consent-manager:
 *    stamps `sh_region` cookies + X-Consent-Region header on every response.
 * 2. Auth gate (Auth.js v5) - /tracker/*, /accounts/profile*, and /admin*
 *    require a session; unauthenticated visitors are redirected to the login
 *    page with a callbackUrl back to where they were going.
 *
 * Performance on Cloudflare Workers:
 * - Public routes skip NextAuth JWT verification completely (saves crypto CPU
 *   on every public page view and RSC prefetch).
 * - Set-Cookie headers are only attached when the cookie is absent or changed,
 *   avoiding redundant cookie churn and keeping responses cache-friendly.
 */
import NextAuth from 'next-auth';
import { NextRequest, NextResponse } from 'next/server';
import { authConfig } from './auth.config';
import { resolveRegion } from './lib/consent/regions';
import type { ConsentRegion } from './lib/consent/types';

const { auth } = NextAuth(authConfig);

const REGION_COOKIE = 'sh_region';
const REGION_COOKIE_HTTP = 'sh_region_http';
const REGION_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function stampConsent(request: NextRequest, response: NextResponse): NextResponse {
  const country =
    request.headers.get('cf-ipcountry') ??
    request.headers.get('x-vercel-ip-country') ??
    process.env.CONSENT_TEST_COUNTRY ??
    '';

  const detectedCountry = country.toUpperCase();
  const region: ConsentRegion = resolveRegion(detectedCountry);
  const isProd = process.env.NODE_ENV === 'production';

  if (request.cookies.get(REGION_COOKIE)?.value !== region) {
    response.cookies.set(REGION_COOKIE, region, {
      path: '/',
      sameSite: 'lax',
      secure: isProd,
      maxAge: REGION_MAX_AGE,
    });
  }
  if (request.cookies.get(REGION_COOKIE_HTTP)?.value !== region) {
    response.cookies.set(REGION_COOKIE_HTTP, region, {
      path: '/',
      sameSite: 'lax',
      httpOnly: true,
      secure: isProd,
      maxAge: REGION_MAX_AGE,
    });
  }
  response.headers.set('X-Consent-Region', region);

  // Stamp visitor's home country for geo-personalisation (scholarship hints,
  // chatbot context, homepage Top Picks). Only re-stamps when changed.
  const existingCountry = request.cookies.get('sh_country')?.value ?? '';
  if (detectedCountry && existingCountry !== detectedCountry) {
    response.cookies.set('sh_country', detectedCountry, {
      path: '/',
      sameSite: 'lax',
      secure: isProd,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  return response;
}

const protectedAuthMiddleware = auth((request: NextRequest & { auth?: unknown }) => {
  if (!request.auth) {
    const { pathname } = request.nextUrl;
    const url = request.nextUrl.clone();
    url.pathname = '/accounts/login';
    url.search = '';
    url.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(url);
  }
  return stampConsent(request, NextResponse.next());
});

export default function middleware(request: NextRequest, event: unknown) {
  const { pathname } = request.nextUrl;
  const isPrivate =
    pathname.startsWith('/tracker') ||
    pathname.startsWith('/accounts/profile') ||
    pathname.startsWith('/admin');

  if (!isPrivate) {
    return stampConsent(request, NextResponse.next());
  }

  return (protectedAuthMiddleware as (req: NextRequest, ev: unknown) => unknown)(
    request,
    event,
  );
}

export const config = {
  // Run on everything except Next internals and static assets.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff2?)$).*)',
  ],
};
