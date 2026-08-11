'use client';

import Link from 'next/link';

/**
 * Error boundary - port of templates/500.html.
 */
export default function Error({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-light text-4xl" aria-hidden="true">
        🛠️
      </div>
      <h1 className="mt-5 text-2xl font-extrabold text-navy">Something went wrong on our side</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-navy/60">
        An unexpected error occurred. The team has been notified - please try again in a few
        minutes.
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button type="button" onClick={reset} className="btn-primary">
          ← Try again
        </button>
        <Link href="/" className="btn-outline">Back to homepage</Link>
        <Link href="/contact/" className="btn-outline">Report a problem</Link>
      </div>
    </section>
  );
}
