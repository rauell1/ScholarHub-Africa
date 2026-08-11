import { NextResponse } from 'next/server';

/**
 * Shared HTTP helpers for route handlers.
 *
 * Caching policy (serverless-friendly, docs/MIGRATION_PLAN.md §2):
 *   - Public read APIs: short CDN cache (60s) + stale-while-revalidate so a
 *     busy directory/search page never thrashes the origin; data changes are
 *     reflected within a minute (same freshness Django + Cloudflare had).
 *   - Everything under /api/ gets `X-Robots-Tag: noindex` from next.config.
 */
export const PUBLIC_CACHE = {
  'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
} as const;

export const NO_CACHE = {
  'Cache-Control': 'no-store, max-age=0',
} as const;

/** DRF-shaped error response: { "detail": "..." } with the given status. */
export function apiError(detail: string, status: number): NextResponse {
  return NextResponse.json({ detail }, { status });
}

/** True when the failure is "DATABASE_URL not configured" (preview builds). */
export function isDbUnavailable(err: unknown): boolean {
  return err instanceof Error && err.message.includes('DATABASE_URL');
}
