import { cookies } from 'next/headers';

/* ── African country data ────────────────────────────────────────────────── */

export const AFRICAN_COUNTRIES: Record<string, { name: string; flag: string }> = {
  DZ: { name: 'Algeria', flag: '🇩🇿' },
  AO: { name: 'Angola', flag: '🇦🇴' },
  BJ: { name: 'Benin', flag: '🇧🇯' },
  BW: { name: 'Botswana', flag: '🇧🇼' },
  BF: { name: 'Burkina Faso', flag: '🇧🇫' },
  BI: { name: 'Burundi', flag: '🇧🇮' },
  CV: { name: 'Cabo Verde', flag: '🇨🇻' },
  CM: { name: 'Cameroon', flag: '🇨🇲' },
  CF: { name: 'Central African Republic', flag: '🇨🇫' },
  TD: { name: 'Chad', flag: '🇹🇩' },
  KM: { name: 'Comoros', flag: '🇰🇲' },
  CG: { name: 'Congo', flag: '🇨🇬' },
  CD: { name: 'Congo (DRC)', flag: '🇨🇩' },
  CI: { name: "Côte d'Ivoire", flag: '🇨🇮' },
  DJ: { name: 'Djibouti', flag: '🇩🇯' },
  EG: { name: 'Egypt', flag: '🇪🇬' },
  GQ: { name: 'Equatorial Guinea', flag: '🇬🇶' },
  ER: { name: 'Eritrea', flag: '🇪🇷' },
  SZ: { name: 'Eswatini', flag: '🇸🇿' },
  ET: { name: 'Ethiopia', flag: '🇪🇹' },
  GA: { name: 'Gabon', flag: '🇬🇦' },
  GM: { name: 'Gambia', flag: '🇬🇲' },
  GH: { name: 'Ghana', flag: '🇬🇭' },
  GN: { name: 'Guinea', flag: '🇬🇳' },
  GW: { name: 'Guinea-Bissau', flag: '🇬🇼' },
  KE: { name: 'Kenya', flag: '🇰🇪' },
  LS: { name: 'Lesotho', flag: '🇱🇸' },
  LR: { name: 'Liberia', flag: '🇱🇷' },
  LY: { name: 'Libya', flag: '🇱🇾' },
  MG: { name: 'Madagascar', flag: '🇲🇬' },
  MW: { name: 'Malawi', flag: '🇲🇼' },
  ML: { name: 'Mali', flag: '🇲🇱' },
  MR: { name: 'Mauritania', flag: '🇲🇷' },
  MU: { name: 'Mauritius', flag: '🇲🇺' },
  MA: { name: 'Morocco', flag: '🇲🇦' },
  MZ: { name: 'Mozambique', flag: '🇲🇿' },
  NA: { name: 'Namibia', flag: '🇳🇦' },
  NE: { name: 'Niger', flag: '🇳🇪' },
  NG: { name: 'Nigeria', flag: '🇳🇬' },
  RW: { name: 'Rwanda', flag: '🇷🇼' },
  ST: { name: 'São Tomé and Príncipe', flag: '🇸🇹' },
  SN: { name: 'Senegal', flag: '🇸🇳' },
  SC: { name: 'Seychelles', flag: '🇸🇨' },
  SL: { name: 'Sierra Leone', flag: '🇸🇱' },
  SO: { name: 'Somalia', flag: '🇸🇴' },
  ZA: { name: 'South Africa', flag: '🇿🇦' },
  SS: { name: 'South Sudan', flag: '🇸🇸' },
  SD: { name: 'Sudan', flag: '🇸🇩' },
  TZ: { name: 'Tanzania', flag: '🇹🇿' },
  TG: { name: 'Togo', flag: '🇹🇬' },
  TN: { name: 'Tunisia', flag: '🇹🇳' },
  UG: { name: 'Uganda', flag: '🇺🇬' },
  ZM: { name: 'Zambia', flag: '🇿🇲' },
  ZW: { name: 'Zimbabwe', flag: '🇿🇼' },
};

export const AFRICAN_ISO_CODES = new Set(Object.keys(AFRICAN_COUNTRIES));

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
