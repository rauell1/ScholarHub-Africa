/**
 * useConsent - the core end-user hook.
 *
 * Responsibilities:
 *   1. Load persisted consent (localStorage, versioned) → banner visibility.
 *   2. Resolve the user's region (GDPR/CCPA/none) from the edge middleware.
 *   3. Push Google Consent Mode v2 `default` (pre-tag-load) and `update`
 *      (on every user choice) to `dataLayer`.
 *   4. Build the IAB TCF 2.3 TC string for GDPR users.
 *   5. Drive the ScriptManager (auto-blocking) on every consent change.
 *   6. Persist + report the choice to the compliance log API.
 */
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

import { buildConsentPayload } from '@/lib/consent/consent-string';
import { resolveRegionClient } from '@/lib/consent/geo';
import { pushConsentDefault, pushConsentUpdate } from '@/lib/consent/gcm';
import { defaultCategoriesForRegion } from '@/lib/consent/regions';
import { publishConsentChange, ScriptManager } from '@/lib/consent/script-manager';
import { CONSENT_VERSION, loadStoredConsent, saveStoredConsent } from '@/lib/consent/storage';
import type {
  CategoryState,
  ConsentRegion,
  ConsentState,
} from '@/lib/consent/types';

export interface UseConsentResult {
  /** 'undetermined' until the user has made a choice (banner visible then). */
  status: 'undetermined' | 'accepted' | 'rejected' | 'partial';
  region: ConsentRegion | null;
  categories: CategoryState | null;
  version: number;
  bannerVisible: boolean;
  preferencesOpen: boolean;
  consentString: string;
  tcfString: string;
  openPreferences: () => void;
  closePreferences: () => void;
  acceptAll: () => void;
  rejectAll: () => void;
  savePreferences: (next: CategoryState) => void;
}

const STORED_VERSION = CONSENT_VERSION;

function buildState(
  categories: CategoryState,
  region: ConsentRegion,
  language: string,
  accepted: boolean,
): ConsentState {
  const { consentString, tcfString } = buildConsentPayload(categories, region, language);
  return {
    categories,
    region,
    consentString,
    tcfString,
    version: STORED_VERSION,
    accepted,
    timestamp: new Date().toISOString(),
    language,
  };
}

export function useConsent(language = 'en'): UseConsentResult {
  const [region, setRegion] = useState<ConsentRegion | null>(null);
  const [state, setState] = useState<ConsentState | null>(() => {
    const stored = loadStoredConsent();
    // Restore region synchronously from the middleware cookie if we can.
    if (!stored) return null;
    return stored;
  });
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const manager = useRef<ScriptManager | null>(null);

  // ── Boot: resolve region, capture gated scripts, push GCM default ──────
  useEffect(() => {
    if (manager.current) return;
    manager.current = ScriptManager.getInstance();
    manager.current.capture();

    let cancelled = false;
    (async () => {
      const resolved = await resolveRegionClient();
      if (cancelled) return;

      // 1) Google Consent Mode v2 - default posture BEFORE any tag runs.
      pushConsentDefault(resolved);

      // 2) If we already have stored consent, re-apply (scripts, GCM update).
      const stored = loadStoredConsent();
      if (stored) {
        setState(stored);
        pushConsentUpdate(stored.categories, stored.region, stored.consentString);
        manager.current?.apply(stored);
        publishConsentChange(stored);
      }
      setRegion(resolved);
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Persist + broadcast any settled state ───────────────────────────────
  const settle = useCallback((next: ConsentState) => {
    setState(next);
    saveStoredConsent(next);
    pushConsentUpdate(next.categories, next.region, next.consentString);
    const mgr = manager.current ?? ScriptManager.getInstance();
    manager.current = mgr;
    mgr.apply(next);
    publishConsentChange(next);

    // Report to the compliance log (fire-and-forget).
    fetch('/api/consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state: next.categories,
        region: next.region,
        consentString: next.consentString,
        tcfString: next.tcfString,
        version: next.version,
        accepted: next.accepted,
        language: next.language,
      }),
    }).catch(() => {
      /* logging must never block the UX */
    });
  }, []);

  const currentRegion = state?.region ?? region;

  const acceptAll = useCallback(() => {
    if (!currentRegion) return;
    const categories: CategoryState = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    settle(buildState(categories, currentRegion, language, true));
    setPreferencesOpen(false);
  }, [currentRegion, language, settle]);

  const rejectAll = useCallback(() => {
    if (!currentRegion) return;
    const categories = defaultCategoriesForRegion(currentRegion);
    categories.necessary = true;
    settle(buildState(categories, currentRegion, language, false));
    setPreferencesOpen(false);
  }, [currentRegion, language, settle]);

  const savePreferences = useCallback(
    (next: CategoryState) => {
      if (!currentRegion) return;
      const nonEssential = Object.values(next).filter((v) => v).length - (next.necessary ? 1 : 0);
      settle(
        buildState(
          { ...next, necessary: true },
          currentRegion,
          language,
          nonEssential > 0,
        ),
      );
      setPreferencesOpen(false);
    },
    [currentRegion, language, settle],
  );

  const openPreferences = useCallback(() => setPreferencesOpen(true), []);
  const closePreferences = useCallback(() => setPreferencesOpen(false), []);

  const status: UseConsentResult['status'] = !state
    ? 'undetermined'
    : state.accepted
      ? 'accepted'
      : 'rejected';

  return {
    status,
    region: currentRegion,
    categories: state?.categories ?? null,
    version: STORED_VERSION,
    bannerVisible: !state,
    preferencesOpen,
    consentString: state?.consentString ?? '',
    tcfString: state?.tcfString ?? '',
    openPreferences,
    closePreferences,
    acceptAll,
    rejectAll,
    savePreferences,
  };
}
