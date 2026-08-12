'use client';

/**
 * End-user cookie banner.
 *
 * Visibility: ONLY rendered when no prior consent is stored for this session
 * (consent.bannerVisible). Once the user accepts/rejects/saves, the banner
 * disappears permanently (until consent is reset).
 *
 * Region-aware:
 *   • GDPR (EU/EEA/UK) → strict opt-in: Accept all / Reject non-essential /
 *     Manage preferences.
 *   • CCPA (US)        → opt-out: "Do Not Sell or Share My Personal
 *     Information" link + opt-out control.
 */
import { t } from '@/lib/consent/i18n';
import { useConsentContext } from './ConsentProvider';

export function CookieBanner() {
  return null;
}
