import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { getProfile } from '@/lib/tracker-queries';

/**
 * /accounts/profile/ - port of templates/accounts/profile.html.
 * Auth-gated (middleware + server-side check).
 */
export const metadata: Metadata = {
  title: 'My Profile',
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/accounts/login');

  let profile: Awaited<ReturnType<typeof getProfile>> | null = null;
  try {
    profile = await getProfile(session.user.id);
  } catch {
    profile = null;
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-extrabold text-foreground">👤 My profile</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your details are used to score scholarships for fit and keep your tracker personal.
      </p>

      <div className="card mt-6 space-y-4">
        <dl className="grid gap-4 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Name</dt>
            <dd className="mt-0.5 font-semibold text-foreground">
              {profile?.full_name || session.user.name || '-'}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Email</dt>
            <dd className="mt-0.5 font-semibold text-foreground">{session.user.email}</dd>
          </div>
          {profile && (
            <>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nationality</dt>
                <dd className="mt-0.5 font-semibold text-foreground">{profile.nationality || '-'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Degree field</dt>
                <dd className="mt-0.5 font-semibold text-foreground">{profile.degree_field || '-'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">GPA</dt>
                <dd className="mt-0.5 font-semibold text-foreground">{profile.gpa ?? '-'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Experience</dt>
                <dd className="mt-0.5 font-semibold text-foreground">{profile.experience_years ?? '-'} years</dd>
              </div>
            </>
          )}
        </dl>
      </div>

      <div className="mt-6 flex gap-3">
        <Link href="/tracker/" className="btn-primary">🗂 Application tracker</Link>
        <Link href="/tracker/checklist/" className="btn-outline">📋 Document checklist</Link>
      </div>
    </section>
  );
}
