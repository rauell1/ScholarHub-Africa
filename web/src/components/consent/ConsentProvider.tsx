'use client';

/**
 * ConsentContext - bridges the runtime config (from the admin environment)
 * and the useConsent hook to the end-user components.
 */
import { createContext, useContext, useEffect, type ReactNode } from 'react';

import { useConsent, type UseConsentResult } from '@/hooks/useConsent';
import { ScriptManager } from '@/lib/consent/script-manager';
import type { ConsentConfig } from '@/lib/consent/types';
import { CookieBanner } from './CookieBanner';
import { PreferencesModal } from './PreferencesModal';

interface ConsentContextValue {
  config: ConsentConfig;
  consent: UseConsentResult;
}

const ConsentContext = createContext<ConsentContextValue | null>(null);

export function useConsentContext(): ConsentContextValue {
  const ctx = useContext(ConsentContext);
  if (!ctx) {
    throw new Error('useConsentContext must be used within <ConsentProvider>');
  }
  return ctx;
}

export function ConsentProvider({
  config,
  children,
}: {
  config: ConsentConfig;
  children: ReactNode;
}) {
  const consent = useConsent(config.language);

  // Apply the admin-customised theme as CSS variables on <html>.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--cm-primary', config.theme.primaryColor);
    root.style.setProperty('--cm-accent', config.theme.accentColor);
    root.style.setProperty('--cm-bg', config.theme.backgroundColor);
    root.style.setProperty('--cm-text', config.theme.textColor);
    root.style.setProperty('--cm-button-text', config.theme.buttonTextColor);
    root.style.setProperty('--cm-radius', `${config.theme.radius}px`);
    root.style.setProperty('--cm-font', config.typography.fontFamily);
    root.style.setProperty('--cm-base-size', `${config.typography.baseSize}px`);
  }, [config]);

  // Register third-party scripts from the admin config with the ScriptManager.
  // They are NOT injected until the user grants their category - the manager
  // applies them on every consent change.
  useEffect(() => {
    const manager = ScriptManager.getInstance();
    for (const script of config.scripts.custom) {
      manager.register(script.id, script.category, { src: script.src });
    }
    if (config.scripts.gtmId) {
      // GTM container: gated on marketing consent. Individual tags inside
      // GTM still respect the Google Consent Mode v2 signals pushed by the
      // hook (ad_storage / analytics_storage etc.).
      manager.register('gtm', 'marketing', {
        src: `https://www.googletagmanager.com/gtm.js?id=${config.scripts.gtmId}`,
        attributes: { 'data-gtm-container': config.scripts.gtmId },
      });
    }
  }, [config.scripts]);

  return (
    <ConsentContext.Provider value={{ config, consent }}>
      {children}
      <CookieBanner />
      <PreferencesModal />
    </ConsentContext.Provider>
  );
}
