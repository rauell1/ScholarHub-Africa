'use client';

/**
 * Customization Engine — colors, fonts, layout and per-language text for the
 * end-user banner. Persisted via PUT /api/admin/config.
 */
import { useEffect, useState } from 'react';

import { LANGUAGE_NAMES, SUPPORTED_LANGUAGES, t, type LanguageCode } from '@/lib/consent/i18n';
import type { ConsentConfig, ConsentTextKey } from '@/lib/consent/types';

const FONT_OPTIONS = [
  { label: 'Inter (modern)', value: "'Inter', system-ui, sans-serif" },
  { label: 'System UI', value: 'system-ui, -apple-system, sans-serif' },
  { label: 'Georgia (serif)', value: "Georgia, 'Times New Roman', serif" },
  { label: 'Roboto', value: "'Roboto', sans-serif" },
  { label: 'Merriweather (editorial)', value: "'Merriweather', Georgia, serif" },
  { label: 'JetBrains Mono (technical)', value: "'JetBrains Mono', monospace" },
];

const TEXT_FIELDS: ConsentTextKey[] = [
  'banner.title',
  'banner.message',
  'banner.acceptAll',
  'banner.rejectAll',
  'banner.manage',
  'banner.ccpaNotice',
  'modal.title',
  'modal.description',
  'modal.save',
  'category.necessary',
  'category.necessaryDesc',
  'category.analytics',
  'category.analyticsDesc',
  'category.marketing',
  'category.marketingDesc',
  'category.preferences',
  'category.preferencesDesc',
];

export function CustomizationEngine() {
  const [config, setConfig] = useState<ConsentConfig | null>(null);
  const [saved, setSaved] = useState(false);
  const [editingLanguage, setEditingLanguage] = useState<string>('en');

  useEffect(() => {
    fetch('/api/admin/config')
      .then((r) => r.json())
      .then(setConfig);
  }, []);

  if (!config) return <div className="admin-panel">Loading configuration…</div>;

  const patch = (partial: Partial<ConsentConfig>) => {
    setConfig({ ...config, ...partial });
    setSaved(false);
  };
  const patchTheme = (partial: Partial<ConsentConfig['theme']>) =>
    patch({ theme: { ...config.theme, ...partial } });

  async function persist() {
    const res = await fetch('/api/admin/config', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  }

  const editingTexts = config.texts[editingLanguage] ?? {};

  return (
    <div className="admin-panel">
      <div className="admin-panel__header">
        <h1>Customization Engine</h1>
        <p>Edit the end-user banner’s appearance and text. Changes apply live to every visitor.</p>
      </div>

      <div className="admin-grid">
        {/* Theme */}
        <section className="admin-card">
          <h2>Colors</h2>
          <div className="admin-form">
            <ColorField label="Primary" value={config.theme.primaryColor} onChange={(v) => patchTheme({ primaryColor: v })} />
            <ColorField label="Accent" value={config.theme.accentColor} onChange={(v) => patchTheme({ accentColor: v })} />
            <ColorField label="Background" value={config.theme.backgroundColor} onChange={(v) => patchTheme({ backgroundColor: v })} />
            <ColorField label="Text" value={config.theme.textColor} onChange={(v) => patchTheme({ textColor: v })} />
            <ColorField label="Button text" value={config.theme.buttonTextColor} onChange={(v) => patchTheme({ buttonTextColor: v })} />
            <label className="admin-field">
              <span>Corner radius (px)</span>
              <input
                type="range"
                min={0}
                max={24}
                value={config.theme.radius}
                onChange={(e) => patchTheme({ radius: Number(e.target.value) })}
              />
              <em>{config.theme.radius}px</em>
            </label>
          </div>
        </section>

        {/* Typography & layout */}
        <section className="admin-card">
          <h2>Typography & layout</h2>
          <div className="admin-form">
            <label className="admin-field">
              <span>Font family</span>
              <select
                value={config.typography.fontFamily}
                onChange={(e) => patch({ typography: { ...config.typography, fontFamily: e.target.value } })}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="admin-field">
              <span>Base font size ({config.typography.baseSize}px)</span>
              <input
                type="range"
                min={13}
                max={20}
                value={config.typography.baseSize}
                onChange={(e) => patch({ typography: { ...config.typography, baseSize: Number(e.target.value) } })}
              />
            </label>
            <label className="admin-field">
              <span>Banner position</span>
              <select
                value={config.layout.position}
                onChange={(e) => patch({ layout: { ...config.layout, position: e.target.value as 'bottom' | 'top' } })}
              >
                <option value="bottom">Bottom</option>
                <option value="top">Top</option>
              </select>
            </label>
            <label className="admin-field admin-field--check">
              <input
                type="checkbox"
                checked={config.layout.showShield}
                onChange={(e) => patch({ layout: { ...config.layout, showShield: e.target.checked } })}
              />
              <span>Show floating shield (reopen preferences)</span>
            </label>
            <label className="admin-field">
              <span>Default language</span>
              <select
                value={config.language}
                onChange={(e) => patch({ language: e.target.value })}
              >
                {SUPPORTED_LANGUAGES.map((code) => (
                  <option key={code} value={code}>
                    {LANGUAGE_NAMES[code] ?? code}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </section>
      </div>

      {/* Per-language texts */}
      <section className="admin-card">
        <div className="admin-card__row">
          <h2>Banner text — translations</h2>
          <select value={editingLanguage} onChange={(e) => setEditingLanguage(e.target.value)}>
            {SUPPORTED_LANGUAGES.map((code) => (
              <option key={code} value={code}>
                {LANGUAGE_NAMES[code] ?? code}
              </option>
            ))}
          </select>
        </div>
        <div className="admin-form admin-form--wide">
          {TEXT_FIELDS.map((key) => {
            const defaultValue = t(editingLanguage, key);
            const value = editingTexts[key] ?? defaultValue;
            const isOverridden = editingTexts[key] !== undefined;
            return (
              <label key={key} className="admin-field">
                <span>
                  {key} {isOverridden && <em className="admin-badge">overridden</em>}
                </span>
                <textarea
                  rows={key === 'banner.message' || key === 'modal.description' ? 3 : 1}
                  value={value}
                  placeholder={defaultValue}
                  onChange={(e) =>
                    patch({
                      texts: {
                        ...config.texts,
                        [editingLanguage]: {
                          ...(config.texts[editingLanguage] ?? {}),
                          [key]: e.target.value,
                        },
                      },
                    })
                  }
                />
                {isOverridden && (
                  <button
                    type="button"
                    className="admin-btn admin-btn--ghost"
                    onClick={() => {
                      const next = { ...config.texts };
                      const langTexts = { ...next[editingLanguage] };
                      delete langTexts[key];
                      next[editingLanguage] = langTexts;
                      patch({ texts: next });
                    }}
                  >
                    Reset to default
                  </button>
                )}
              </label>
            );
          })}
        </div>
      </section>

      <div className="admin-sticky-save">
        <button type="button" className="admin-btn admin-btn--primary" onClick={persist}>
          {saved ? '✓ Saved' : 'Save configuration'}
        </button>
      </div>
    </div>
  );
}

function ColorField({
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
      <span className="admin-color">
        <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
        />
      </span>
    </label>
  );
}
