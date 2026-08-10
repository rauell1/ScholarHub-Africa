/**
 * Region tables & posture logic (GDPR vs CCPA).
 *
 *   GDPR  = EU-27 + EEA (NO, IS, LI) + UK (and CH — closer to GDPR than CCPA,
 *           handled here as GDPR with a comment; adjust per your legal advice).
 *   CCPA  = United States (state privacy laws: CCPA/CPRA, VCDPA, CPA, UCPA…).
 *
 * Default postures (per the product spec):
 *   GDPR → STRICT OPT-IN : every non-essential category defaults OFF.
 *   CCPA → OPT-OUT       : categories default ON, user can opt out; the banner
 *                          shows the "Do Not Sell or Share My Personal Information" link.
 *   none → OPT-OUT (privacy-respecting baseline outside regulated regions).
 */
import type { CategoryState, ConsentRegion } from './types';

const GDPR_COUNTRIES = new Set([
  // EU-27
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
  'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
  'SI', 'ES', 'SE',
  // EEA + UK (+ CH, treated as GDPR-style for this demo)
  'IS', 'LI', 'NO', 'GB', 'CH',
]);

/** Region for a country code; 'US' → 'ccpa', GDPR list → 'gdpr', else 'none'. */
export function resolveRegion(country: string): ConsentRegion {
  const code = (country || '').trim().toUpperCase();
  if (!code) return 'none';
  if (GDPR_COUNTRIES.has(code)) return 'gdpr';
  if (code === 'US') return 'ccpa';
  return 'none';
}

/** Default per-category state for each region. */
export function defaultCategoriesForRegion(region: ConsentRegion): CategoryState {
  if (region === 'gdpr') {
    // STRICT OPT-IN — everything except necessary is OFF.
    return {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
  }
  // CCPA / none — OPT-OUT model, categories ON until the user opts out.
  return {
    necessary: true,
    analytics: true,
    marketing: true,
    preferences: true,
  };
}

/** Human-readable region label (used in admin logs). */
export const REGION_LABELS: Record<ConsentRegion, string> = {
  gdpr: 'GDPR (EU/EEA/UK)',
  ccpa: 'CCPA (US)',
  none: 'Unregulated',
};
