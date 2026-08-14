import type { Metadata } from 'next';
import Link from 'next/link';

import { Breadcrumbs } from '@/components/scholarships/Breadcrumbs';
import { queryScholarshipCards } from '@/lib/queries';

export const metadata: Metadata = {
  title: 'Scholarship Deadline Calendar',
  description: 'Monthly calendar of upcoming scholarship deadlines for African students. Never miss an application window.',
  alternates: { canonical: '/scholarships/calendar/' },
};

export const dynamic = 'force-dynamic';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default async function CalendarPage() {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  // Fetch scholarships with deadlines in the next 6 months
  const sixMonthsOut = new Date(today);
  sixMonthsOut.setMonth(sixMonthsOut.getMonth() + 6);

  let scholarships: Awaited<ReturnType<typeof queryScholarshipCards>> = [];
  try {
    scholarships = await queryScholarshipCards({
      status: ['open', 'open_now', 'opening_soon'],
      deadlineAfter: today.toISOString().slice(0, 10),
      deadlineBefore: sixMonthsOut.toISOString().slice(0, 10),
      ordering: 'deadline_date',
      limit: 200,
    });
  } catch {
    scholarships = [];
  }

  // Group by ISO deadline date
  const byDate = new Map<string, typeof scholarships>();
  for (const s of scholarships) {
    if (!s.deadline_date) continue;
    const key = s.deadline_date;
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key)!.push(s);
  }

  // Build up to 3 months
  const months = [0, 1, 2].map((offset) => {
    const d = new Date(currentYear, currentMonth + offset, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border bg-background py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Breadcrumbs items={[{ name: 'Home', href: '/' }, { name: 'Scholarships', href: '/scholarships/' }]} current="Deadline Calendar" />
          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Deadline Calendar
          </h1>
          <p className="mt-2 max-w-2xl text-base text-muted-foreground">
            Upcoming scholarship deadlines for the next 3 months. Click any scholarship to view details.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-xs font-mono">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-crimson/80" />Deadline this week</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-amber/80" />Deadline this month</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-teal/80" />Future deadline</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 space-y-12">
        {months.map(({ year, month }) => {
          const firstDay = new Date(year, month, 1).getDay();
          const daysInMonth = new Date(year, month + 1, 0).getDate();
          const todayStr = today.toISOString().slice(0, 10);

          return (
            <div key={`${year}-${month}`}>
              <h2 className="mb-4 font-display text-xl font-bold text-foreground">
                {MONTH_NAMES[month]} {year}
              </h2>

              {/* Day headers */}
              <div className="grid grid-cols-7 mb-1">
                {DAY_NAMES.map((d) => (
                  <div key={d} className="py-1 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{d}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 border-l border-t border-border">
                {/* Leading empty cells */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-24 border-b border-r border-border bg-muted/20" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const isToday = dateStr === todayStr;
                  const isPast = dateStr < todayStr;
                  const items = byDate.get(dateStr) ?? [];

                  const dayDate = new Date(dateStr);
                  const daysAway = Math.ceil((dayDate.getTime() - today.getTime()) / 86400000);
                  const dotColor = daysAway <= 7 ? 'bg-crimson/80' : daysAway <= 31 ? 'bg-amber/80' : 'bg-teal/80';

                  return (
                    <div
                      key={day}
                      className={`h-24 border-b border-r border-border p-1.5 ${isPast ? 'bg-muted/10' : 'bg-background'} ${isToday ? 'ring-2 ring-inset ring-teal' : ''}`}
                    >
                      <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${isToday ? 'bg-teal text-white' : isPast ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {day}
                      </span>
                      <div className="mt-0.5 space-y-0.5 overflow-hidden">
                        {items.slice(0, 2).map((s) => (
                          <Link
                            key={s.id}
                            href={`/scholarships/${s.slug}/`}
                            className="flex items-center gap-1 rounded px-1 py-0.5 hover:bg-muted transition-colors"
                            title={s.name}
                          >
                            <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dotColor}`} />
                            <span className="truncate text-[10px] font-medium text-foreground leading-tight">
                              {s.short_name || s.name}
                            </span>
                          </Link>
                        ))}
                        {items.length > 2 && (
                          <p className="px-1 text-[10px] text-muted-foreground">+{items.length - 2} more</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {scholarships.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="text-2xl" aria-hidden="true">📅</p>
            <h2 className="mt-3 font-bold text-foreground">No upcoming deadlines in the next 3 months</h2>
            <p className="mt-1 text-sm text-muted-foreground">Check back soon — new scholarships are added weekly.</p>
            <Link href="/scholarships/" className="btn-primary mt-6 inline-block">Browse all scholarships</Link>
          </div>
        )}
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://scholarhub.africa/' },
              { '@type': 'ListItem', position: 2, name: 'Scholarships', item: 'https://scholarhub.africa/scholarships/' },
              { '@type': 'ListItem', position: 3, name: 'Deadline Calendar', item: 'https://scholarhub.africa/scholarships/calendar/' },
            ],
          }),
        }}
      />
    </div>
  );
}
