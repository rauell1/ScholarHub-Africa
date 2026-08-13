import type { Metadata } from 'next';
import Link from 'next/link';

import type { SearchHint } from '@/components/scholarships/SearchBar';
import { SearchBar } from '@/components/scholarships/SearchBar';
import { StickyCta } from '@/components/scholarships/StickyCta';
import { Testimonials } from '@/components/Testimonials';
import { getCountries, getFields, getHomeStats } from '@/lib/queries';
import { site } from '@/lib/site';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'ScholarHub Africa - Scholarships for African Students',
  description: site.tagline,
  alternates: { canonical: '/' },
  openGraph: { url: site.url, type: 'website' },
};

export default async function HomePage() {
  const [stats, countries, fields] = await Promise.all([
    getHomeStats(),
    getCountries({ activeOnly: true }).catch(() => [] as Awaited<ReturnType<typeof getCountries>>),
    getFields().catch(() => [] as Awaited<ReturnType<typeof getFields>>),
  ]);
  const hasStats = stats.scholarships > 0;

  const searchHints: SearchHint[] = [
    ...countries.map((c) => ({
      label: c.name,
      href: `/scholarships/?country=${c.iso_code}`,
      type: 'country' as const,
      emoji: c.flag_emoji,
    })),
    ...fields.map((f) => ({
      label: f.name,
      href: `/scholarships/?field=${f.slug}`,
      type: 'field' as const,
    })),
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-background pt-16 pb-24 md:pt-32 md:pb-40">
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <p className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest text-muted-foreground backdrop-blur-md">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" aria-hidden="true" />
              {hasStats
                ? `${stats.open_now} opportunities open right now`
                : 'Verified opportunities open now'}
            </p>

            <h1
              className="animate-rise font-display text-5xl font-semibold tracking-tight text-foreground sm:text-6xl md:text-7xl lg:text-8xl"
              style={{ animationDelay: '100ms' }}
            >
              Master&apos;s scholarships <br className="hidden sm:block" />
              <span className="italic text-muted-foreground font-serif">for African students</span>
            </h1>

            <p
              className="animate-fade-in-up mx-auto mt-8 max-w-2xl text-base text-muted-foreground sm:text-lg"
              style={{ animationDelay: '200ms' }}
            >
              Every opportunity on ScholarHub is human-verified against official sources,
              scored for your profile fit, and tracked from research to award.
            </p>

            <div
              className="animate-fade-in-up mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
              style={{ animationDelay: '300ms' }}
            >
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

            <p
              className="animate-fade-in-up mt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground"
              style={{ animationDelay: '400ms' }}
            >
              or search —{' '}
              <Link href="/scholarships/?q=DAAD" className="text-foreground underline underline-offset-2">DAAD</Link>,{' '}
              <Link href="/scholarships/?country=DE" className="text-foreground underline underline-offset-2">Germany</Link>,{' '}
              <Link href="/scholarships/field/#water" className="text-foreground underline underline-offset-2">Water</Link>,{' '}
              <Link href="/scholarships/field/" className="text-foreground underline underline-offset-2">Public Health</Link>
            </p>

            <div
              className="animate-fade-in-up mx-auto mt-10 max-w-2xl"
              style={{ animationDelay: '500ms' }}
            >
              <div className="rounded-xl border border-border bg-card p-1 shadow-soft">
                <SearchBar id="hero" large placeholder="Search DAAD, Chevening, Germany…" hints={searchHints} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      {hasStats && (
        <section className="border-b border-border bg-background">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px bg-border sm:grid-cols-4">
            <div className="flex flex-col items-center justify-center bg-background p-8">
              <p className="font-display text-4xl font-semibold text-foreground">{stats.scholarships}</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Verified scholarships</p>
            </div>
            <div className="flex flex-col items-center justify-center bg-background p-8">
              <p className="font-display text-4xl font-semibold text-foreground">{stats.countries}</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Destination countries</p>
            </div>
            <div className="flex flex-col items-center justify-center bg-background p-8">
              <p className="font-display text-4xl font-semibold text-foreground">{stats.open_now}</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Open now</p>
            </div>
            <div className="flex flex-col items-center justify-center bg-background p-8">
              <p className="font-display text-4xl font-semibold text-accent">{stats.verified}%</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Human-verified data</p>
            </div>
          </div>
        </section>
      )}

      {/* How it works */}
      <section id="how-it-works" className="border-b border-border bg-muted py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="mx-auto max-w-xl text-center">
            <h2 className="section-title text-foreground">How it works</h2>
            <p className="mt-3 text-sm text-muted-foreground">Three steps from dream to application.</p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            <div className="card text-center !p-8">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 font-mono text-xl text-accent" aria-hidden="true">1</span>
              <h3 className="mt-6 font-display text-lg font-semibold text-foreground">Search</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Browse verified, fully-funded opportunities across 40+ countries — filtered by field, funding type, and eligibility.
              </p>
            </div>
            <div className="card text-center !p-8">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber/10 font-mono text-xl text-amber" aria-hidden="true">2</span>
              <h3 className="mt-6 font-display text-lg font-semibold text-foreground">Filter by fit</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Every scholarship carries a 0–100 profile-fit score and an eligibility label, so you spend energy where it counts.
              </p>
            </div>
            <div className="card text-center !p-8">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-crimson/10 font-mono text-xl text-crimson" aria-hidden="true">3</span>
              <h3 className="mt-6 font-display text-lg font-semibold text-foreground">Track</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Move each application through your tracker — planning, drafting, submitted, decision — with a 24-item document checklist.
              </p>
            </div>
          </div>

          <div className="mt-10 text-center">
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
