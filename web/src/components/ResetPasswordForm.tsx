'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

export function ResetPasswordForm() {

  const searchParams = useSearchParams();
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (!token || !email) {
    return (
      <section className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <div className="card text-center">
          <h1 className="text-2xl font-extrabold text-foreground">Invalid Link</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This password reset link is invalid or missing information.
          </p>
          <Link href="/accounts/forgot-password" className="btn-primary mt-6 block w-full">
            Request a new link
          </Link>
        </div>
      </section>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, token, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrorMsg(data?.detail || 'Failed to reset password. The link may have expired.');
        setStatus('error');
        return;
      }

      setStatus('success');
      setTimeout(() => {
        window.location.href = '/accounts/login';
      }, 3000);
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
          <h1 className="text-2xl font-extrabold text-foreground">Password Reset</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Your password has been successfully reset! Redirecting you to login...
          </p>
          <Link href="/accounts/login" className="btn-primary mt-6 block w-full">
            Sign in now
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-md px-4 py-12 sm:px-6">
      <div className="card">
        <h1 className="text-2xl font-extrabold text-foreground">Set new password</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your new password below for <strong>{email}</strong>.
        </p>

        {status === 'error' && (
          <div className="mt-4 rounded-xl bg-crimson-light px-4 py-3 text-sm text-crimson" role="alert">
            {errorMsg}
          </div>
        )}

        <form onSubmit={submit} className="mt-5 space-y-4">
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-semibold text-foreground">
              New Password
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
              placeholder="At least 8 characters"
            />
          </div>

          <button type="submit" disabled={status === 'loading'} className="btn-primary w-full">
            {status === 'loading' ? 'Saving...' : 'Reset password'}
          </button>
        </form>
      </div>
    </section>
  );
}
