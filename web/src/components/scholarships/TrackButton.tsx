'use client';

import { useState, useTransition } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface Props {
  scholarshipId: number;
  slug: string;
}

export function TrackButton({ scholarshipId, slug }: Props) {
  const { status } = useSession();
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);
  const [alreadyTracked, setAlreadyTracked] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (status === 'unauthenticated' || status === 'loading') {
    return (
      <Link
        href={`/accounts/login?callbackUrl=/scholarships/${slug}/`}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        Sign in to Track
      </Link>
    );
  }

  if (added || alreadyTracked) {
    return (
      <Link
        href="/tracker"
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal px-4 py-3 text-sm font-semibold text-background transition-transform hover:scale-[1.02] active:scale-[0.98]"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        {alreadyTracked ? 'Already tracked — View Tracker' : 'Added! View in Tracker →'}
      </Link>
    );
  }

  function handleTrack() {
    setError(null);
    startTransition(async () => {
      try {
        const res = await fetch('/api/v1/tracker/applications/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ scholarship: scholarshipId }),
        });
        if (res.status === 201) {
          setAdded(true);
        } else {
          const data = await res.json().catch(() => ({})) as { detail?: string };
          // Already tracked = duplicate key constraint or similar
          if (res.status === 400 && data.detail?.toLowerCase().includes('already')) {
            setAlreadyTracked(true);
          } else if (res.status === 409) {
            setAlreadyTracked(true);
          } else {
            setError(data.detail ?? 'Something went wrong. Please try again.');
          }
        }
      } catch {
        setError('Network error. Please try again.');
      }
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleTrack}
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-foreground px-4 py-3 text-sm font-semibold text-background transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        {isPending ? 'Adding…' : 'Track this Scholarship'}
      </button>
      {error && <p className="text-xs text-destructive text-center">{error}</p>}
    </div>
  );
}
