import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Destination Guides for African Students',
  description: 'Country-by-country guides to studying abroad as an African student — visas, costs, culture, and top scholarships for Germany, UK, Netherlands, France, and the USA.',
  alternates: { canonical: '/destinations/' },
};

const DESTINATIONS = [
  {
    slug: 'germany',
    name: 'Germany',
    flag: '🇩🇪',
    tagline: 'No tuition. Top-ranked universities. 18-month post-study visa.',
    highlights: ['No tuition fees at public universities', 'DAAD funds ~25,000 scholars/year', 'EU Blue Card path to residency'],
    scholarship_count: 28,
  },
  {
    slug: 'united-kingdom',
    name: 'United Kingdom',
    flag: '🇬🇧',
    tagline: 'Home of Chevening. World-class research. 2-year Graduate Route visa.',
    highlights: ['Chevening covers full tuition + living', 'Graduate Route: 2 years post-study work', 'Commonwealth Shared Scholarships available'],
    scholarship_count: 22,
  },
  {
    slug: 'netherlands',
    name: 'Netherlands',
    flag: '🇳🇱',
    tagline: 'English-taught masters. Orange Tulip Scholarship. Highly liveable cities.',
    highlights: ['750+ English-taught programmes', 'Orange Tulip & Holland Scholarships', 'Graduate visa allows 1 year job-search'],
    scholarship_count: 14,
  },
  {
    slug: 'france',
    name: 'France',
    flag: '🇫🇷',
    tagline: 'Eiffel Excellence Scholarship. Low tuition. Vibrant African diaspora.',
    highlights: ['Eiffel Excellence covers full costs', 'Campus France scholarship database', 'Grandes Écoles open to international students'],
    scholarship_count: 11,
  },
  {
    slug: 'united-states',
    name: 'United States',
    flag: '🇺🇸',
    tagline: 'Fulbright. Ivy League aid. The world\'s largest research ecosystem.',
    highlights: ['Fulbright Foreign Student Program', 'University fellowships cover full funding', 'OPT: 1–3 years post-study work'],
    scholarship_count: 19,
  },
];

export default function DestinationsPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Where to study</p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Destination Guides
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Everything you need to know about studying in each country — visas, costs, scholarships, and life on the ground.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DESTINATIONS.map((d) => (
            <Link
              key={d.slug}
              href={`/destinations/${d.slug}/`}
              className="group flex flex-col gap-4 rounded-3xl border border-border/50 bg-card p-6 transition-all hover:border-teal/40 hover:shadow-lg"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl">{d.flag}</span>
                <div>
                  <p className="font-display text-lg font-bold text-foreground group-hover:text-teal transition-colors">{d.name}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">{d.scholarship_count} scholarships</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{d.tagline}</p>
              <ul className="space-y-1">
                {d.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className="mt-0.5 text-teal shrink-0">✓</span>
                    {h}
                  </li>
                ))}
              </ul>
              <span className="text-xs font-semibold text-teal">
                Read guide →
              </span>
            </Link>
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Scholarship Destination Guides',
            url: 'https://scholarhub.africa/destinations/',
            itemListElement: DESTINATIONS.map((d, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              name: d.name,
              url: `https://scholarhub.africa/destinations/${d.slug}/`,
            })),
          }),
        }}
      />
    </div>
  );
}
