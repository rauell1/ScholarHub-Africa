import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { ChecklistPanel } from '@/components/tracker/ChecklistPanel';
import { getOrCreateProfile, listDocuments } from '@/lib/tracker-queries';

/**
 * 24-item document checklist (port of templates/tracker/checklist.html),
 * auth-gated.
 */
export const metadata: Metadata = {
  title: 'Document Checklist',
  robots: { index: false, follow: false },
};

export default async function ChecklistPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/accounts/login');

  let profile: Awaited<ReturnType<typeof getOrCreateProfile>> | null = null;
  let documents: Awaited<ReturnType<typeof listDocuments>> = [];
  try {
    [profile, documents] = await Promise.all([
      getOrCreateProfile(session.user.id, session.user.email ?? session.user.id, session.user.name),
      listDocuments(session.user.id),
    ]);
  } catch {
    profile = null;
    documents = [];
  }

  if (!profile) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <div className="card mx-auto max-w-md py-10">
          <p className="text-4xl" aria-hidden="true">🛠️</p>
          <h1 className="mt-3 font-bold text-foreground">The checklist is temporarily unavailable</h1>
          <p className="mt-1 text-sm text-muted-foreground">Please try again in a moment.</p>
        </div>
      </section>
    );
  }

  const counts = {
    ready: documents.filter((d) => d.status === 'ready').length,
    in_progress: documents.filter((d) => d.status === 'in_progress').length,
    not_started: documents.filter((d) => d.status === 'not_started').length,
    not_needed: documents.filter((d) => d.status === 'not_needed').length,
  };

  return (
    <>
      <section className="bg-background py-8 border-b border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h1 className="text-2xl font-extrabold sm:text-3xl">📋 Document Checklist</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            24 items every strong application needs. Keep them ready before deadlines hit.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="card mb-6">
          <div className="flex items-center justify-between">
            <p className="font-bold text-foreground">Overall readiness</p>
            <p className="text-2xl font-extrabold text-teal">{profile.documents_progress}%</p>
          </div>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-teal transition-all"
              style={{ width: `${profile.documents_progress}%` }}
            />
          </div>
          <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
            <div className="rounded-lg bg-forest-light p-2">
              <span className="font-bold text-forest">{counts.ready}</span> Ready
            </div>
            <div className="rounded-lg bg-amber-light p-2">
              <span className="font-bold text-amber">{counts.in_progress}</span> In progress
            </div>
            <div className="rounded-lg bg-muted p-2">
              <span className="font-bold text-muted-foreground">{counts.not_started}</span> Not started
            </div>
            <div className="rounded-lg bg-muted p-2">
              <span className="font-bold text-muted-foreground">{counts.not_needed}</span> Not needed
            </div>
          </div>
        </div>

        <ChecklistPanel documents={documents} />

        <div className="mt-6 text-center">
          <Link href="/tracker/" className="btn-outline">
            ← Back to tracker
          </Link>
        </div>
      </section>
    </>
  );
}
