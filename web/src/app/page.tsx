import type { Metadata } from 'next';
import Link from 'next/link';

import { getHomeStats } from '@/lib/queries';
import { site } from '@/lib/site';

/**
 * Homepage - port of templates/scholarships/home.html hero + stats strip.
 * The hero is fully static (CTA above the fold on mobile AND desktop);
 * the stats strip renders once Phase 3 wires real DB counts (zeros are hidden).
 */
export const metadata: Metadata = {
  title: 'ScholarHub Africa - Scholarships for African Students',
  description: site.tagline,
  alternates: { canonical: '/' },
  openGraph: { url: site.url, type: 'website' },
};

export default async function HomePage() {
  const stats = await getHomeStats();
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
                data-ga-event="cta_click" data-ga-label="hero_browse"
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal to-forest px-8 py-4 text-base font-extrabold text-navy shadow-[0_0_40px_-10px_rgba(20,184,166,0.6)] transition-all hover:scale-105 hover:shadow-[0_0_60px_-15px_rgba(20,184,166,0.8)] sm:w-auto"
              >
                <span className="text-xl transition-transform group-hover:-translate-y-1" aria-hidden="true">🎓</span>
                {hasStats ? `Browse ${stats.scholarships} scholarships` : 'Browse scholarships'}
              </Link>
              <Link
                href="/scholarships/country/"
                data-ga-event="cta_click" data-ga-label="hero_by_country"
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

            {/* TODO(Phase 4): SearchBar component (port of components/search_bar.html) */}
            <div className="mx-auto mt-10 max-w-2xl rounded-3xl bg-white/10 p-2 shadow-glass-dark backdrop-blur-md">
              <form action="/scholarships/" role="search" aria-label="Search scholarships">
                <div className="flex items-center gap-2">
                  <input
                    type="search"
                    name="q"
                    placeholder="Search DAAD, Chevening, Germany…"
                    className="w-full rounded-2xl border-0 bg-white/95 px-4 py-3 text-sm text-navy placeholder:text-navy/40 focus:outline-none focus:ring-2 focus:ring-teal"
                    aria-label="Search scholarships"
                  />
                  <button type="submit" className="btn-primary shrink-0">
                    Search
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip - hidden until Phase 3 wires real DB counts */}
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
    </>
  );
}
