/**
 * Consent-gated GA4 event layer (Track 1: SEO & Analytics / 1.4).
 *
 * Hard gate: nothing initialises, pushes, or observes unless the visitor has
 * granted the Analytics category (read from the Consent Manager's
 * localStorage record `sh:consent:v1`). No consent / Reject → this script
 * does nothing, so "Reject collects nothing" holds end to end:
 *   • the gtag.js snippet is server-side gated (see base.html),
 *   • every event here is additionally client-side gated.
 *
 * Events tracked (no PII in payloads):
 *   cta_click          — elements with [data-ga-event] (+ data-ga-label)
 *   outbound_link_click— external links (target=_blank or different origin)
 *   contact_form_submit— the /contact/ form
 *   search             — the directory search form
 *   ai_referrer        — when a known AI-search assistant referred the visit
 *   web_vitals         — LCP / INP / CLS via PerformanceObserver
 */
(function () {
  'use strict';

  var CONSENT_KEY = 'sh:consent:v1';

  function analyticsAllowed() {
    try {
      var raw = window.localStorage.getItem(CONSENT_KEY);
      if (!raw) return false;
      var state = JSON.parse(raw);
      return !!(state && state.categories && state.categories.analytics);
    } catch (e) {
      return false;
    }
  }

  function gtag() {
    if (typeof window.gtag === 'function') {
      window.gtag.apply(null, arguments);
    } else if (window.dataLayer) {
      window.dataLayer.push(arguments);
    }
  }

  function track(eventName, params) {
    if (!analyticsAllowed()) return;
    gtag('event', eventName, params || {});
  }

  // ── CTA clicks ───────────────────────────────────────────────────────────
  function bindCtaClicks() {
    document.querySelectorAll('[data-ga-event]').forEach(function (el) {
      el.addEventListener('click', function () {
        track(el.getAttribute('data-ga-event') || 'cta_click', {
          label: el.getAttribute('data-ga-label') || el.getAttribute('href') || '',
        });
      });
    });
  }

  // ── Outbound links ───────────────────────────────────────────────────────
  function bindOutboundLinks() {
    document.querySelectorAll('a[href]').forEach(function (el) {
      var href = el.getAttribute('href') || '';
      if (!/^https?:\/\//i.test(href)) return; // relative or non-http
      var own = window.location.origin;
      try {
        if (new URL(href, own).origin === own) return; // same-origin
      } catch (e) {
        return;
      }
      el.addEventListener('click', function () {
        track('outbound_link_click', { url: href, link_text: (el.textContent || '').trim().slice(0, 80) });
      });
    });
  }

  // ── Contact form submit ──────────────────────────────────────────────────
  function bindFormEvents() {
    var contact = document.querySelector('form[action*="contact"]');
    if (contact) {
      contact.addEventListener('submit', function () {
        track('contact_form_submit', {});
      });
    }
    var searchForms = document.querySelectorAll('form[role="search"]');
    searchForms.forEach(function (form) {
      form.addEventListener('submit', function () {
        var input = form.querySelector('input[name="q"]');
        track('search', { search_term: input ? input.value.slice(0, 100) : '' });
      });
    });
  }

  // ── AI-search referrer attribution (AEO 2.5) ─────────────────────────────
  var AI_REFERRERS = [
    'chatgpt.com', 'chat.openai.com', 'perplexity.ai', 'claude.ai',
    'gemini.google.com', 'copilot.microsoft.com', 'you.com', 'phind.com',
    'aioverview', 'google.com/search?udm=14',
  ];

  function trackAiReferrer() {
    var ref = (document.referrer || '').toLowerCase();
    for (var i = 0; i < AI_REFERRERS.length; i++) {
      if (ref.indexOf(AI_REFERRERS[i]) !== -1) {
        track('ai_referrer', { source: AI_REFERRERS[i] });
        return;
      }
    }
  }

  // ── Core Web Vitals → GA4 (LCP, INP, CLS) ────────────────────────────────
  function reportWebVitals() {
    if (!('PerformanceObserver' in window)) return;

    function send(metric, value, id) {
      track('web_vitals', {
        metric: metric,
        value: Math.round(value * (metric === 'CLS' ? 1000 : 1)) / (metric === 'CLS' ? 1000 : 1),
        metric_id: id,
        debug_target: '',
        page: window.location.pathname,
      });
    }

    try {
      var lcp = new PerformanceObserver(function (list) {
        var entry = list.getEntries().slice(-1)[0];
        if (entry) send('LCP', entry.startTime, entry.id || 'lcp');
      });
      lcp.observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (e) { /* older browsers */ }

    try {
      var inp = new PerformanceObserver(function (list) {
        var entry = list.getEntries().slice(-1)[0];
        if (entry) send('INP', entry.duration, entry.id || 'inp');
      });
      inp.observe({ type: 'event', durationThreshold: 16, buffered: true });
    } catch (e) { /* not supported */ }

    try {
      var cls = new PerformanceObserver(function (list) {
        var value = 0;
        list.getEntries().forEach(function (entry) {
          if (!entry.hadRecentInput) value += entry.value;
        });
        send('CLS', value, 'cls');
      });
      cls.observe({ type: 'layout-shift', buffered: true });
    } catch (e) { /* not supported */ }
  }

  function init() {
    if (!analyticsAllowed()) return; // hard gate — Reject / no choice → nothing
    bindCtaClicks();
    bindOutboundLinks();
    bindFormEvents();
    trackAiReferrer();
    reportWebVitals();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
