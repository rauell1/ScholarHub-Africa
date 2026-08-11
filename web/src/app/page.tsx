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
      {/* Hero - CTA above the fold on desktop AND mobile */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy via-navy-light to-navy text-white">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-teal/30 blur-[100px] animate-float" aria-hidden="true" />
        <div
          className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-amber/30 blur-[100px] animate-float"
          style={{ animationDelay: '2s' }}
          aria-hidden="true"
        />
        <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-sky/20 blur-[120px] animate-pulse" aria-hidden="true" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 animate-fade-in-up">
          <div className="mx-auto max-w-4xl text-center">
            <p className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal/40 bg-teal/10 px-5 py-2 text-xs font-bold uppercase tracking-widest text-teal-light shadow-glass-dark backdrop-blur-md animate-glow-pulse">
              <span className="h-2 w-2 animate-pulse rounded-full bg-teal" aria-hidden="true" />
              {hasStats
                ? `${stats.open_now} opportunities open right now`
                : 'Verified opportunities open now'}
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl lg:text-7xl drop-shadow-2xl">
              Fully-funded master&apos;s scholarships for{' '}
              <span className="bg-gradient-to-r from-teal-light via-teal to-sky-light bg-clip-text text-transparent">
                African students
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-base font-medium text-white/80 sm:text-lg">
              Every opportunity on ScholarHub is human-verified against official sources,
              scored for your profile fit, and tracked from research to award.
            </p>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link
                href="/scholarships/"
                data-ga-event="cta_click"
                data-ga-label="hero_browse"
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal to-forest px-8 py-4 text-base font-extrabold text-navy shadow-[0_0_40px_-10px_rgba(20,184,166,0.6)] transition-all hover:scale-105 hover:shadow-[0_0_60px_-15px_rgba(20,184,166,0.8)] sm:w-auto"
              >
                <span className="text-xl transition-transform group-hover:-translate-y-1" aria-hidden="true">🎓</span>
                {hasStats ? `Browse ${stats.scholarships} scholarships` : 'Browse scholarships'}
              </Link>
              <Link
                href="/scholarships/country/"
                data-ga-event="cta_click"
                data-ga-label="hero_by_country"
                className="w-full rounded-2xl border-2 border-white/20 bg-white/5 px-8 py-4 text-base font-bold text-white backdrop-blur-sm transition-all hover:border-white/50 hover:bg-white/10 hover:shadow-glass-dark sm:w-auto"
              >
                Explore by country
              </Link>
            </div>
            <p className="mt-3 text-xs text-white/50">
              or search -{' '}
              <Link href="/scholarships/?q=DAAD" className="text-teal-light underline">DAAD</Link>,{' '}
              <Link href="/scholarships/?country=DE" className="text-teal-light underline">Germany</Link>,{' '}
              <Link href="/scholarships/field/#water" className="text-teal-light underline">Water</Link>,{' '}
              <Link href="/scholarships/field/" className="text-teal-light underline">Public Health</Link>
            </p>

            <div className="mx-auto mt-10 max-w-2xl rounded-3xl bg-white/10 p-2 shadow-glass-dark backdrop-blur-md">
              <SearchBar id="hero" large placeholder="Search DAAD, Chevening, Germany…" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      {hasStats && (
        <section className="border-b border-border bg-background">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-4 py-6 sm:px-6 md:grid-cols-4">
            <div className="flex flex-col items-center justify-center p-4">
              <p className="bg-gradient-to-r from-navy to-sky bg-clip-text text-4xl font-extrabold text-transparent dark:from-sky-light dark:to-white">
                {stats.scholarships}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-foreground/50">
                Verified scholarships
              </p>
            </div>
            <div className="flex flex-col items-center justify-center p-4">
              <p className="bg-gradient-to-r from-teal-light to-teal bg-clip-text text-4xl font-extrabold text-transparent">
                {stats.countries}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-foreground/50">
                Destination countries
              </p>
            </div>
            <div className="flex flex-col items-center justify-center p-4">
              <p className="bg-gradient-to-r from-amber-light to-amber bg-clip-text text-4xl font-extrabold text-transparent">
                {stats.open_now}
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-foreground/50">
                Open now
              </p>
            </div>
            <div className="flex flex-col items-center justify-center p-4">
              <p className="bg-gradient-to-r from-forest-light to-forest bg-clip-text text-4xl font-extrabold text-transparent">
                {stats.verified}%
              </p>
              <p className="mt-1 text-xs font-bold uppercase tracking-widest text-foreground/50">
                Human-verified data
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Open now */}
      {openNow.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="section-title">🔥 Open right now</h2>
              <p className="mt-1 text-sm text-navy/60">Deadline countdowns update live. Don&apos;t miss these.</p>
            </div>
            <Link href="/scholarships/?status=open_now" className="btn-ghost text-sm font-semibold text-teal transition-colors hover:text-navy">
              View all →
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {openNow.map((card) => (
              <ScholarshipCard key={card.id} row={card} />
            ))}
          </div>
        </section>
      )}

      {/* Browse by country */}
      {countries.length > 0 && (
        <section className="bg-white py-12">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mb-6 flex items-end justify-between">
              <div>
                <h2 className="section-title">🌍 Browse by country</h2>
                <p className="mt-1 text-sm text-navy/60">Where do you want to study?</p>
              </div>
              <Link href="/scholarships/country/" className="btn-ghost text-sm font-semibold text-teal transition-colors hover:text-navy">
                All countries →
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {countries.map((country) => (
                <Link
                  key={country.iso_code}
                  href={`/scholarships/?country=${country.iso_code}`}
                  className="card group flex flex-col items-center justify-center gap-3 !p-6 text-center transition-all hover:-translate-y-1 hover:border-teal hover:shadow-lg dark:hover:shadow-teal/20"
                >
                  <span className="text-4xl transition-transform group-hover:scale-110" aria-hidden="true">
                    {country.flag_emoji}
                  </span>
                  <span className="text-sm font-bold text-foreground">{country.name}</span>
                  <span className="badge bg-teal/10 text-teal">
                    {country.scholarship_count} opportunities
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Browse by field */}
      {fields.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="section-title">📚 Browse by field of study</h2>
              <p className="mt-1 text-sm text-navy/60">What do you want to study?</p>
            </div>
            <Link href="/scholarships/field/" className="btn-ghost text-sm font-semibold text-teal transition-colors hover:text-navy">
              All fields →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {fields.map((field) => (
              <Link
                key={field.slug}
                href={`/scholarships/?field=${field.slug}`}
                className="card group flex flex-col items-center justify-center gap-3 !p-6 text-center transition-all hover:-translate-y-1 hover:border-teal hover:shadow-lg dark:hover:shadow-teal/20"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-foreground/5 text-2xl transition-all group-hover:scale-110 group-hover:bg-teal/10" aria-hidden="true">
                  {field.icon || '📘'}
                </span>
                <span className="text-sm font-bold text-foreground">{field.name}</span>
                <span className="badge bg-foreground/5 text-foreground/70">
                  {field.scholarship_count} opportunities
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* How it works */}
      <section id="how-it-works" className="bg-navy py-12 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="section-title text-center text-white">How it works</h2>
          <p className="mt-2 text-center text-sm text-white/60">Three steps from dream to application.</p>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="rounded-2xl bg-white/5 p-6 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-teal text-xl font-extrabold text-navy" aria-hidden="true">1</span>
              <h3 className="mt-4 font-bold">Search</h3>
              <p className="mt-2 text-sm text-white/70">
                Search verified fully-funded opportunities across 23 countries, filtered by field, funding and eligibility.
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 p-6 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber text-xl font-extrabold text-navy" aria-hidden="true">2</span>
              <h3 className="mt-4 font-bold">Filter by fit</h3>
              <p className="mt-2 text-sm text-white/70">
                Every scholarship carries a 0–100 profile-fit score and an eligibility label, so you focus energy where you&apos;re most competitive.
              </p>
            </div>
            <div className="rounded-2xl bg-white/5 p-6 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-forest text-xl font-extrabold text-navy" aria-hidden="true">3</span>
              <h3 className="mt-4 font-bold">Track</h3>
              <p className="mt-2 text-sm text-white/70">
                Move each application through your tracker - planning, drafting, submitted, decision - with a 24-item document checklist.
              </p>
            </div>
          </div>
          <div className="mt-8 text-center">
            <Link href="/case-studies/" className="text-sm font-semibold text-teal-light underline transition-colors hover:text-white">
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
