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
    process.env.DEFAULT_FROM_EMAIL = 'ScholarHub Africa <info@rauell.systems>';
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

    it('refuses to send from the unowned fallback domain in production', async () => {
      // The fallback is `digest@scholarhub.africa`, which Resend rejects
      // because the domain is not verified there. Sending anyway just burns
      // the run; failing names the missing variable instead.
      setNodeEnv('production');
      delete process.env.DEFAULT_FROM_EMAIL;

      const res = await GET(req());
      const body = await res.json();

      expect(res.status).toBe(500);
      expect(body.detail).toMatch(/DEFAULT_FROM_EMAIL is not set/);
      expect(captureException).toHaveBeenCalledOnce();
      // Nothing was attempted, so no quota was spent on a doomed send.
      expect(fetch).not.toHaveBeenCalled();
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

  describe('when Resend rejects the send', () => {
    it('reports an outage rather than claiming success', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 422 })));

      const res = await GET(req());
      const body = await res.json();

      expect(res.status).toBe(502);
      expect(body).toMatchObject({ ok: false, sent_to: 0, failed_batches: 1 });
    });

    it('raises the Resend status and body in Sentry', async () => {
      // The realistic case: an unverified `from` domain rejects every batch
      // identically, and this used to reach console.error and nowhere else.
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response('{"message":"domain is not verified"}', { status: 403 })),
      );

      await GET(req());

      expect(captureException).toHaveBeenCalledOnce();
      const [err] = captureException.mock.calls[0] as unknown as [Error];
      expect(err.message).toMatch(/HTTP 403/);
      expect(err.message).toMatch(/domain is not verified/);
    });

    it('counts only accepted recipients when one batch of several fails', async () => {
      // 60 recipients => two batches; fail the first, accept the second.
      dbEmails.mockReturnValue(
        Array.from({ length: 60 }, (_, i) => ({ email: `s${i}@example.com` })),
      );
      process.env.DIGEST_EMAILS = '';
      let call = 0;
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => {
          call += 1;
          return call === 1 ? new Response('nope', { status: 500 }) : new Response('{}', { status: 200 });
        }),
      );

      const body = await (await GET(req())).json();

      expect(body.batches).toBe(2);
      expect(body.failed_batches).toBe(1);
      // Not 60: the first 50 were rejected.
      expect(body.sent_to).toBe(10);
      expect(body.ok).toBe(false);
    });
  });
});
