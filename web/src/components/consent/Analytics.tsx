'use client';

import { useEffect } from 'react';

import { ScriptManager } from '@/lib/consent/script-manager';
import type { ConsentState } from '@/lib/consent/types';
import { useConsentContext } from './ConsentProvider';

/**
 * Consent-gated Google Analytics 4 + event layer.
 *
 * Port of the Django app's static/js/analytics.js + the base.html gtag
 * snippet, rebuilt on the consent engine:
 *
 *   • The gtag.js script and init snippet are REGISTERED with the
 *     ScriptManager under the `analytics` category - they are only injected
 *     once the visitor grants Analytics (or had granted it before).
 *   • Every event below is additionally gated client-side on
 *     consent.categories.analytics, so "no choice / Reject → nothing is
 *     collected" holds end to end (base.html parity, Track 1.4).
 *
 * Events (no PII): cta_click, outbound_link_click, contact_form_submit,
 * search, ai_referrer, web_vitals (LCP/INP/CLS).
 */
const AI_REFERRERS = [
  'chatgpt.com', 'chat.openai.com', 'perplexity.ai', 'claude.ai',
  'gemini.google.com', 'copilot.microsoft.com', 'you.com', 'phind.com',
  'aioverview', 'google.com/search?udm=14',
];

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function pushEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window.gtag === 'function') {
    window.gtag('event', eventName, params ?? {});
  } else if (window.dataLayer) {
    window.dataLayer.push(['event', eventName, params ?? {}]);
  }
}

export function Analytics({ ga4Id }: { ga4Id: string }) {
  const { consent } = useConsentContext();
  const analyticsAllowed = consent.categories?.analytics === true;

  // Register GA4 with the ScriptManager (idempotent by script id).
  useEffect(() => {
    if (!ga4Id) return;
    const manager = ScriptManager.getInstance();
    manager.register('ga4-gtag', 'analytics', {
      src: `https://www.googletagmanager.com/gtag/js?id=${ga4Id}`,
    });
    manager.register('ga4-init', 'analytics', {
      inline:
        "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}" +
        `gtag('js',new Date());gtag('config','${ga4Id}',{anonymize_ip:true});`,
    });
  }, [ga4Id]);

  // Apply the script manager whenever the consent state settles (inject GA4
  // when granted, remove it when revoked).
  useEffect(() => {
    if (!ga4Id || consent.status === 'undetermined') return;
    const state: ConsentState = {
      categories: consent.categories ?? {
        necessary: true,
        analytics: false,
        marketing: false,
        preferences: false,
      },
      region: consent.region ?? 'none',
      consentString: consent.consentString,
      tcfString: consent.tcfString,
      version: consent.version,
      accepted: consent.status !== 'rejected',
      timestamp: new Date().toISOString(),
      language: 'en',
    };
    ScriptManager.getInstance().apply(state);
  }, [
    ga4Id,
    consent.status,
    consent.categories,
    consent.consentString,
    consent.tcfString,
    consent.region,
    consent.version,
  ]);

  // Event layer - bound only while analytics consent is granted.
  useEffect(() => {
    if (!analyticsAllowed) return;

    const onCtaClick = (event: Event) => {
      const el = event.currentTarget as HTMLElement;
      pushEvent(el.getAttribute('data-ga-event') ?? 'cta_click', {
        label: el.getAttribute('data-ga-label') ?? (el as HTMLAnchorElement).href ?? '',
      });
    };
    const onOutbound = (event: Event) => {
      const el = event.currentTarget as HTMLAnchorElement;
      const href = el.getAttribute('href') ?? '';
      if (!/^https?:\/\//i.test(href)) return;
      let own: string;
      try {
        own = new URL(href, window.location.origin).origin;
      } catch {
        return;
      }
      if (own === window.location.origin) return;
      pushEvent('outbound_link_click', {
        url: href,
        link_text: (el.textContent ?? '').trim().slice(0, 80),
      });
    };
    const onFormSubmit = (event: Event) => {
      const form = event.currentTarget as HTMLFormElement;
      const action = form.getAttribute('action') ?? '';
      if (action.includes('contact')) {
        pushEvent('contact_form_submit', {});
      }
      if (form.getAttribute('role') === 'search') {
        const input = form.querySelector<HTMLInputElement>('input[name="q"]');
        pushEvent('search', { search_term: (input?.value ?? '').slice(0, 100) });
      }
    };

    // AI-search referrer attribution (AEO 2.5).
    const referrer = (document.referrer ?? '').toLowerCase();
    const aiSource = AI_REFERRERS.find((r) => referrer.includes(r));
    if (aiSource) pushEvent('ai_referrer', { source: aiSource });

    document.querySelectorAll<HTMLElement>('[data-ga-event]').forEach((el) => {
      el.addEventListener('click', onCtaClick);
    });
    document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((el) => {
      el.addEventListener('click', onOutbound);
    });
    document.querySelectorAll<HTMLFormElement>('form').forEach((form) => {
      form.addEventListener('submit', onFormSubmit);
    });

    // Core Web Vitals → GA4 (LCP, INP, CLS).
    const observers: PerformanceObserver[] = [];
    const sendVital = (metric: string, value: number, id: string) => {
      pushEvent('web_vitals', {
        metric,
        value: metric === 'CLS' ? Math.round(value * 1000) / 1000 : Math.round(value),
        metric_id: id,
        page: window.location.pathname,
      });
    };
    if ('PerformanceObserver' in window) {
      try {
        const lcp = new PerformanceObserver((list) => {
          const entry = list.getEntries().slice(-1)[0];
          if (entry) sendVital('LCP', entry.startTime, (entry as PerformanceEntry & { id?: string }).id ?? 'lcp');
        });
        lcp.observe({ type: 'largest-contentful-paint', buffered: true });
        observers.push(lcp);
      } catch { /* older browsers */ }
      try {
        const inp = new PerformanceObserver((list) => {
          const entry = list.getEntries().slice(-1)[0];
          if (entry) sendVital('INP', entry.duration, (entry as PerformanceEntry & { id?: string }).id ?? 'inp');
        });
        inp.observe({
          type: 'event',
          durationThreshold: 16,
          buffered: true,
        } as PerformanceObserverInit);
        observers.push(inp);
      } catch { /* not supported */ }
      try {
        const cls = new PerformanceObserver((list) => {
          let value = 0;
          list.getEntries().forEach((entry) => {
            const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value: number };
            if (!shift.hadRecentInput) value += shift.value;
          });
          sendVital('CLS', value, 'cls');
        });
        cls.observe({ type: 'layout-shift', buffered: true });
        observers.push(cls);
      } catch { /* not supported */ }
    }

    return () => {
      document.querySelectorAll<HTMLElement>('[data-ga-event]').forEach((el) => {
        el.removeEventListener('click', onCtaClick);
      });
      document.querySelectorAll<HTMLAnchorElement>('a[href]').forEach((el) => {
        el.removeEventListener('click', onOutbound);
      });
      document.querySelectorAll<HTMLFormElement>('form').forEach((form) => {
        form.removeEventListener('submit', onFormSubmit);
      });
      observers.forEach((observer) => observer.disconnect());
    };
  }, [analyticsAllowed]);

  return null;
}
