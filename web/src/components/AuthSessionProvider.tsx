'use client';

import { SessionProvider } from 'next-auth/react';

/** Client wrapper so the root layout can provide the auth session. */
export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
