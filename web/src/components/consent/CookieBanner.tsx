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
  const { config, consent } = useConsentContext();
  const { bannerVisible, preferencesOpen, region } = consent;

  if (!bannerVisible || preferencesOpen) return null;

  const lang = config.language;
  const text = (key: Parameters<typeof t>[1]) => t(lang, key, config.texts);
  const isCcp = region === 'ccpa';

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className={`cm-banner cm-banner--${config.layout.position}`}
    >
      <div className="cm-banner__inner">
        <div className="cm-banner__content">
          <div className="cm-banner__title">{text('banner.title')}</div>
          <p className="cm-banner__message">{text('banner.message')}</p>

          <div className="cm-banner__links">
            <a href={config.links.privacyPolicy}>{text('links.privacy')}</a>
            <a href={config.links.cookiePolicy}>{text('links.cookiePolicy')}</a>
            {isCcp && (
              <a
                href={config.links.privacyPolicy}
                className="cm-banner__ccpa"
                data-ccpa-notice="true"
              >
                {text('banner.ccpaNotice')}
              </a>
            )}
          </div>
        </div>

        <div className="cm-banner__actions">
          {isCcp ? (
            <>
              <button type="button" className="cm-btn cm-btn--ghost" onClick={consent.openPreferences}>
                {text('banner.manage')}
              </button>
              <button
                type="button"
                className="cm-btn cm-btn--ghost"
                onClick={consent.rejectAll}
                title="Opt out of all non-essential cookies and data sharing"
              >
                {text('banner.rejectAll')}
              </button>
              <button type="button" className="cm-btn cm-btn--primary" onClick={consent.acceptAll}>
                {text('banner.acceptAll')}
              </button>
            </>
          ) : (
            <>
              <button type="button" className="cm-btn cm-btn--ghost" onClick={consent.rejectAll}>
                {text('banner.rejectAll')}
              </button>
              <button type="button" className="cm-btn cm-btn--ghost" onClick={consent.openPreferences}>
                {text('banner.manage')}
              </button>
              <button type="button" className="cm-btn cm-btn--primary" onClick={consent.acceptAll}>
                {text('banner.acceptAll')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
