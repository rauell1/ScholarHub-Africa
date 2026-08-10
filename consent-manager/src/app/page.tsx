'use client';

/**
 * Demo end-user page.
 *
 * Includes consent-gated scripts (analytics + marketing categories) that the
 * ScriptManager auto-blocks until the user grants consent. The state readout
 * below lets you verify the full flow: banner → choice → scripts fire →
 * consent recorded.
 */
import { useEffect, useState } from 'react';

import { useConsentContext } from '@/components/end-user/ConsentProvider';

export default function DemoPage() {
  const { config, consent } = useConsentContext();
  const [analyticsFired, setAnalyticsFired] = useState(false);
  const [marketingFired, setMarketingFired] = useState(false);

  // Observe the demo trackers (fired by the gated inline scripts).
  useEffect(() => {
    const tick = () => {
      setAnalyticsFired(Boolean((window as unknown as Record<string, boolean>).__demoAnalyticsFired));
      setMarketingFired(Boolean((window as unknown as Record<string, boolean>).__demoMarketingFired));
    };
    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="demo">
      <section className="demo-hero">
        <h1>ScholarHub Africa</h1>
        <p>
          Fully-funded master's scholarships for African students - with a
          GDPR &amp; CCPA-compliant consent layer.
        </p>
        <a className="demo-cta" href="/admin/consent-manager">
          Open Admin Environment →
        </a>
      </section>

      {/* Consent-gated scripts - auto-blocked until the user consents.
          They are declared as `type="text/plain"` so the browser NEVER
          executes them; the ScriptManager captures them on boot and
          re-injects them as executable scripts only when the matching
          category is granted. */}
      <script type="text/plain" data-consent-category="analytics" data-script-id="demo-analytics">
        {`(function(){ window.__demoAnalyticsFired = true; console.info('[consent] analytics script executed'); })();`}
      </script>
      <script type="text/plain" data-consent-category="marketing" data-script-id="demo-marketing">
        {`(function(){ window.__demoMarketingFired = true; console.info('[consent] marketing script executed'); })();`}
      </script>

      <section className="demo-card">
        <h2>Live consent state</h2>
        <dl className="demo-state">
          <div>
            <dt>Status</dt>
            <dd>
              <span className={`demo-chip demo-chip--${consent.status}`}>{consent.status}</span>
            </dd>
          </div>
          <div>
            <dt>Region</dt>
            <dd>
              {consent.region ? consent.region.toUpperCase() : 'resolving…'}
              {consent.region === 'gdpr' && <em> - strict opt-in (GDPR)</em>}
              {consent.region === 'ccpa' && <em> - opt-out (CCPA)</em>}
            </dd>
          </div>
          <div>
            <dt>Categories</dt>
            <dd className="demo-mono">
              {consent.categories
                ? Object.entries(consent.categories)
                    .map(([key, value]) => `${key[0].toUpperCase()}:${value ? '1' : '0'}`)
                    .join(' · ')
                : '-'}
            </dd>
          </div>
          <div>
            <dt>Consent string</dt>
            <dd className="demo-mono demo-truncate">{consent.consentString || '-'}</dd>
          </div>
          <div>
            <dt>TC string (TCF 2.3)</dt>
            <dd className="demo-mono demo-truncate">{consent.tcfString || '(not applicable - non-GDPR region)'}</dd>
          </div>
        </dl>
      </section>

      <section className="demo-grid">
        <div className={`demo-card ${analyticsFired ? 'demo-card--fired' : ''}`}>
          <h2>📊 Analytics tracker</h2>
          <p>
            This script carries <code>data-consent-category="analytics"</code>.
            It stays blocked until you accept the Analytics category.
          </p>
          <p className="demo-status">
            {analyticsFired ? '✅ Executed - analytics consent granted' : '⏸ Blocked - awaiting consent'}
          </p>
        </div>

        <div className={`demo-card ${marketingFired ? 'demo-card--fired' : ''}`}>
          <h2>🎯 Marketing tracker</h2>
          <p>
            This script carries <code>data-consent-category="marketing"</code>.
            It stays blocked until you accept the Marketing category.
          </p>
          <p className="demo-status">
            {marketingFired ? '✅ Executed - marketing consent granted' : '⏸ Blocked - awaiting consent'}
          </p>
        </div>
      </section>

      <section className="demo-card demo-card--muted">
        <h2>Try the flow</h2>
        <ol className="demo-steps">
          <li>
            The banner appears only when <strong>no prior consent</strong> is stored. Choose
            “Reject non-essential” - the trackers above stay blocked.
          </li>
          <li>
            Reopen preferences via the <strong>floating shield</strong> and enable Analytics -
            the script executes immediately and the state updates.
          </li>
          <li>
            Reset by clearing <code>localStorage</code> / cookies, or check the consent log in the{' '}
            <a href="/admin/consent-manager">Admin Environment</a>.
          </li>
        </ol>
        <p className="demo-muted">
          Default language: <strong>{config.language}</strong> · Banner position:{' '}
          <strong>{config.layout.position}</strong> · Primary:{' '}
          <span className="demo-swatch" style={{ background: config.theme.primaryColor }} />{' '}
          {config.theme.primaryColor}
        </p>
      </section>
    </main>
  );
}
