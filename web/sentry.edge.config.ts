import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // Sample everything. At this site's traffic 10% meant Sentry received
  // essentially no transactions, so the project sat on "No activity yet"
  // and there was no way to tell a working pipeline from a broken one.
  // Revisit if volume ever approaches the plan quota.
  tracesSampleRate: 1.0,

  enabled: process.env.NODE_ENV === 'production',
});
