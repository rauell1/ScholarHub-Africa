/**
 * Distributed rate limiting via Upstash Redis (@upstash/ratelimit).
 * Falls back to an in-process Map when UPSTASH_REDIS_REST_URL is not set
 * (local dev, preview builds without Redis configured).
 *
 * Usage:
 *   const { limited } = await checkRateLimit(ip, 'contact', 5, '1 m');
 *   if (limited) return NextResponse.json(..., { status: 429 });
 */
import type { NextRequest } from 'next/server';

type Limiter = {
  limit: (key: string) => Promise<{ success: boolean }>;
};

type LimiterEntry = { limiter: Limiter; unit: string; count: number };

const limiters = new Map<string, LimiterEntry>();

function makeLimiter(requests: number, window: string): Limiter {
  const windowMs = parseWindow(window);

  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    // Lazy-import so the module doesn't error at build time when env vars are absent
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Redis } = require('@upstash/redis') as typeof import('@upstash/redis');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Ratelimit } = require('@upstash/ratelimit') as typeof import('@upstash/ratelimit');
    const redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, window as Parameters<typeof Ratelimit.slidingWindow>[1]),
      prefix: 'sh_rl',
    });
  }

  // In-memory fallback — single-instance only, good enough for dev
  const store = new Map<string, { count: number; resetAt: number }>();
  return {
    limit: async (key: string) => {
      const now = Date.now();
      const entry = store.get(key);
      if (!entry || entry.resetAt < now) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return { success: true };
      }
      entry.count += 1;
      return { success: entry.count <= requests };
    },
  };
}

function parseWindow(window: string): number {
  const [n, unit] = window.trim().split(/\s+/);
  const num = parseInt(n, 10);
  switch (unit[0]) {
    case 's': return num * 1000;
    case 'm': return num * 60_000;
    case 'h': return num * 3_600_000;
    default: return 60_000;
  }
}

function getLimiter(namespace: string, requests: number, window: string): Limiter {
  const key = `${namespace}:${requests}:${window}`;
  if (!limiters.has(key)) {
    limiters.set(key, { limiter: makeLimiter(requests, window), unit: window, count: requests });
  }
  return limiters.get(key)!.limiter;
}

/**
 * @param ip        Resolved client IP
 * @param namespace Short string distinguishing the endpoint, e.g. 'contact'
 * @param requests  Max allowed requests in the window
 * @param window    Duration string accepted by Upstash, e.g. '1 m', '10 s'
 */
export async function checkRateLimit(
  ip: string,
  namespace: string,
  requests: number,
  window: string,
): Promise<{ limited: boolean }> {
  try {
    const limiter = getLimiter(namespace, requests, window);
    const result = await limiter.limit(`${namespace}:${ip}`);
    return { limited: !result.success };
  } catch {
    // Never fail open — on limiter error, allow the request
    return { limited: false };
  }
}

/** Extract client IP from a Next.js request */
export function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    'unknown'
  );
}
