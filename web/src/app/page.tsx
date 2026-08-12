import type { Metadata } from 'next';
import Link from 'next/link';

import { ScholarshipCard } from '@/components/scholarships/ScholarshipCard';
import { SearchBar } from '@/components/scholarships/SearchBar';
import { StickyCta } from '@/components/scholarships/StickyCta';
import { Testimonials } from '@/components/Testimonials';
import { getCountries, getFields, getHomeStats, queryScholarshipCards } from '@/lib/queries';
import { site } from '@/lib/site';

/**
 * Homepage - port of templates/scholarships/home.html.
 * Hero is fully static (CTA above the fold); the data sections render once
 * the database is reachable. ISR: hourly refresh keeps stats/deadlines fresh
 * from the CDN.
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'ScholarHub Africa - Scholarships for African Students',
  description: site.tagline,
  alternates: { canonical: '/' },
  openGraph: { url: site.url, type: 'website' },
};

export default async function HomePage() {
  const stats = await getHomeStats();
  let openNow: Awaited<ReturnType<typeof queryScholarshipCards>> = [];
  let countries: Awaited<ReturnType<typeof getCountries>> = [];
  let fields: Awaited<ReturnType<typeof getFields>> = [];
  try {
    [openNow, countries, fields] = await Promise.all([
      queryScholarshipCards({ status: ['open_now'], ordering: 'deadline_date', limit: 6 }),
      getCountries({ activeOnly: true }),
      getFields(),
    ]);
  } catch {
    // DB unavailable (preview) - data sections stay hidden.
  }

  const hasStats = stats.scholarships > 0;

  return (
    <>
      {/* Hero - Editorial / Grid-based */}
      <section className="relative overflow-hidden border-b border-border bg-background pt-16 pb-24 md:pt-32 md:pb-40">
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <p className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground backdrop-blur-md">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" aria-hidden="true" />
              {hasStats
                ? `${stats.open_now} opportunities open right now`
                : 'Verified opportunities open now'}
            </p>
            <h1 className="animate-rise font-display text-5xl font-semibold tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl" style={{ animationDelay: '100ms' }}>
              Master&apos;s scholarships <br className="hidden sm:block" />
              <span className="italic text-muted-foreground font-serif">for African students</span>
            </h1>
            <p className="animate-fade-in-up mx-auto mt-8 max-w-2xl text-base text-muted-foreground sm:text-lg" style={{ animationDelay: '200ms' }}>
              Every opportunity on ScholarHub is human-verified against official sources,
              scored for your profile fit, and tracked from research to award.
            </p>

            <div className="animate-fade-in-up mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row" style={{ animationDelay: '300ms' }}>
              <Link
                href="/scholarships/"
                data-ga-event="cta_click"
                data-ga-label="hero_browse"
                className="btn-primary w-full text-base sm:w-auto px-8 py-3.5"
              >
                {hasStats ? `Browse ${stats.scholarships} scholarships` : 'Browse scholarships'}
              </Link>
              <Link
                href="/scholarships/country/"
                data-ga-event="cta_click"
                data-ga-label="hero_by_country"
                className="btn-outline w-full text-base sm:w-auto px-8 py-3.5"
              >
                Explore by country
              </Link>
            </div>
            <p className="animate-fade-in-up mt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground" style={{ animationDelay: '400ms' }}>
              or search -{' '}
              <Link href="/scholarships/?q=DAAD" className="text-foreground underline underline-offset-2">DAAD</Link>,{' '}
              <Link href="/scholarships/?country=DE" className="text-foreground underline underline-offset-2">Germany</Link>,{' '}
              <Link href="/scholarships/field/#water" className="text-foreground underline underline-offset-2">Water</Link>,{' '}
              <Link href="/scholarships/field/" className="text-foreground underline underline-offset-2">Public Health</Link>
            </p>

            <div className="animate-fade-in-up mx-auto mt-10 max-w-2xl" style={{ animationDelay: '500ms' }}>
              <div className="rounded-xl border border-border bg-card p-1 shadow-soft">
                <SearchBar id="hero" large placeholder="Search DAAD, Chevening, Germany…" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      {hasStats && (
        <section className="border-b border-border bg-background">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-border sm:grid-cols-4">
            <div className="flex flex-col items-center justify-center bg-background p-6">
              <p className="font-display text-4xl font-semibold text-foreground">
                {stats.scholarships}
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Verified scholarships
              </p>
            </div>
            <div className="flex flex-col items-center justify-center bg-background p-6">
              <p className="font-display text-4xl font-semibold text-foreground">
                {stats.countries}
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Destination countries
              </p>
            </div>
            <div className="flex flex-col items-center justify-center bg-background p-6">
              <p className="font-display text-4xl font-semibold text-foreground">
                {stats.open_now}
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Open now
              </p>
            </div>
            <div className="flex flex-col items-center justify-center bg-background p-6">
              <p className="font-display text-4xl font-semibold text-accent">
                {stats.verified}%
              </p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Human-verified data
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Open now */}
      {openNow.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24 border-b border-border-soft">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="section-title">Open right now</h2>
              <p className="mt-2 text-sm text-muted-foreground">Deadline countdowns update live. Don&apos;t miss these.</p>
            </div>
            <Link href="/scholarships/?status=open_now" className="btn-ghost text-sm font-semibold transition-colors">
              View all →
            </Link>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {openNow.map((card) => (
              <ScholarshipCard key={card.id} row={card} />
            ))}
          </div>
        </section>
      )}

      {/* Browse by country */}
      {countries.length > 0 && (
        <section className="bg-background py-16 md:py-24 border-b border-border-soft">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="section-title">Browse by country</h2>
                <p className="mt-2 text-sm text-muted-foreground">Where do you want to study?</p>
              </div>
              <Link href="/scholarships/country/" className="btn-ghost text-sm font-semibold transition-colors">
                All countries →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {countries.map((country) => (
                <Link
                  key={country.iso_code}
                  href={`/scholarships/?country=${country.iso_code}`}
                  className="card group flex flex-col items-center justify-center gap-3 !p-6 text-center hover:border-accent"
                >
                  <span className="text-4xl transition-transform group-hover:scale-110 group-hover:-rotate-3" aria-hidden="true">
                    {country.flag_emoji}
                  </span>
                  <span className="text-sm font-bold text-foreground">{country.name}</span>
                  <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    {country.scholarship_count} opps
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Browse by field */}
      {fields.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 md:py-24">
          <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="section-title">Browse by field of study</h2>
              <p className="mt-2 text-sm text-muted-foreground">What do you want to study?</p>
            </div>
            <Link href="/scholarships/field/" className="btn-ghost text-sm font-semibold transition-colors">
              All fields →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {fields.map((field) => (
              <Link
                key={field.slug}
                href={`/scholarships/?field=${field.slug}`}
                className="card group flex flex-col items-center justify-center gap-3 !p-6 text-center hover:border-accent"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-2xl transition-all group-hover:scale-110 group-hover:bg-accent/10 group-hover:text-accent" aria-hidden="true">
                  {field.icon || '📘'}
                </span>
                <span className="text-sm font-bold text-foreground">{field.name}</span>
                <span className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                  {field.scholarship_count} opps
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section id="how-it-works" className="border-t border-border bg-muted py-16 md:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="section-title text-center text-foreground">How it works</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">Three steps from dream to application.</p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            <div className="card text-center !p-8">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 font-mono text-xl text-accent" aria-hidden="true">1</span>
              <h3 className="mt-6 font-display text-lg font-semibold text-foreground">Search</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Search verified fully-funded opportunities across 23 countries, filtered by field, funding and eligibility.
              </p>
            </div>
            <div className="card text-center !p-8">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber/10 font-mono text-xl text-amber" aria-hidden="true">2</span>
              <h3 className="mt-6 font-display text-lg font-semibold text-foreground">Filter by fit</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Every scholarship carries a 0–100 profile-fit score and an eligibility label, so you focus energy where you&apos;re most competitive.
              </p>
            </div>
            <div className="card text-center !p-8">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-crimson/10 font-mono text-xl text-crimson" aria-hidden="true">3</span>
              <h3 className="mt-6 font-display text-lg font-semibold text-foreground">Track</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Move each application through your tracker - planning, drafting, submitted, decision - with a 24-item document checklist.
              </p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <Link href="/case-studies/" className="text-sm font-semibold text-accent transition-colors hover:text-foreground">
              See how one student used it to land the DAAD EPOS scholarship →
            </Link>
          </div>
        </div>
      </section>

      <Testimonials />

      <StickyCta />
    </>
  );
}
