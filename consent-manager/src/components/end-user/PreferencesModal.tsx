'use client';

/**
 * Preferences modal — fine-grained category toggles.
 * "Necessary" is locked ON and cannot be disabled.
 */
import { useState } from 'react';

import { t } from '@/lib/consent/i18n';
import type { CategoryState } from '@/lib/consent/types';
import { useConsentContext } from './ConsentProvider';

export function PreferencesModal() {
  const { config, consent } = useConsentContext();
  const [draft, setDraft] = useState<CategoryState | null>(null);

  if (!consent.preferencesOpen) return null;

  const lang = config.language;
  const text = (key: Parameters<typeof t>[1]) => t(lang, key, config.texts);

  const base: CategoryState = draft ?? consent.categories ?? {
    necessary: true,
    analytics: false,
    marketing: false,
    preferences: false,
  };
  const current = { ...base, necessary: true };

  const toggle = (key: keyof CategoryState) => {
    if (key === 'necessary') return; // locked ON
    setDraft({ ...current, [key]: !current[key] });
  };

  const categories: Array<{ key: keyof CategoryState; locked?: boolean }> = [
    { key: 'necessary', locked: true },
    { key: 'analytics' },
    { key: 'marketing' },
    { key: 'preferences' },
  ];

  return (
    <div
      className="cm-modal-backdrop"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) consent.closePreferences();
      }}
    >
      <div className="cm-modal" role="dialog" aria-modal="true" aria-labelledby="cm-modal-title">
        <div className="cm-modal__header">
          <h2 id="cm-modal-title">{text('modal.title')}</h2>
          <button
            type="button"
            className="cm-btn cm-btn--icon"
            onClick={consent.closePreferences}
            aria-label={text('modal.close')}
          >
            ✕
          </button>
        </div>

        <p className="cm-modal__description">{text('modal.description')}</p>

        <div className="cm-modal__categories">
          {categories.map(({ key, locked }) => (
            <label key={key} className={`cm-category ${locked ? 'cm-category--locked' : ''}`}>
              <span className="cm-category__body">
                <span className="cm-category__name">
                  {text(`category.${key}`)}
                  {locked && <span className="cm-category__lock" title="Always active">🔒</span>}
                </span>
                <span className="cm-category__desc">{text(`category.${key}Desc`)}</span>
              </span>
              <span className="cm-switch">
                <input
                  type="checkbox"
                  role="switch"
                  checked={current[key]}
                  disabled={locked}
                  onChange={() => toggle(key)}
                />
                <span className="cm-switch__track" aria-hidden="true" />
              </span>
            </label>
          ))}
        </div>

        <div className="cm-modal__footer">
          <a className="cm-link" href={config.links.cookiePolicy}>
            {text('links.cookiePolicy')}
          </a>
          <div className="cm-modal__actions">
            <button type="button" className="cm-btn cm-btn--ghost" onClick={consent.closePreferences}>
              {text('modal.cancel')}
            </button>
            <button
              type="button"
              className="cm-btn cm-btn--primary"
              onClick={() => consent.savePreferences(current)}
            >
              {text('modal.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
