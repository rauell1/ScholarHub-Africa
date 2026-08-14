import type { MetadataRoute } from 'next';

import { getSitemapScholarships } from '@/lib/queries';
import { site } from '@/lib/site';

/**
 * sitemap.xml - parity with apps/scholarships/sitemaps.py.
 *
 * Static canonical URLs plus every active scholarship detail page with
 * lastmod=updated_at (ScholarshipSitemap parity: weekly, priority 0.8).
 * Query-string variants are deliberately excluded (not canonical).
 * Falls back to the static list when the DB is unreachable (preview builds).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticUrls: MetadataRoute.Sitemap = [
    { url: `${site.url}/`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${site.url}/scholarships/`, changeFrequency: 'daily', priority: 1.0 },
    { url: `${site.url}/scholarships/country/`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${site.url}/scholarships/field/`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${site.url}/scholarships/calendar/`, changeFrequency: 'daily', priority: 0.7 },
    // Blog
    { url: `${site.url}/blog/`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${site.url}/blog/how-to-write-a-motivation-letter/`, changeFrequency: 'monthly', priority: 0.7, lastModified: new Date('2025-06-12') },
    { url: `${site.url}/blog/gpa-below-3-can-you-still-win-a-scholarship/`, changeFrequency: 'monthly', priority: 0.7, lastModified: new Date('2025-07-03') },
    { url: `${site.url}/blog/daad-vs-chevening-vs-erasmus/`, changeFrequency: 'monthly', priority: 0.7, lastModified: new Date('2025-08-20') },
    { url: `${site.url}/blog/study-in-germany-guide/`, changeFrequency: 'monthly', priority: 0.7, lastModified: new Date('2025-09-15') },
    // Destination guides
    { url: `${site.url}/destinations/`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${site.url}/destinations/germany/`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${site.url}/destinations/united-kingdom/`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${site.url}/destinations/netherlands/`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${site.url}/destinations/france/`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${site.url}/destinations/united-states/`, changeFrequency: 'monthly', priority: 0.7 },
    // Company
    { url: `${site.url}/about/`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${site.url}/faq/`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${site.url}/contact/`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${site.url}/case-studies/`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${site.url}/privacy/`, changeFrequency: 'yearly', priority: 0.5 },
  ];

  try {
    const rows = await getSitemapScholarships();
    const scholarshipUrls: MetadataRoute.Sitemap = rows.map((row) => ({
      url: `${site.url}/scholarships/${row.slug}/`,
      changeFrequency: 'weekly',
      priority: 0.8,
      lastModified: row.updatedAt,
    }));
    return [...staticUrls, ...scholarshipUrls];
  } catch {
    return staticUrls;
  }
}
