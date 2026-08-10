import { NextRequest, NextResponse } from 'next/server';

import { buildSessionCookieValue, ADMIN_SESSION_COOKIE } from '@/lib/server/rbac';

/**
 * POST /api/admin/login — demo auth for the admin environment.
 * Verifies credentials against env vars, then sets an HttpOnly session
 * cookie carrying `role === 'ADMIN'`. Swap for NextAuth/IdP in production.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
  };

  const expectedUsername = process.env.ADMIN_USERNAME ?? 'admin';
  const expectedPassword = process.env.ADMIN_PASSWORD ?? 'change-me-in-production';

  if (body.username !== expectedUsername || body.password !== expectedPassword) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, role: 'ADMIN' });
  response.cookies.set(ADMIN_SESSION_COOKIE, buildSessionCookieValue(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 8, // 8h admin session
    path: '/',
  });
  return response;
}
