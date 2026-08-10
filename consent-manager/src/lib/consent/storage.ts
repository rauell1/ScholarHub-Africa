/**
 * Consent state storage.
 *
 * Primary store: `localStorage` (survives restarts, readable by the banner).
 * The server simultaneously sets a strictly HTTP-only first-party cookie
 * (`sh_consent`) on POST /api/consent so the state is authoritative
 * server-side without ever being exposed to JS. Both are namespaced and
 * versioned.
 */
import type { ConsentRegion, ConsentState } from './types';

export const CONSENT_VERSION = 1;
export const STORAGE_KEY = 'sh:consent:v1';

const REGION_COOKIE = 'sh_region';

/* ── localStorage ────────────────────────────────────────────────────────── */

export function loadStoredConsent(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (!parsed || parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredConsent(state: ConsentState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Storage full / disabled (Safari private mode) - banner state still works
    // for the current session via the in-memory hook state.
  }
}

export function clearStoredConsent(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}

/* ── Cookies ─────────────────────────────────────────────────────────────── */

export function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
}

/** Region stamped by the edge middleware (readable cookie). */
export function readRegionCookie(): ConsentRegion | null {
  const value = getCookie(REGION_COOKIE);
  return value === 'gdpr' || value === 'ccpa' || value === 'none' ? value : null;
}
