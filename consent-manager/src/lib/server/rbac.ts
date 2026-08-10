/**
 * Role-Based Access Control (RBAC) for the Admin Environment.
 *
 * The admin environment is a completely separate surface from the end-user
 * banner: every admin page and every /api/admin/* route verifies that the
 * session carries `role === 'ADMIN'` before rendering or responding.
 *
 * Demo auth: username/password from env → sets an HttpOnly session cookie
 * containing `ADMIN.<session-token>`. Production: swap for your IdP /
 * NextAuth session (keep the same `isAdmin()` gate).
 */
import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';

export const ADMIN_ROLE = 'ADMIN';
export const ADMIN_SESSION_COOKIE = 'sh_admin_session';

const SESSION_TOKEN = process.env.ADMIN_SESSION_TOKEN ?? 'dev-admin-token-change-me';

export function buildSessionCookieValue(): string {
  return `ADMIN.${SESSION_TOKEN}`;
}

function cookieValueIsAdmin(value: string | undefined): boolean {
  if (!value) return false;
  const [role, token] = value.split('.');
  return role === ADMIN_ROLE && token === SESSION_TOKEN;
}

/** Server-component guard - usage: `const { isAdmin } = await requireAdmin()` */
export function isAdminSession(): boolean {
  return cookieValueIsAdmin(cookies().get(ADMIN_SESSION_COOKIE)?.value);
}

/** Route-handler guard - pass the incoming request. */
export function isAdminRequest(request: NextRequest): boolean {
  const fromCookie = cookieValueIsAdmin(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
  if (fromCookie) return true;
  // Allow bearer token auth for non-browser clients (CI, curl, scripts).
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${SESSION_TOKEN}`;
}
