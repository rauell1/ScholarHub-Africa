'use client';

import { useState } from 'react';
import Link from 'next/link';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrorMsg(data?.detail || 'Something went wrong. Please try again.');
        setStatus('error');
        return;
      }

      setStatus('success');
    } catch {
      setErrorMsg('Network error. Please check your connection.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <section className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <div className="card text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-600">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-foreground">Check your email</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            If an account exists for <strong>{email}</strong>, we have sent a password reset link.
          </p>
          <Link href="/accounts/login" className="btn-primary mt-6 block w-full">
            Return to login
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="card">
        <h1 className="text-2xl font-extrabold text-foreground">Forgot password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {status === 'error' && (
          <div className="mt-4 rounded-xl bg-crimson-light px-4 py-3 text-sm text-crimson" role="alert">
            {errorMsg}
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-semibold text-foreground">
              Email address
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

          <button type="submit" disabled={status === 'loading'} className="btn-primary w-full">
            {status === 'loading' ? 'Sending...' : 'Send reset link'}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-muted-foreground">
          Remember your password?{' '}
          <Link href="/accounts/login" className="font-semibold text-teal underline">
            Sign in
          </Link>
        </p>
      </div>
    </section>
  );
}
