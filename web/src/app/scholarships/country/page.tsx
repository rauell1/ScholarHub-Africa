import type { Metadata } from 'next';

import { getCountriesByRegion } from '@/lib/queries';

/**
 * Scholarships by country (port of templates/scholarships/by_country.html).
 * Groups active scholarships by destination country region.
 */
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Scholarships by Country',
  description:
    "Explore fully-funded master's scholarships grouped by destination country - Germany, UK, Netherlands, Australia and 19 more, all human-verified against official sources.",
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
      <section className="bg-foreground py-10 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h1 className="text-2xl font-extrabold sm:text-3xl">🌍 Scholarships by Country</h1>
          <p className="mt-1 text-sm text-white/60">Choose a destination - every opportunity is verified.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-10 px-4 py-10 sm:px-6">
        {regions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No scholarships yet - check back soon.</p>
        ) : (
          regions.map(({ region, countries }) => (
            <div key={region}>
              <h2 className="section-title">{region}</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                {countries.map((country) => (
                  <a
                    key={country.iso_code}
                    href={`/scholarships/?country=${country.iso_code}`}
                    className="card flex flex-col items-center gap-1 py-4 text-center transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <span className="text-3xl" aria-hidden="true">{country.flag_emoji}</span>
                    <span className="text-sm font-semibold text-foreground">{country.name}</span>
                    <span className="badge bg-teal-light text-teal">
                      {country.count} scholarship{country.count === 1 ? '' : 's'}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </>
  );
}
