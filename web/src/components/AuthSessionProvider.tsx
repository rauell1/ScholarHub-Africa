'use client';

import { SessionProvider } from 'next-auth/react';

/**
 * Client wrapper so the root layout can provide the auth session.
 * Disables automatic window-focus and interval polling so anonymous visitors
 * don't repeatedly invoke the Cloudflare Worker on /api/auth/session every
 * time they switch browser tabs.
 */
export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
      {children}
    </SessionProvider>
  );
}
