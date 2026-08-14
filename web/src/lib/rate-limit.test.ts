import { describe, it, expect, beforeEach, vi } from 'vitest';

// Isolate module so each test gets a fresh limiter store
vi.mock('@upstash/redis', () => ({}));
vi.mock('@upstash/ratelimit', () => ({}));

// Re-import after mocks so env var is not set → falls back to in-memory
process.env.UPSTASH_REDIS_REST_URL = '';
process.env.UPSTASH_REDIS_REST_TOKEN = '';

const { checkRateLimit, getClientIp } = await import('./rate-limit');

describe('checkRateLimit (in-memory fallback)', () => {
  it('allows requests under the limit', async () => {
    const results = await Promise.all([
      checkRateLimit('1.2.3.4', 'test-allow', 3, '1 m'),
      checkRateLimit('1.2.3.4', 'test-allow', 3, '1 m'),
      checkRateLimit('1.2.3.4', 'test-allow', 3, '1 m'),
    ]);
    expect(results.every((r) => !r.limited)).toBe(true);
  });

  it('blocks requests exceeding the limit', async () => {
    await checkRateLimit('5.5.5.5', 'test-block', 2, '1 m');
    await checkRateLimit('5.5.5.5', 'test-block', 2, '1 m');
    const { limited } = await checkRateLimit('5.5.5.5', 'test-block', 2, '1 m');
    expect(limited).toBe(true);
  });

  it('does not bleed across different namespaces', async () => {
    // Fill up 'ns-a' for this IP
    await checkRateLimit('9.9.9.9', 'ns-a', 1, '1 m');
    await checkRateLimit('9.9.9.9', 'ns-a', 1, '1 m');
    // 'ns-b' should still be open
    const { limited } = await checkRateLimit('9.9.9.9', 'ns-b', 1, '1 m');
    expect(limited).toBe(false);
  });

  it('does not bleed across different IPs', async () => {
    await checkRateLimit('10.0.0.1', 'ns-ip', 1, '1 m');
    await checkRateLimit('10.0.0.1', 'ns-ip', 1, '1 m');
    const { limited } = await checkRateLimit('10.0.0.2', 'ns-ip', 1, '1 m');
    expect(limited).toBe(false);
  });
});

describe('getClientIp', () => {
  it('extracts first IP from x-forwarded-for', () => {
    const req = new Request('http://localhost/api/test', {
      headers: { 'x-forwarded-for': '203.0.113.1, 10.0.0.1' },
    });
    // Cast to NextRequest-compatible shape
    expect(getClientIp(req as never)).toBe('203.0.113.1');
  });

  it('falls back to x-real-ip', () => {
    const req = new Request('http://localhost/api/test', {
      headers: { 'x-real-ip': '198.51.100.5' },
    });
    expect(getClientIp(req as never)).toBe('198.51.100.5');
  });

  it('returns unknown when no IP headers present', () => {
    const req = new Request('http://localhost/api/test');
    expect(getClientIp(req as never)).toBe('unknown');
  });
});
