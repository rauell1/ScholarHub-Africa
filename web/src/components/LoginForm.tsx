'use client';

import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

/**
 * Login + registration (Django's built-in auth becomes Auth.js credentials
 * + Google, Phase 5). Register posts to /api/auth/register, then signs in.
 */

function LoginFormInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/tracker/';

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (mode === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, website }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { detail?: string } | null;
          setError(data?.detail ?? 'Registration failed. Please try again.');
          setBusy(false);
          return;
        }
      }
      const result = await signIn('credentials', { email, password, redirect: false });
      if (result?.error) {
        setError('Invalid email or password.');
        setBusy(false);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="card">
        <h1 className="text-2xl font-extrabold text-navy">
          {mode === 'login' ? 'Welcome back' : 'Create your account'}
        </h1>
        <p className="mt-1 text-sm text-navy/60">
          {mode === 'login'
            ? 'Sign in to manage your application tracker.'
            : 'Free forever - your tracker, checklist and digest.'}
        </p>

        {/* Honeypot - invisible to humans, catches bots (Security 3.1 parity) */}
        <div className="hidden" aria-hidden="true">
          <label htmlFor="website">Leave this field empty</label>
          <input
            type="text"
            id="website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>

        {error && (
          <div className="mt-4 rounded-xl bg-crimson-light px-4 py-3 text-sm text-crimson" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4" noValidate>
          {mode === 'register' && (
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-semibold text-navy">
                Your name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={120}
                className="input"
                placeholder="e.g. Achieng Otieno"
              />
            </div>
          )}
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold text-navy">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold text-navy">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              maxLength={128}
              className="input"
              placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
            />
          </div>

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy ? 'Please wait…' : mode === 'login' ? 'Sign in →' : 'Create account →'}
          </button>
        </form>

        <div className="mt-4 flex items-center gap-3 text-xs text-navy/40">
          <span className="h-px flex-1 bg-navy/10" />
          or
          <span className="h-px flex-1 bg-navy/10" />
        </div>

        <button
          type="button"
          disabled={busy}
          onClick={() => signIn('google', { callbackUrl })}
          className="btn-outline mt-4 w-full"
        >
          Continue with Google
        </button>

        <p className="mt-5 text-center text-sm text-navy/60">
          {mode === 'login' ? (
            <>
              New to ScholarHub?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="font-semibold text-teal underline"
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="font-semibold text-teal underline"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </section>
  );
}

export function LoginForm() {
  return (
    <Suspense>
      <LoginFormInner />
    </Suspense>
  );
}
