'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { ProfileRow } from '@/lib/tracker-queries';

interface Props {
  profile: ProfileRow;
}

export function ProfileEditForm({ profile }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setBusy(true);
    const form = e.currentTarget;
    const fd = new FormData(form);

    const payload: Record<string, unknown> = {
      full_name: fd.get('full_name') as string,
      nationality: fd.get('nationality') as string,
      degree_field: fd.get('degree_field') as string,
      notes: fd.get('notes') as string,
    };

    const gpa = fd.get('gpa') as string;
    if (gpa) payload.gpa = gpa;

    const expYears = fd.get('experience_years') as string;
    if (expYears) payload.experience_years = expYears;

    const gradYear = fd.get('graduation_year') as string;
    if (gradYear) payload.graduation_year = parseInt(gradYear, 10);

    payload.has_ielts = (fd.get('has_ielts') as string) === 'true';
    const ieltsScore = fd.get('ielts_score') as string;
    if (ieltsScore) payload.ielts_score = ieltsScore;

    payload.has_toefl = (fd.get('has_toefl') as string) === 'true';
    const toeflScore = fd.get('toefl_score') as string;
    if (toeflScore) payload.toefl_score = parseInt(toeflScore, 10);

    try {
      const res = await fetch('/api/v1/tracker/profile/', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSuccess(true);
        router.refresh();
      } else {
        setError('Failed to save changes. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const deleteAccount = async () => {
    setDeleting(true);
    try {
      const res = await fetch('/api/v1/tracker/profile/', { method: 'DELETE' });
      if (res.ok) {
        // Sign out and redirect to home
        await fetch('/accounts/logout', { method: 'POST' });
        router.push('/');
        router.refresh();
      } else {
        setError('Failed to delete account. Please try again.');
        setConfirmDelete(false);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <form onSubmit={save} className="mt-6 space-y-5">
        {error && (
          <div className="rounded-xl bg-crimson-light px-4 py-3 text-sm text-crimson" role="alert">{error}</div>
        )}
        {success && (
          <div className="rounded-xl bg-teal/10 px-4 py-3 text-sm text-teal font-medium" role="status">Profile saved.</div>
        )}

        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Personal</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="full_name" className="mb-1 block text-sm font-semibold text-foreground">Full name</label>
              <input id="full_name" name="full_name" type="text" defaultValue={profile.full_name} maxLength={200} className="input" />
            </div>
            <div>
              <label htmlFor="nationality" className="mb-1 block text-sm font-semibold text-foreground">Nationality</label>
              <input id="nationality" name="nationality" type="text" defaultValue={profile.nationality} maxLength={100} placeholder="e.g. Nigerian" className="input" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="degree_field" className="mb-1 block text-sm font-semibold text-foreground">Field of study</label>
              <input id="degree_field" name="degree_field" type="text" defaultValue={profile.degree_field} maxLength={200} placeholder="e.g. Environmental Science" className="input" />
            </div>
            <div>
              <label htmlFor="graduation_year" className="mb-1 block text-sm font-semibold text-foreground">Graduation year</label>
              <input id="graduation_year" name="graduation_year" type="number" defaultValue={profile.graduation_year ?? ''} min={1990} max={2040} className="input" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="gpa" className="mb-1 block text-sm font-semibold text-foreground">GPA</label>
              <input id="gpa" name="gpa" type="text" defaultValue={profile.gpa ?? ''} maxLength={10} placeholder="e.g. 3.8" className="input" />
            </div>
            <div>
              <label htmlFor="experience_years" className="mb-1 block text-sm font-semibold text-foreground">Work experience (years)</label>
              <input id="experience_years" name="experience_years" type="number" step="0.5" defaultValue={profile.experience_years ?? ''} min={0} max={50} className="input" />
            </div>
          </div>
        </div>

        <div className="card space-y-4">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">English proficiency</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="mb-1 block text-sm font-semibold text-foreground">IELTS</label>
              <select name="has_ielts" defaultValue={profile.has_ielts ? 'true' : 'false'} className="input">
                <option value="false">No / not taken</option>
                <option value="true">Yes</option>
              </select>
              <input name="ielts_score" type="number" step="0.5" min={0} max={9} defaultValue={profile.ielts_score ?? ''} placeholder="Score (e.g. 7.5)" className="input" />
            </div>
            <div className="space-y-2">
              <label className="mb-1 block text-sm font-semibold text-foreground">TOEFL</label>
              <select name="has_toefl" defaultValue={profile.has_toefl ? 'true' : 'false'} className="input">
                <option value="false">No / not taken</option>
                <option value="true">Yes</option>
              </select>
              <input name="toefl_score" type="number" min={0} max={120} defaultValue={profile.toefl_score ?? ''} placeholder="Score (e.g. 100)" className="input" />
            </div>
          </div>
        </div>

        <div className="card space-y-2">
          <label htmlFor="notes" className="mb-1 block text-sm font-semibold text-foreground">Notes (private)</label>
          <textarea id="notes" name="notes" rows={3} maxLength={2000} defaultValue={profile.full_name ? '' : ''} className="input" placeholder="Anything else you'd like to track about yourself…" />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/accounts/change-password/" className="text-sm text-muted-foreground hover:text-foreground">
            Change password →
          </Link>
          <button type="submit" disabled={busy} className="btn-primary">
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>

      {/* Danger zone */}
      <div className="mt-10 rounded-2xl border border-crimson/30 bg-crimson-light/40 p-6">
        <h2 className="text-sm font-bold uppercase tracking-wide text-crimson">Danger zone</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Permanently delete your account, profile, and all tracked applications. This cannot be undone.
        </p>
        {!confirmDelete ? (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            className="mt-4 rounded-lg border border-crimson/50 px-4 py-2 text-sm font-semibold text-crimson transition-colors hover:bg-crimson hover:text-white"
          >
            Delete my account
          </button>
        ) : (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="text-sm font-semibold text-crimson">Are you sure? This is permanent.</p>
            <button
              type="button"
              onClick={deleteAccount}
              disabled={deleting}
              className="rounded-lg bg-crimson px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {deleting ? 'Deleting…' : 'Yes, delete everything'}
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </>
  );
}
