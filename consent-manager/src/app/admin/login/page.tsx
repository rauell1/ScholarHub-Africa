'use client';

/**
 * Admin login - credentials verified server-side; the session cookie carries
 * role === 'ADMIN' (see /api/admin/login + lib/server/rbac.ts).
 */
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (res.ok) {
      router.push('/admin/consent-manager');
      router.refresh();
    } else {
      setError('Invalid credentials. Check ADMIN_USERNAME / ADMIN_PASSWORD.');
      setBusy(false);
    }
  }

  return (
    <main className="admin-login">
      <form className="admin-login__card" onSubmit={submit}>
        <div className="admin-login__brand">🛡️</div>
        <h1>Consent Manager</h1>
        <p className="admin-muted">Admin Environment - restricted access.</p>

        {error && <div className="admin-alert admin-alert--error">{error}</div>}

        <label className="admin-field">
          <span>Username</span>
          <input
            type="text"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </label>
        <label className="admin-field">
          <span>Password</span>
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        <button type="submit" className="admin-btn admin-btn--primary admin-btn--block" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>

        <p className="admin-muted admin-login__hint">
          Defaults: <code>admin</code> / <code>change-me-in-production</code> (set via env).
        </p>
      </form>
    </main>
  );
}
