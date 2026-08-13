import type { Metadata } from 'next';

import { CountryBrowser } from '@/components/scholarships/CountryBrowser';
import { getCountriesByRegion } from '@/lib/queries';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Scholarships by Country',
  description:
    "Explore fully-funded master's scholarships grouped by destination country — Germany, UK, Netherlands, Australia and more, all human-verified against official sources.",
  alternates: { canonical: '/scholarships/country/' },
};

export default async function ByCountryPage() {
  let regions: Awaited<ReturnType<typeof getCountriesByRegion>> = [];
  try {
    regions = await getCountriesByRegion();
  } catch {
    regions = [];
  }

  return (
    <>
      <section className="border-b border-border bg-background py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Scholarships by Country
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Choose a destination — every opportunity is human-verified.
          </p>
        </div>
      </section>

      {regions.length === 0 ? (
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <p className="text-sm text-muted-foreground">No scholarships yet — check back soon.</p>
        </div>
      ) : (
        <CountryBrowser regions={regions} />
      )}
    </>
  );
}
