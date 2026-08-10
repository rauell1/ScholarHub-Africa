'use client';

/**
 * Floating shield — a subtle affordance (footer/floating corner) that lets
 * users reopen the preference panel after the banner has been dismissed.
 */
import { t } from '@/lib/consent/i18n';
import { useConsentContext } from './ConsentProvider';

export function FloatingShield() {
  const { config, consent } = useConsentContext();

  if (!config.layout.showShield) return null;

  return (
    <button
      type="button"
      className="cm-shield"
      onClick={consent.openPreferences}
      aria-label={t(config.language, 'shield.aria', config.texts)}
      title={t(config.language, 'shield.aria', config.texts)}
    >
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
      <span className="cm-shield__dot" aria-hidden="true" />
    </button>
  );
}
