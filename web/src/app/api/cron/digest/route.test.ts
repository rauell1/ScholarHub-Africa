import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const captureException = vi.fn(() => 'evt_digest');
const flush = vi.fn(async () => true);

vi.mock('@sentry/nextjs', () => ({
  captureException: (...args: unknown[]) => captureException(...(args as [])),
  flush: (...args: unknown[]) => flush(...(args as [])),
}));

vi.mock('@/lib/digest', () => ({
  getDigestContext: async () => ({
    generatedOn: '2026-09-07',
    urgent: [{ name: 'Gates Cambridge' }],
    newThisWeek: [],
  }),
  renderDigestEmail: () => '<p>digest</p>',
}));

// No recipients from the database unless a test says otherwise.
const dbEmails = vi.fn(() => [] as { email: string }[]);
vi.mock('@/lib/db', () => ({
  getDb: () => ({
    select: () => ({ from: async () => dbEmails() }),
  }),
}));

vi.mock('@/db/schema', () => ({ newsletterSubscribers: { email: 'email' } }));

const { GET } = await import('./route');

function req(auth = 'Bearer test-secret') {
  return new Request('https://example.com/api/cron/digest', {
    headers: { authorization: auth },
  }) as unknown as Parameters<typeof GET>[0];
}

// process.env is a proxy that rejects defineProperty, so NODE_ENV has to be
// set through vitest's own stub rather than assigned.
const setNodeEnv = (value: string) => vi.stubEnv('NODE_ENV', value);

describe('GET /api/cron/digest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 200 })));
    process.env.CRON_SECRET = 'test-secret';
    process.env.RESEND_API_KEY = 'rk_test';
    process.env.DIGEST_EMAILS = 'someone@example.com';
    dbEmails.mockReturnValue([]);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('rejects an unauthenticated caller', async () => {
    expect((await GET(req('Bearer nope'))).status).toBe(401);
  });

  it('sends to the configured recipients', async () => {
    const body = await (await GET(req())).json();
    expect(body).toMatchObject({ ok: true, sent_to: 1, batches: 1, failed_batches: 0 });
  });

  it('merges env recipients with newsletter subscribers, de-duplicated', async () => {
    dbEmails.mockReturnValue([{ email: 'someone@example.com' }, { email: 'other@example.com' }]);
    const body = await (await GET(req())).json();
    expect(body.sent_to).toBe(2);
  });

  describe('when there is nobody to send to', () => {
    // The regression this guards: a digest that reaches nobody used to answer
    // 200 {ok:true}, so it failed every Monday without a single signal.
    it('fails loudly in production when RESEND_API_KEY is missing', async () => {
      setNodeEnv('production');
      delete process.env.RESEND_API_KEY;

      const res = await GET(req());
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.ok).toBe(false);
      expect(body.sent_to).toBe(0);
      expect(body.detail).toMatch(/RESEND_API_KEY is not set/);
      expect(captureException).toHaveBeenCalledOnce();
      expect(flush).toHaveBeenCalled();
    });

    it('fails loudly in production when the recipient list is empty', async () => {
      setNodeEnv('production');
      process.env.DIGEST_EMAILS = '';

      const res = await GET(req());
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.detail).toMatch(/no recipients/);
      expect(captureException).toHaveBeenCalledOnce();
    });

    it('still dry-runs quietly outside production', async () => {
      setNodeEnv('development');
      delete process.env.RESEND_API_KEY;

      const res = await GET(req());
      const body = await res.json();

      expect(res.status).toBe(200);
      expect(body).toMatchObject({ ok: true, dry_run: true });
      // A local run with no credentials is not an incident.
      expect(captureException).not.toHaveBeenCalled();
    });
  });

  it('reports a Resend outage rather than claiming success', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 422 })));
    const res = await GET(req());
    expect(res.status).toBe(502);
  });
});
