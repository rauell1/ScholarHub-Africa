'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const newPassword = fd.get('new_password') as string;
    const confirm = fd.get('confirm_password') as string;

    if (newPassword !== confirm) {
      setError('New passwords do not match.');
      setBusy(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: fd.get('current_password') as string,
          new_password: newPassword,
        }),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/accounts/profile/'), 2000);
      } else {
        const data = await res.json().catch(() => ({}));
        setError((data as { detail?: string }).detail ?? 'Failed to change password. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-md px-4 py-16 sm:px-6">
      <h1 className="text-2xl font-extrabold text-foreground">Change password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose a strong password of at least 8 characters.
      </p>

      <form onSubmit={submit} className="card mt-8 space-y-4">
        {error && (
          <div className="rounded-xl bg-crimson-light px-4 py-3 text-sm text-crimson" role="alert">{error}</div>
        )}
        {success && (
          <div className="rounded-xl bg-teal/10 px-4 py-3 text-sm text-teal font-medium" role="status">
            Password changed. Redirecting…
          </div>
        )}

        <div>
          <label htmlFor="current_password" className="mb-1 block text-sm font-semibold text-foreground">Current password</label>
          <input id="current_password" name="current_password" type="password" required autoComplete="current-password" className="input" />
        </div>
        <div>
          <label htmlFor="new_password" className="mb-1 block text-sm font-semibold text-foreground">New password</label>
          <input id="new_password" name="new_password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" className="input" />
        </div>
        <div>
          <label htmlFor="confirm_password" className="mb-1 block text-sm font-semibold text-foreground">Confirm new password</label>
          <input id="confirm_password" name="confirm_password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" className="input" />
        </div>

        <div className="flex items-center justify-between pt-1">
          <Link href="/accounts/profile/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Back to profile
          </Link>
          <button type="submit" disabled={busy || success} className="btn-primary">
            {busy ? 'Saving…' : 'Change password'}
          </button>
        </div>
      </form>
    </section>
  );
}
