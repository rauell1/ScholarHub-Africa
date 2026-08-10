/**
 * Google Consent Mode v2 integration.
 *
 * Sets up the `dataLayer` + `gtag` stubs and pushes `consent` commands:
 *
 *   • `gtag('consent', 'default', {...})`  — fired BEFORE any tag loads, using
 *     the region's default posture (GDPR: denied / CCPA: granted).
 *   • `gtag('consent', 'update', {...})`   — fired the moment the user saves
 *     their preferences.
 *
 * This must be included as early as possible in <head> (see ConsentProvider).
 */
import type { ConsentRegion, CategoryState } from './types';
import { toConsentModeState, type ConsentModeState } from './consent-string';
import { defaultCategoriesForRegion } from './regions';

declare global {
  interface Window {
    // GTM's dataLayer holds heterogeneous payloads (arrays, objects, events).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dataLayer?: any[];
    gtag?: (...args: any[]) => void;
    __consent?: unknown;
  }
}

export function ensureDataLayer(): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  // Standard gtag stub — queues commands until the real gtag loads.
  window.gtag =
    window.gtag ||
    function gtag(...args: unknown[]) {
      window.dataLayer!.push(args);
    };
}

/** Region → default GCM signals, mirrored in gcmConfig() below. */
export function gcmDefaultsForRegion(region: ConsentRegion): ConsentModeState {
  const defaults = defaultCategoriesForRegion(region);
  return toConsentModeState({
    ...defaults,
    // CCPA opt-out default means analytics/marketing start GRANTED:
    ...(region === 'ccpa'
      ? {}
      : { analytics: false, marketing: false, preferences: false }),
  });
}

/**
 * Push the consent default. Call before any third-party script executes
 * (i.e., synchronously in the provider's initial render / layout).
 */
export function pushConsentDefault(region: ConsentRegion): void {
  if (typeof window === 'undefined') return;
  ensureDataLayer();
  window.gtag?.('consent', 'default', {
    ...gcmDefaultsForRegion(region),
    wait_for_update: 500,
    region: region === 'gdpr' ? ['at', 'be', 'bg', 'hr', 'cy', 'cz', 'dk', 'ee', 'fi',
      'fr', 'de', 'gr', 'hu', 'ie', 'it', 'lv', 'lt', 'lu', 'mt', 'nl', 'pl', 'pt',
      'ro', 'sk', 'si', 'es', 'se', 'gb'] : undefined,
  });
}

/** Push the user's saved preferences as a consent update. */
export function pushConsentUpdate(
  categories: CategoryState,
  region: ConsentRegion,
  consentString: string,
): void {
  if (typeof window === 'undefined') return;
  ensureDataLayer();
  const signals = toConsentModeState(categories);
  window.gtag?.('consent', 'update', signals);

  // Also expose the structured state for tag managers (GTM, Segment, etc.)
  window.dataLayer?.push({
    event: 'consent_updated',
    consent: {
      region,
      signals,
      consentString,
      categories,
      timestamp: new Date().toISOString(),
    },
  });

  // Fire the TCF event so IAB-registered vendors can re-evaluate.
  window.dataLayer?.push({
    event: 'tcfapi_update',
    tcf: {
      tcfPolicyVersion: 3,
      tcString: consentString,
    },
  });
}
