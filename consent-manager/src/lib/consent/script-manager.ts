/**
 * Script injection manager — enforces auto-blocking.
 *
 * Rules:
 *   • Any <script data-consent-category="..."> found in the DOM at boot is
 *     REMOVED and queued (its source/inline content preserved) until the
 *     user's consent for that category becomes true.
 *   • Registered scripts (GTM, custom trackers from the admin config) are
 *     only injected when their category is allowed.
 *   • When consent for a category is revoked, injected scripts are removed
 *     and the window is re-pinged via the 'sh:consent' event so integrations
 *     can self-disable.
 */
import type { ConsentCategory, ConsentState } from './types';

interface QueuedScript {
  id: string;
  category: ConsentCategory;
  src?: string;
  inline?: string;
  attributes: Record<string, string>;
}

const ATTRIBUTE_PREFIX = 'data-consent-';

export class ScriptManager {
  private queue: QueuedScript[] = [];
  private injected = new Set<string>();
  private static instance: ScriptManager | null = null;

  static getInstance(): ScriptManager {
    if (!ScriptManager.instance) ScriptManager.instance = new ScriptManager();
    return ScriptManager.instance;
  }

  /** Scan the DOM for consent-gated scripts and take them out of the DOM. */
  capture(): void {
    if (typeof document === 'undefined') return;
    document
      .querySelectorAll<HTMLScriptElement>('script[data-consent-category]')
      .forEach((node) => {
        const category = node.dataset.consentCategory as ConsentCategory | undefined;
        if (!category) return;
        const id = node.dataset.scriptId || `${category}-${this.queue.length}`;
        const attributes: Record<string, string> = {};
        for (const attr of Array.from(node.attributes)) {
          if (attr.name.startsWith(ATTRIBUTE_PREFIX) || attr.name === 'src') continue;
          attributes[attr.name] = attr.value;
        }
        // `type="text/plain"` markers never execute — they become real
        // scripts only when injected by this manager after consent.
        if (node.type && node.type !== 'text/javascript') {
          attributes.type = 'text/javascript';
        }
        this.queue.push({
          id,
          category,
          src: node.src || undefined,
          inline: node.textContent || undefined,
          attributes,
        });
        node.remove();
      });
  }

  /** Register a script programmatically (e.g. GTM from the admin config). */
  register(
    id: string,
    category: ConsentCategory,
    opts: { src?: string; inline?: string; attributes?: Record<string, string> },
  ): void {
    if (this.queue.some((s) => s.id === id)) return;
    this.queue.push({
      id,
      category,
      src: opts.src,
      inline: opts.inline,
      attributes: opts.attributes ?? {},
    });
  }

  /** Inject all queued scripts for categories that are allowed. */
  apply(state: ConsentState): void {
    if (typeof document === 'undefined') return;

    // Inject newly-allowed scripts.
    for (const script of this.queue) {
      const allowed = state.categories[script.category] === true;
      if (allowed && !this.injected.has(script.id)) {
        this.inject(script);
      }
    }

    // Remove scripts whose category was revoked.
    for (const script of this.queue) {
      if (!state.categories[script.category] && this.injected.has(script.id)) {
        document.getElementById(script.id)?.remove();
        this.injected.delete(script.id);
      }
    }
  }

  private inject(script: QueuedScript): void {
    const el = document.createElement('script');
    el.id = script.id;
    for (const [key, value] of Object.entries(script.attributes)) {
      el.setAttribute(key, value);
    }
    if (script.src) {
      el.async = true;
      el.src = script.src;
    } else if (script.inline) {
      el.textContent = script.inline;
    }
    document.body.appendChild(el);
    this.injected.add(script.id);
  }
}

/** Global event + window bridge for non-React integrations. */
export function publishConsentChange(state: ConsentState): void {
  if (typeof window === 'undefined') return;
  window.__consent = state;
  window.dispatchEvent(
    new CustomEvent('sh:consent', { detail: state }),
  );
}
