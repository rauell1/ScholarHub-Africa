/**
 * Consent domain types - shared by the end-user environment, the admin
 * environment, API routes and the storage layer.
 */

export type ConsentRegion = 'gdpr' | 'ccpa' | 'none';

export type ConsentCategory = 'necessary' | 'analytics' | 'marketing' | 'preferences';

export type CategoryState = Record<ConsentCategory, boolean>;

/** Persisted user consent state. */
export interface ConsentState {
  categories: CategoryState;
  region: ConsentRegion;
  /** Machine-readable consent string (Google Consent Mode v2 representation). */
  consentString: string;
  /** IAB TCF 2.3 TC string (empty when not applicable). */
  tcfString: string;
  /** Schema version - bump to invalidate stale stored consents. */
  version: number;
  accepted: boolean;
  timestamp: string;
  language: string;
}

/** One row of the compliance audit log. */
export interface ConsentLogEntry {
  id: string;
  /** Anonymised IP: truncated to first 3 octets + HMAC fingerprint. */
  anonymizedIp: string;
  timestamp: string;
  geolocation: {
    country: string;
    region: ConsentRegion;
  };
  consentString: string;
  tcfString?: string;
  state: CategoryState;
  accepted: boolean;
  version: number;
  language: string;
}

export type ConsentStatus = 'undetermined' | 'accepted' | 'rejected' | 'partial';

/** Config that customises the banner (edited in the Admin Customization Engine). */
export interface ConsentConfig {
  theme: {
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    textColor: string;
    buttonTextColor: string;
    radius: number;
  };
  typography: {
    fontFamily: string;
    baseSize: number;
  };
  layout: {
    position: 'bottom' | 'top';
    showShield: boolean;
  };
  language: string;
  texts: Record<string, Partial<Record<ConsentTextKey, string>>>;
  company: {
    name: string;
    domain: string;
    contactEmail: string;
    dpoEmail: string;
    address: string;
  };
  links: {
    privacyPolicy: string;
    cookiePolicy: string;
    terms: string;
  };
  scripts: {
    /** GTM container (loaded when analytics AND marketing consent granted). */
    gtmId: string;
    /** Extra scripts: { id, category, src } registered with the ScriptManager. */
    custom: Array<{ id: string; category: ConsentCategory; src: string }>;
  };
  version: number;
}

export type ConsentTextKey =
  | 'banner.title'
  | 'banner.message'
  | 'banner.acceptAll'
  | 'banner.rejectAll'
  | 'banner.manage'
  | 'banner.ccpaNotice'
  | 'modal.title'
  | 'modal.description'
  | 'modal.save'
  | 'modal.cancel'
  | 'modal.close'
  | 'category.necessary'
  | 'category.necessaryDesc'
  | 'category.analytics'
  | 'category.analyticsDesc'
  | 'category.marketing'
  | 'category.marketingDesc'
  | 'category.preferences'
  | 'category.preferencesDesc'
  | 'shield.aria'
  | 'links.privacy'
  | 'links.cookiePolicy'
  | 'links.terms';
