import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

/**
 * POST /api/contact - contact form handler (Phase 1 demo parity: nothing is
 * persisted or emailed yet, exactly like the Django demo handler in
 * apps/pages/views.py contact()). Honeypot + server-side validation + rate
 * limit. Phase 2 wires this to the notification task.
 */
const contactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(254),
  subject: z.string().max(200).optional(),
  hear_about: z.string().max(50).optional(),
  message: z.string().min(10).max(4000),
  /** Honeypot - hidden from humans; bots fill it in. Drop silently. */
  website: z.string().max(100).optional(),
});

const LIMIT_MAX = 20;
const LIMIT_WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; resetAt: number }>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.resetAt < now) {
    hits.set(ip, { count: 1, resetAt: now + LIMIT_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > LIMIT_MAX;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    request.headers.get('x-real-ip') ??
    'unknown';
  if (rateLimited(ip)) {
    return NextResponse.json({ detail: 'Too many requests. Please try again shortly.' }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ detail: 'Invalid payload.' }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ detail: 'Invalid input.' }, { status: 400 });
  }

  // Honeypot: pretend success, do nothing.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  // TODO(Phase 2): queue the message (email digest stack) - demo handler parity.
  return NextResponse.json({ ok: true });
}
