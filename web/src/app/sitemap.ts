import type { MetadataRoute } from 'next';

import { site } from '@/lib/site';

/**
 * sitemap.xml - parity with apps/scholarships/sitemaps.py.
 *
 * M1: static, canonical, indexable URLs only (query-string variants excluded,
 * exactly like Django). Phase 4 adds every active scholarship detail page with
 * lastmod=updated_at and the same priority/changefreq as ScholarshipSitemap.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${site.url}/`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${site.url}/scholarships/`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${site.url}/scholarships/country/`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${site.url}/scholarships/field/`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${site.url}/about/`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${site.url}/faq/`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${site.url}/contact/`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${site.url}/case-studies/`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${site.url}/privacy/`, changeFrequency: 'yearly', priority: 0.8 },
  ];

  // TODO(Phase 4): append active scholarship detail pages from the DB
  // (SELECT slug, updated_at FROM scholarships WHERE is_active)
  return staticUrls;
}
