import type { MetadataRoute } from 'next';

import { site } from '@/lib/site';

/**
 * robots.txt - parity with templates/robots.txt (AEO track 2.3):
 * all major search engines AND AI search crawlers explicitly allowed;
 * private/admin/API endpoints stay out of the index.
 */
export default function robots(): MetadataRoute.Robots {
  const privatePaths = ['/admin/', '/api/', '/accounts/', '/tracker/'];

  const rules = [
    { userAgent: '*', allow: '/', disallow: privatePaths },
    { userAgent: 'GPTBot', allow: '/', disallow: privatePaths },
    { userAgent: 'ChatGPT-User', allow: '/' },
    { userAgent: 'ClaudeBot', allow: '/', disallow: ['/admin/', '/api/'] },
    { userAgent: 'PerplexityBot', allow: '/', disallow: ['/admin/', '/api/'] },
    { userAgent: 'Google-Extended', allow: '/' },
    { userAgent: 'anthropic-ai', allow: '/' },
    { userAgent: 'cohere-ai', allow: '/' },
    { userAgent: 'Bytespider', allow: '/' },
  ];

  return {
    rules,
    sitemap: `${site.url}/sitemap.xml`,
  };
}
