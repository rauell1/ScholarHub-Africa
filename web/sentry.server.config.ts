import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,

  // 10% of requests are traced. Tracing every request added CPU time to each
  // one on Cloudflare Workers. Errors are always reported, whatever the rate,
  // so a broken pipeline still shows up in Sentry.
  tracesSampleRate: 0.1,

  enabled: process.env.NODE_ENV === 'production',
});
