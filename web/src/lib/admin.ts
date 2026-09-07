import type { Session } from 'next-auth';

/**
 * The single admin account. Kept here rather than inline at each call site so
 * a second copy cannot drift from the first.
 */
export const ADMIN_EMAIL = 'royokola3@gmail.com';

export function isAdmin(session: Session | null): boolean {
  return session?.user?.email === ADMIN_EMAIL;
}
