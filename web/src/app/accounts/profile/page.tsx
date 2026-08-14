import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { ProfileEditForm } from '@/components/ProfileEditForm';
import { getOrCreateProfile } from '@/lib/tracker-queries';

export const metadata: Metadata = {
  title: 'My Profile',
  robots: { index: false, follow: false },
};

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/accounts/login');

  let profile: Awaited<ReturnType<typeof getOrCreateProfile>> | null = null;
  try {
    profile = await getOrCreateProfile(
      session.user.id,
      session.user.email ?? session.user.id,
      session.user.name,
    );
  } catch {
    profile = null;
  }

  return (
    <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">My profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your details help score scholarships for fit. Email: <span className="font-semibold text-foreground">{session.user.email}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/tracker/" className="btn-primary text-sm">Application tracker</Link>
          <Link href="/tracker/checklist/" className="btn-outline text-sm">Document checklist</Link>
        </div>
      </div>

      {profile ? (
        <ProfileEditForm profile={profile} />
      ) : (
        <div className="card mt-6 py-10 text-center text-muted-foreground text-sm">
          Could not load your profile. Please try refreshing the page.
        </div>
      )}
    </section>
  );
}
