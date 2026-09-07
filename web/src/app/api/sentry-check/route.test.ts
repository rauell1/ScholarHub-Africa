import { beforeEach, describe, expect, it, vi } from 'vitest';

const captureException = vi.fn(() => 'evt_abc123');
const flush = vi.fn(async () => true);
const getClient = vi.fn(() => ({}) as unknown);

vi.mock('@sentry/nextjs', () => ({
  captureException: (...args: unknown[]) => captureException(...(args as [])),
  flush: (...args: unknown[]) => flush(...(args as [])),
  getClient: () => getClient(),
}));

const { GET } = await import('./route');

function req(auth?: string) {
  return new Request('https://example.com/api/sentry-check', {
    headers: auth ? { authorization: auth } : {},
  }) as unknown as Parameters<typeof GET>[0];
}

describe('GET /api/sentry-check', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.CRON_SECRET = 'test-secret';
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
  });

  it('rejects an unauthenticated request without raising an event', async () => {
    const res = await GET(req());
    expect(res.status).toBe(401);
    // The point of the guard: no event, so the route cannot be used to spam
    // the Sentry quota from outside.
    expect(captureException).not.toHaveBeenCalled();
  });

  it('rejects a wrong secret', async () => {
    const res = await GET(req('Bearer nope'));
    expect(res.status).toBe(401);
    expect(captureException).not.toHaveBeenCalled();
  });

  it('rejects everything when CRON_SECRET is unset rather than opening up', async () => {
    delete process.env.CRON_SECRET;
    expect((await GET(req('Bearer anything'))).status).toBe(401);
    expect((await GET(req())).status).toBe(401);
  });

  it('reports the DSN project id and public key so a mismatch is visible', async () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN =
      'https://3b3364c9019540b2f257441a58b08864@o4511913956343808.ingest.de.sentry.io/4599887766';

    const body = await (await GET(req('Bearer test-secret'))).json();

    expect(body.dsn).toEqual({
      configured: true,
      host: 'o4511913956343808.ingest.de.sentry.io',
      publicKey: '3b3364c9019540b2f257441a58b08864',
      projectId: '4599887766',
    });
  });

  it('captures an event and flushes before responding', async () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://key@o1.ingest.sentry.io/2';

    const body = await (await GET(req('Bearer test-secret'))).json();

    expect(captureException).toHaveBeenCalledOnce();
    // Flushing is what makes `delivered` meaningful in a serverless runtime.
    expect(flush).toHaveBeenCalledWith(5000);
    expect(body.eventId).toBe('evt_abc123');
    expect(body.delivered).toBe(true);
  });

  it('reports delivered:false when the transport fails', async () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://key@o1.ingest.sentry.io/2';
    flush.mockResolvedValueOnce(false);

    const body = await (await GET(req('Bearer test-secret'))).json();
    expect(body.delivered).toBe(false);
  });

  it('says the DSN is unset, and why adding it later is not enough', async () => {
    const body = await (await GET(req('Bearer test-secret'))).json();

    expect(body.dsn).toEqual({ configured: false });
    expect(body.hint).toMatch(/inlined at build time/);
  });

  it('flags a malformed DSN rather than crashing', async () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'not-a-url';

    const body = await (await GET(req('Bearer test-secret'))).json();
    expect(body.dsn).toEqual({ configured: true, malformed: true });
  });
});
