import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { auth } from '@/auth';
import { TrackerBoard } from '@/components/tracker/TrackerBoard';
import { TrackerSpreadsheet } from '@/components/tracker/TrackerSpreadsheet';
import { getTrackerDashboard } from '@/lib/tracker-queries';

/**
 * Application tracker dashboard (port of templates/tracker/dashboard.html) -
 * kanban-style stage columns, auth-gated (middleware + server check).
 */
export const metadata: Metadata = {
  title: 'My Tracker',
  robots: { index: false, follow: false },
};

export default async function TrackerPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const sp = await searchParams;
  const isSpreadsheet = sp.view === 'spreadsheet';

  const session = await auth();
  if (!session?.user?.id) redirect('/accounts/login');

  let data: Awaited<ReturnType<typeof getTrackerDashboard>> = null;
  try {
    data = await getTrackerDashboard(
      session.user.id,
      session.user.email ?? session.user.id,
      session.user.name,
    );
  } catch {
    data = null;
  }

  if (!data) {
    return (
      <section className="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6">
        <div className="card mx-auto max-w-md py-10">
          <p className="text-4xl" aria-hidden="true">🛠️</p>
          <h1 className="mt-3 font-bold text-foreground">The tracker is temporarily unavailable</h1>
          <p className="mt-1 text-sm text-muted-foreground">Please try again in a moment.</p>
        </div>
      </section>
    );
  }

  const { profile, columns, open_count } = data;

  return (
    <>
      <section className="bg-background py-8 border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold sm:text-3xl">🗂 My Application Tracker</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {profile.full_name || profile.email} · {open_count} active application
                {open_count === 1 ? '' : 's'} · {profile.documents_ready}/{profile.documents_total} documents ready
              </p>
            </div>
            <div className="flex gap-2 items-center">
              <div className="flex bg-muted/50 p-1 rounded-lg border border-border mr-2">
                <Link
                  href="/tracker/"
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${!isSpreadsheet ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Kanban
                </Link>
                <Link
                  href="/tracker/?view=spreadsheet"
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${isSpreadsheet ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Spreadsheet
                </Link>
              </div>
              <Link href="/tracker/checklist/" className="btn-outline text-sm">
                📋 Checklist
              </Link>
              <Link href="/scholarships/" className="btn bg-teal text-foreground transition-colors hover:bg-teal-light text-sm">
                ＋ Add applications
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {isSpreadsheet ? (
          <TrackerSpreadsheet columns={columns} />
        ) : (
          <TrackerBoard columns={columns} />
        )}
      </section>
    </>
  );
}
