/**
 * Client-side region resolution.
 *
 * The edge middleware (src/middleware.ts) stamps `sh_region`; the hook reads
 * it synchronously. If missing (first paint race, middleware bypassed), it
 * falls back to the authoritative API endpoint which re-derives the region
 * from geo headers.
 */
import type { ConsentRegion } from './types';
import { readRegionCookie } from './storage';

export async function resolveRegionClient(): Promise<ConsentRegion> {
  const fromCookie = readRegionCookie();
  if (fromCookie) return fromCookie;
  try {
    const res = await fetch('/api/consent/region', { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as { region: ConsentRegion };
      return data.region;
    }
  } catch {
    /* network failure — fall through to 'none' */
  }
  return 'none';
}
