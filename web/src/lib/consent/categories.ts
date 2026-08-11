/**
 * Cookie category definitions + default script assignments.
 * The ScriptManager uses these to auto-block third-party tags.
 */
import type { ConsentCategory } from './types';

export interface CategoryDefinition {
  id: ConsentCategory;
  /** Google Consent Mode v2 storage keys mapped to this category. */
  gcmKeys: string[];
  /** IAB TCF v2 purpose IDs mapped to this category. */
  tcfPurposes: number[];
  /** Canonical host fragments treated as belonging to this category. */
  scriptPatterns: string[];
}

export const CATEGORIES: CategoryDefinition[] = [
  {
    id: 'necessary',
    gcmKeys: ['security_storage', 'functionality_storage'],
    tcfPurposes: [1],
    scriptPatterns: [],
  },
  {
    id: 'preferences',
    gcmKeys: ['personalization_storage'],
    tcfPurposes: [5, 6],
    scriptPatterns: ['onetrust', 'usercentrics', 'transcend'],
  },
  {
    id: 'analytics',
    gcmKeys: ['analytics_storage'],
    tcfPurposes: [7, 8, 9, 10],
    scriptPatterns: [
      'google-analytics.com',
      'googletagmanager.com/gtag',
      'analytics.google.com',
      'hotjar.com',
      'clarity.ms',
      'mixpanel.com',
      'segment.io',
      'amplitude.com',
      'plausible.io',
      'goatcounter.com',
      'heap.com',
      'posthog.com',
    ],
  },
  {
    id: 'marketing',
    gcmKeys: ['ad_storage', 'ad_user_data', 'ad_personalization'],
    tcfPurposes: [2, 3, 4],
    scriptPatterns: [
      'googletagmanager.com/gtm.js',
      'facebook.net',
      'connect.facebook.net',
      'fbq',
      'doubleclick.net',
      'googleadservices.com',
      'ads.linkedin.com',
      'snap.licdn.com',
      'tiktok.com/analytics',
      'static.ads-twitter.com',
      'bat.bing.com',
      'criteo',
      'taboola',
      'outbrain',
      'pinterest',
      'quantserve',
      'scorecardresearch',
      'hubspot.com',
      'intercom',
      'mailchimp',
    ],
  },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

/** Find which category a script URL / inline marker belongs to. */
export function classifyScriptSource(source: string): ConsentCategory | 'unclassified' {
  const lower = source.toLowerCase();
  for (const category of CATEGORIES) {
    for (const pattern of category.scriptPatterns) {
      if (lower.includes(pattern.toLowerCase())) return category.id;
    }
  }
  return 'unclassified';
}
