import path from 'path';

import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

/**
 * ScholarHub Africa - Next.js configuration.
 *
 * Migration guardrails (docs/MIGRATION_PLAN.md §2):
 * - trailingSlash: true keeps 1:1 URL parity with Django (/scholarships/, /about/…)
 *   so no indexed URL changes on cutover (zero 301 chains, zero SEO loss).
 * - outputFileTracingRoot pins tracing to web/ (the repo root holds the Django
 *   app + its own lockfile; Next's workspace-root inference picks the wrong one).
 * - Security headers are the same baseline the repo ships in
 *   consent-manager/next.config.mjs (Security track, AGENTS.md).
 *   GA4 + Vercel Analytics + Sentry hosts are whitelisted in the CSP.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  trailingSlash: true,
  outputFileTracingRoot: path.join(__dirname),
  async headers() {
    return [
      {
        // Compliance-critical + private API routes: never cached.
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Robots-Tag', value: 'noindex' },
        ],
      },
      {
        // Baseline security headers on ALL routes.
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self' data:",
              // GA4 + Vercel Analytics/Speed Insights + Sentry tunnel
              "connect-src 'self' https://www.google-analytics.com https://analytics.google.com https://vitals.vercel-insights.com https://va.vercel-scripts.com https://o*.ingest.sentry.io https://o*.ingest.de.sentry.io",
              "worker-src blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'none'",
              "form-action 'self'",
            ].join('; '),
          },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value:
              'camera=(), microphone=(), geolocation=(), payment=(), usb=(), ' +
              'interest-cohort=(), battery=(), gyroscope=(), accelerometer=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  // Upload source maps only when SENTRY_AUTH_TOKEN is set (CI/Vercel).
  // Silent locally so the build doesn't fail without credentials.
  silent: !process.env.SENTRY_AUTH_TOKEN,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  widenClientFileUpload: true,
  // Don't add the Sentry SDK to every page unnecessarily
  disableLogger: true,
  automaticVercelMonitors: true,
});
