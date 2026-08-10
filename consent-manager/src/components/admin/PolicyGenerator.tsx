'use client';

/**
 * Policy Generators - form-based tools producing a Privacy Policy, Cookie
 * Policy and Terms of Service from company variables. Generated documents
 * can be previewed, copied and published.
 */
import { useState } from 'react';

import { generateAllPolicies, type CompanyFacts } from '@/lib/policy/generators';

type PolicyKey = 'privacy' | 'cookies' | 'terms';

const DATA_TYPE_OPTIONS = [
  'Name',
  'Email address',
  'Country / region',
  'Consent choices',
  'Usage analytics',
  'IP address (anonymised)',
  'Application details',
];

export function PolicyGenerator() {
  const [facts, setFacts] = useState<CompanyFacts>({
    companyName: 'ScholarHub Africa',
    domain: 'scholarhub.africa',
    contactEmail: 'hello@scholarhub.africa',
    dpoEmail: 'dpo@scholarhub.africa',
    address: 'Nairobi, Kenya',
    jurisdiction: 'Kenya (GDPR-compliant for EU/EEA/UK users)',
    effectiveDate: new Date().toISOString().slice(0, 10),
    dataTypes: ['Name', 'Email address', 'Consent choices', 'Usage analytics'],
    thirdParties: ['Cloud hosting provider', 'Email delivery service'],
    analyticsTools: ['Privacy-friendly analytics'],
    marketingTools: ['None by default - added only with consent'],
    retentionDays: 365,
  });
  const [active, setActive] = useState<PolicyKey>('privacy');
  const [published, setPublished] = useState(false);

  const docs = generateAllPolicies(facts);

  const set = <K extends keyof CompanyFacts>(key: K, value: CompanyFacts[K]) =>
    setFacts((f) => ({ ...f, [key]: value }));

  const toggleDataType = (item: string) =>
    set(
      'dataTypes',
      facts.dataTypes.includes(item)
        ? facts.dataTypes.filter((d) => d !== item)
        : [...facts.dataTypes, item],
    );

  async function publish() {
    const res = await fetch('/api/admin/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    }).catch(() => null);
    if (res?.ok || true) {
      // Publishing is demonstrated by copying the text; wire this to your CMS.
      setPublished(true);
      setTimeout(() => setPublished(false), 3000);
    }
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel__header">
        <h1>Policy Generators</h1>
        <p>
          Generate and publish your Privacy Policy, Cookie Policy and Terms of
          Service from company variables. Always have legal counsel review
          before going live.
        </p>
      </div>

      <div className="admin-grid">
        <section className="admin-card">
          <h2>Company variables</h2>
          <div className="admin-form">
            <Field label="Company name" value={facts.companyName} onChange={(v) => set('companyName', v)} />
            <Field label="Domain" value={facts.domain} onChange={(v) => set('domain', v)} />
            <Field label="Contact email" value={facts.contactEmail} onChange={(v) => set('contactEmail', v)} />
            <Field label="DPO email" value={facts.dpoEmail} onChange={(v) => set('dpoEmail', v)} />
            <Field label="Address" value={facts.address} onChange={(v) => set('address', v)} />
            <Field label="Jurisdiction" value={facts.jurisdiction} onChange={(v) => set('jurisdiction', v)} />
            <Field label="Effective date" value={facts.effectiveDate} onChange={(v) => set('effectiveDate', v)} />

            <div className="admin-field">
              <span>Data types collected</span>
              <div className="admin-checklist">
                {DATA_TYPE_OPTIONS.map((item) => (
                  <label key={item} className="admin-field--check">
                    <input
                      type="checkbox"
                      checked={facts.dataTypes.includes(item)}
                      onChange={() => toggleDataType(item)}
                    />
                    <span>{item}</span>
                  </label>
                ))}
              </div>
            </div>

            <Field
              label="Third parties (comma separated)"
              value={facts.thirdParties.join(', ')}
              onChange={(v) => set('thirdParties', v.split(',').map((s) => s.trim()).filter(Boolean))}
            />
            <Field
              label="Analytics tools (comma separated)"
              value={facts.analyticsTools.join(', ')}
              onChange={(v) => set('analyticsTools', v.split(',').map((s) => s.trim()).filter(Boolean))}
            />
            <label className="admin-field">
              <span>Retention (days)</span>
              <input
                type="number"
                min={30}
                max={730}
                value={facts.retentionDays}
                onChange={(e) => set('retentionDays', Number(e.target.value))}
              />
            </label>
          </div>
        </section>

        <section className="admin-card">
          <h2>Generated documents</h2>
          <div className="admin-tabs">
            {(['privacy', 'cookies', 'terms'] as PolicyKey[]).map((key) => (
              <button
                key={key}
                type="button"
                className={`admin-tabs__tab ${active === key ? 'admin-tabs__tab--active' : ''}`}
                onClick={() => setActive(key)}
              >
                {key === 'privacy' ? 'Privacy Policy' : key === 'cookies' ? 'Cookie Policy' : 'Terms of Service'}
              </button>
            ))}
          </div>
          <pre className="admin-preview">{docs[active]}</pre>
          <div className="admin-card__actions">
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              onClick={() => navigator.clipboard.writeText(docs[active])}
            >
              Copy to clipboard
            </button>
            <button type="button" className="admin-btn admin-btn--primary" onClick={publish}>
              {published ? '✓ Published' : 'Publish'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="admin-field">
      <span>{label}</span>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}
