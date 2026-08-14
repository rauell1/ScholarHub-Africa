'use client';

import { useState } from 'react';

interface Props {
  source?: string;
}

export function NewsletterForm({ source = 'footer' }: Props) {
  const [state, setState] = useState<'idle' | 'busy' | 'done' | 'error'>('idle');

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setState('busy');
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: fd.get('email') as string,
          source,
        }),
      });
      setState(res.ok ? 'done' : 'error');
    } catch {
      setState('error');
    }
  };

  if (state === 'done') {
    return (
      <p className="text-sm font-medium text-teal">
        You&apos;re subscribed. Check your inbox for a welcome email.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="mt-3 flex gap-2 max-w-sm">
      <input
        name="email"
        type="email"
        required
        placeholder="your@email.com"
        disabled={state === 'busy'}
        className="flex-1 min-w-0 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-teal disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={state === 'busy'}
        className="shrink-0 rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {state === 'busy' ? '…' : 'Subscribe'}
      </button>
      {state === 'error' && (
        <p className="sr-only" role="alert">Subscription failed. Please try again.</p>
      )}
    </form>
  );
}
