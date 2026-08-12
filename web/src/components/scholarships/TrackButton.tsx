'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';

export function TrackButton() {
  const { status } = useSession();

  const href =
    status === 'authenticated'
      ? '/tracker'
      : '/accounts/login?callbackUrl=/tracker';

  return (
    <Link
      href={href}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background transition-transform hover:scale-[1.02] active:scale-[0.98]"
    >
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
      </svg>
      Track this Scholarship
    </Link>
  );
}
