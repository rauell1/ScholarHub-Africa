import { NextResponse } from 'next/server';

import { ADMIN_SESSION_COOKIE } from '@/lib/server/rbac';

/** POST /api/admin/logout - clears the admin session cookie. */
export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
  return response;
}
