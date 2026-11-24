import { cookies } from 'next/headers';
import { AFRICAN_COUNTRIES, AFRICAN_ISO_CODES } from './geo-countries';

export { AFRICAN_COUNTRIES, AFRICAN_ISO_CODES };

/* ── GeoUser ─────────────────────────────────────────────────────────────── */

export interface GeoUser {
  iso: string;
  name: string;
  flag: string;
  isAfrican: boolean;
}

/** Resolve ISO → country info from the AFRICAN_COUNTRIES map. */
export function resolveCountry(iso: string): GeoUser {
  const info = AFRICAN_COUNTRIES[iso];
  return {
    iso,
    name: info?.name ?? iso,
    flag: info?.flag ?? '',
    isAfrican: AFRICAN_ISO_CODES.has(iso),
  };
}

/**
 * Server-only helper (uses next/headers cookies()).
 * Returns null when no sh_country cookie is set (e.g. local dev without
 * the Vercel edge, or first request before middleware stamps the cookie).
 */
export async function getUserGeo(): Promise<GeoUser | null> {
  try {
    const cookieStore = await cookies();
    const raw = cookieStore.get('sh_country')?.value;
    if (!raw) return null;
    const iso = raw.toUpperCase();
    return resolveCountry(iso);
  } catch {
    return null;
  }
}
