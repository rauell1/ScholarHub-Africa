import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import { users } from '@/db/schema';
import { getDb } from '@/lib/db';

/**
 * POST /api/auth/register - create a Credentials account (Phase 5).
 *
 * Mirrors the Django contact-form security posture: a hidden honeypot field
 * silently drops bots, and everything is re-validated server-side (Zod).
 * Rate-limited per IP (in-memory, like the consent API).
 */
const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  /** Honeypot - hidden from humans; bots fill it in. Drop silently. */
  website: z.string().max(100).optional(),
});

const LIMIT_MAX = 10;
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

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ detail: 'Invalid input.' }, { status: 400 });
  }

  // Honeypot: pretend success, do nothing (Django parity).
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  const email = parsed.data.email.trim().toLowerCase();
  try {
    const existing = await getDb()
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json(
        { detail: 'An account with this email already exists.' },
        { status: 409 },
      );
    }
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);
    await getDb().insert(users).values({
      id: `user_${crypto.randomUUID()}`,
      name: parsed.data.name.trim(),
      email,
      passwordHash,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { detail: 'Registration is temporarily unavailable. Please try again.' },
      { status: 503 },
    );
  }
}
