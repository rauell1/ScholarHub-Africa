/**
 * Automatic Cookie & Tracker Scan.
 *
 * Two modes:
 *   1. `scanUrl(url)`        - fetches a page and statically inspects its
 *      <script>, <img>, <iframe> and <link> tags, classifying each against
 *      the known-tracker database (categories.ts).
 *   2. `scanDom()`           - runs in the browser on the current page.
 *   3. `scanWithHeadless(url)`- hook for a real headless browser (Puppeteer/
 *      Playwright) that executes JS and enumerates actually-set cookies.
 *
 * The admin "Scan" button calls the API route, which runs mode 1 (+ mode 3
 * if a headless endpoint is configured).
 */
import { classifyScriptSource, CATEGORY_IDS } from '@/lib/consent/categories';
import type { ConsentCategory } from '@/lib/consent/types';

export interface DetectedTracker {
  url: string;
  type: 'script' | 'image' | 'iframe' | 'stylesheet' | 'inline-script';
  category: ConsentCategory | 'unclassified';
  source: string;
}

export interface ScanResult {
  scannedAt: string;
  url: string;
  trackers: DetectedTracker[];
  byCategory: Record<string, number>;
  cookies?: Array<{ name: string; domain: string; category: ConsentCategory | 'unclassified' }>;
  headless: boolean;
}

const TRACKER_TAG_RE = /(google|gtm|gtag|facebook|fbq|analytics|track|pixel|ads|doubleclick|hotjar|clarity|hubspot|intercom|segment|mixpanel|amplitude|tiktok|twitter|linkedin|bing|taboola|outbrain|criteo|pinterest|quantserve|scorecard)/i;

function classifyFromSrc(src: string): ConsentCategory | 'unclassified' {
  const category = classifyScriptSource(src);
  if (category !== 'unclassified') return category;
  return TRACKER_TAG_RE.test(src) ? 'unclassified' : 'unclassified';
}

/** Static scan of a page's HTML for third-party tags. */
export async function scanUrl(url: string): Promise<ScanResult> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ScholarHub-ConsentScanner/1.0' },
    signal: AbortSignal.timeout(15_000),
  });
  const html = await res.text();

  const trackers: DetectedTracker[] = [];

  // <script src="...">
  for (const match of html.matchAll(/<script[^>]*src=["']([^"']+)["'][^>]*>/gi)) {
    const src = match[1];
    trackers.push({ url: src, type: 'script', category: classifyScriptSource(src), source: src });
  }
  // <script> inline (no src) - sample for tracker keywords
  for (const match of html.matchAll(/<script(?![^>]*src)[^>]*>([^<]{0,200})/gi)) {
    const body = match[1];
    if (/fbq|gtag|dataLayer|analytics|tracking/i.test(body)) {
      trackers.push({
        url: '(inline)',
        type: 'inline-script',
        category: classifyScriptSource(
          /fbq/i.test(body) ? 'facebook' : /dataLayer|gtag/i.test(body) ? 'googletagmanager' : 'analytics',
        ),
        source: body.slice(0, 120),
      });
    }
  }
  // <img> tracking pixels
  for (const match of html.matchAll(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi)) {
    const src = match[1];
    if (TRACKER_TAG_RE.test(src) || src.includes('pixel')) {
      trackers.push({ url: src, type: 'image', category: classifyScriptSource(src), source: src });
    }
  }
  // <iframe>
  for (const match of html.matchAll(/<iframe[^>]*src=["']([^"']+)["'][^>]*>/gi)) {
    const src = match[1];
    if (TRACKER_TAG_RE.test(src)) {
      trackers.push({ url: src, type: 'iframe', category: classifyScriptSource(src), source: src });
    }
  }
  // <link rel="stylesheet"> from third-party hosts (attribute-order agnostic)
  for (const match of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = match[0];
    if (!/rel=["']stylesheet["']/i.test(tag)) continue;
    const href = /href=["']([^"']+)["']/i.exec(tag)?.[1];
    if (!href) continue;
    try {
      const host = new URL(href).hostname;
      const ownHost = new URL(url).hostname;
      if (host !== ownHost) {
        trackers.push({ url: href, type: 'stylesheet', category: classifyScriptSource(href), source: href });
      }
    } catch {
      /* relative URL - skip */
    }
  }

  const byCategory: Record<string, number> = {};
  for (const id of [...CATEGORY_IDS, 'unclassified']) byCategory[id] = 0;
  for (const t of trackers) byCategory[t.category] = (byCategory[t.category] ?? 0) + 1;

  return {
    scannedAt: new Date().toISOString(),
    url,
    trackers,
    byCategory,
    headless: false,
  };
}

/** Scan the current page from the browser console (admin convenience). */
export function scanDom(): DetectedTracker[] {
  if (typeof document === 'undefined') return [];
  const trackers: DetectedTracker[] = [];
  document.querySelectorAll('script[src]').forEach((el) => {
    const src = el.getAttribute('src') ?? '';
    trackers.push({ url: src, type: 'script', category: classifyScriptSource(src), source: src });
  });
  document.querySelectorAll('img[src]').forEach((el) => {
    const src = el.getAttribute('src') ?? '';
    if (TRACKER_TAG_RE.test(src)) {
      trackers.push({ url: src, type: 'image', category: classifyScriptSource(src), source: src });
    }
  });
  return trackers;
}

/**
 * Headless hook - when a Puppeteer/Playwright service is available
 * (e.g. a Railway worker), call it to enumerate cookies actually set
 * after JS execution. Returns an empty list when not configured.
 */
export async function scanWithHeadless(url: string): Promise<ScanResult['cookies']> {
  const endpoint = process.env.HEADLESS_SCANNER_URL;
  if (!endpoint) return undefined;
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) return undefined;
    const data = (await res.json()) as ScanResult['cookies'];
    return data;
  } catch {
    return undefined;
  }
}
