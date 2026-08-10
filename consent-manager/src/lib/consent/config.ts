/**
 * Default banner configuration object.
 *
 * The Admin Customization Engine reads/writes this shape via
 * `GET/PUT /api/admin/config`; overrides are persisted server-side in
 * `data/config.json` and merged on top of these defaults at runtime.
 */
import type { ConsentConfig } from './types';

export const DEFAULT_CONFIG: ConsentConfig = {
  theme: {
    primaryColor: '#1F3864', // deep navy
    accentColor: '#1ABC9C', // teal
    backgroundColor: '#FFFFFF',
    textColor: '#1F2937',
    buttonTextColor: '#FFFFFF',
    radius: 12,
  },
  typography: {
    fontFamily: "'Inter', system-ui, sans-serif",
    baseSize: 16,
  },
  layout: {
    position: 'bottom',
    showShield: true,
  },
  language: 'en',
  texts: {},
  company: {
    name: 'ScholarHub Africa',
    domain: 'scholarhub.africa',
    contactEmail: 'hello@scholarhub.africa',
    dpoEmail: 'dpo@scholarhub.africa',
    address: 'Nairobi, Kenya',
  },
  links: {
    privacyPolicy: '/privacy',
    cookiePolicy: '/cookies',
    terms: '/terms',
  },
  scripts: {
    gtmId: '', // e.g. 'GTM-XXXXXXX' - injected only after consent
    custom: [],
  },
  version: 1,
};
