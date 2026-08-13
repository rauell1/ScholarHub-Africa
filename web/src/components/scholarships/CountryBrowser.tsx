'use client';

import { useMemo, useState } from 'react';

import type { CountryGroup } from '@/lib/queries';

const REGION_EMOJI: Record<string, string> = {
  Europe: '🌍',
  Asia: '🌏',
  Americas: '🌎',
  Africa: '🌍',
  Oceania: '🌊',
};

function SearchIcon() {
  return (
    <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
    </svg>
  );
}

export function CountryBrowser({ regions }: { regions: CountryGroup[] }) {
  const [query, setQuery] = useState('');

  const totalCountries = regions.reduce((sum, r) => sum + r.countries.length, 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return regions;
    return regions
      .map((r) => ({
        ...r,
        countries: r.countries.filter((c) => c.name.toLowerCase().includes(q)),
      }))
      .filter((r) => r.countries.length > 0);
  }, [query, regions]);

  const isFiltering = query.trim().length > 0;
  const matchCount = filtered.reduce((s, r) => s + r.countries.length, 0);

  return (
    <>
      {/* Sticky filter + region pills */}
      <div className="sticky top-14 z-20 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <SearchIcon />
            </span>
            <input
              type="search"
              placeholder={`Search ${totalCountries} countries…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input py-2.5 pl-9 text-sm"
              aria-label="Filter countries"
            />
            {isFiltering && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                aria-label="Clear filter"
              >
                ✕
              </button>
            )}
          </div>

          {!isFiltering && (
            <div className="mt-2.5 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {regions.map((r) => (
                <a
                  key={r.region}
                  href={`#region-${r.region.toLowerCase()}`}
                  className="shrink-0 rounded-full border border-border px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground transition-colors hover:border-teal hover:text-teal"
                >
                  {REGION_EMOJI[r.region] ?? '🌐'} {r.region}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {isFiltering && (
          <p className="mb-6 text-sm text-muted-foreground">
            {matchCount === 0
              ? `No countries match "${query}"`
              : `${matchCount} countr${matchCount === 1 ? 'y' : 'ies'} matching "${query}"`}
          </p>
        )}

        <div className={isFiltering ? 'space-y-3' : 'space-y-14'}>
          {filtered.map(({ region, countries }) => (
            <div key={region} id={`region-${region.toLowerCase()}`}>
              {(!isFiltering || filtered.length > 1) && (
                <h2 className="mb-4 font-display text-xl font-semibold text-foreground">
                  {REGION_EMOJI[region] ?? '🌐'} {region}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    {countries.length} destination{countries.length === 1 ? '' : 's'}
                  </span>
                </h2>
              )}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {countries.map((c) => (
                  <a
                    key={c.iso_code}
                    href={`/scholarships/?country=${c.iso_code}`}
                    className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:border-teal hover:shadow-soft"
                  >
                    <span className="shrink-0 text-3xl leading-none" aria-hidden="true">
                      {c.flag_emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground group-hover:text-teal transition-colors">
                        {c.name}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {c.count} scholarship{c.count === 1 ? '' : 's'}
                      </p>
                    </div>
                    <svg
                      className="h-4 w-4 shrink-0 text-border transition-colors group-hover:text-teal"
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-2xl">🌐</p>
            <p className="mt-2 text-sm font-medium text-foreground">No countries found</p>
            <p className="mt-1 text-xs text-muted-foreground">Try a different spelling or browse all regions above.</p>
            <button
              type="button"
              onClick={() => setQuery('')}
              className="btn-outline mt-4 text-xs"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>
    </>
  );
}
