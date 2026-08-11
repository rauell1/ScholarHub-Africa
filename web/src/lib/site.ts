import { env } from './env';

/**
 * Site-wide identity constants - parity with the Django context processor
 * (apps/pages/context_processors.py `site_settings`), minus the request-
 * scoped pieces (ga4_allowed is computed per-request from the consent cookie).
 */
export const site = {
  name: 'ScholarHub Africa',
  tagline:
    "Fully-funded master's scholarships for African students - human-verified, scored for fit.",
  domain: env.SITE_DOMAIN,
  url: env.SITE_URL,
  email: env.SITE_EMAIL,
  phone: env.SITE_PHONE,
  address: env.SITE_ADDRESS,
  hours: 'Mon–Fri, 9:00–18:00 EAT',
  ga4MeasurementId: env.GA4_MEASUREMENT_ID ?? '',
} as const;

export type Site = typeof site;
