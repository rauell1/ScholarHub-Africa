import type { Metadata } from 'next';
import Link from 'next/link';

import { FilterSidebar } from '@/components/scholarships/FilterSidebar';
import { Breadcrumbs } from '@/components/scholarships/Breadcrumbs';
import { ScholarshipCard } from '@/components/scholarships/ScholarshipCard';
import { SearchBar } from '@/components/scholarships/SearchBar';
import { SortSelect } from '@/components/scholarships/SortSelect';
import { StickyCta } from '@/components/scholarships/StickyCta';
import { getUserGeo } from '@/lib/geo';
import { parseScholarshipFilters } from '@/lib/filters';
import {
  countScholarships,
  getCountries,
  getFields,
  queryScholarshipCards,
  type CountryRow,
  type FieldRow,
  type ScholarshipCardRow,
  type ScholarshipFilters,
} from '@/lib/queries';

/**
 * Scholarship directory (port of templates/scholarships/directory.html).
 * Server-rendered per request with URL-driven filters (shareable URLs,
 * back-button, bot-crawlable filtered pages - Django parity). The API
 * returns 503 when the DB is unreachable; the page degrades to a friendly
 * empty state instead of crashing the shell.
 */
export const dynamic = 'force-dynamic';

const PAGE_SIZE = 12; // DIRECTORY_PAGE_SIZE

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const DIRECTORY_DESCRIPTION =
  "Browse 45+ human-verified fully-funded master's scholarships for African students. Filter by country, field, funding, eligibility, deadline and score.";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: SearchParams;
}): Promise<Metadata> {
  const sp = await searchParams;
  const query = (sp.q as string)?.trim();
  // Django: "Search: <q> - Scholarships - ScholarHub Africa" when searching;
  // the layout template appends " - ScholarHub Africa".
  return {
    title: query ? `Search: ${query.slice(0, 28)} - Scholarships` : 'Scholarships',
    description: DIRECTORY_DESCRIPTION,
    alternates: { canonical: '/scholarships/' },
  };
}

export default async function DirectoryPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (Array.isArray(value)) value.forEach((v) => params.append(key, v));
    else if (value !== undefined) params.set(key, value);
  }

  // django-filter ignores invalid filter values - match by falling back to
  // unfiltered on a parse error.
  let filters: ScholarshipFilters = {};
  try {
    filters = parseScholarshipFilters(params);
  } catch {
    filters = {};
  }

  const rawPage = parseInt(sp.page as string, 10);
  const page = Number.isInteger(rawPage) && rawPage > 0 ? rawPage : 1;
  const query = (sp.q as string)?.trim() ?? '';

  const isFiltered =
    params.has('country') || params.has('field') || params.has('funding') ||
    params.has('eligibility') || params.has('status') || params.has('q');

  let cards: ScholarshipCardRow[] = [];
  let total = 0;
  let countries: CountryRow[] = [];
  let fields: FieldRow[] = [];
  let dbError = false;
  let geo = null;
  try {
    [cards, total, countries, fields, geo] = await Promise.all([
      queryScholarshipCards({ ...filters, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }, undefined),
      countScholarships(filters, undefined),
      getCountries({ activeOnly: false }, undefined),
      getFields(undefined),
      getUserGeo(),
    ]);
  } catch {
    dbError = true;
  }

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const label = query ? `Search: ${query}` : 'Directory';

  const pageUrl = (number: number) => {
    const p = new URLSearchParams(params);
    p.set('page', String(number));
    return `?${p.toString()}`;
  };

  return (
    <>
      <section className="relative overflow-hidden bg-background py-12 md:py-16 border-b border-border">
        {/* Subtle mesh background effect */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-accent/5 via-background to-background" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6">
          <Breadcrumbs items={[{ name: 'Home', href: '/' }]} current={label} />
          <h1 className="mt-5 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Scholarship Directory</h1>
          <p className="mt-2 text-base text-muted-foreground">Search, filter and compare verified opportunities.</p>

          {/* Geo personalisation hint — only when unfiltered and geo is known */}
          {geo?.isAfrican && !isFiltered && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/5 px-3.5 py-1.5 text-sm text-foreground">
              <span className="text-base" aria-hidden="true">{geo.flag}</span>
              <span>
                Showing results for <strong>{geo.name}</strong> students ·{' '}
                <Link
                  href="/scholarships/?eligibility=PE"
                  className="font-semibold text-teal underline-offset-2 hover:underline"
                >
                  Pan-African eligible only
                </Link>
              </span>
            </div>
          )}

          <div className="mt-5 max-w-2xl">
            <SearchBar id="directory" initialValue={query} />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-6 lg:grid-cols-4">
          <aside className="lg:col-span-1">
            <FilterSidebar countries={countries} fields={fields} />
          </aside>

          <div className="lg:col-span-3">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">
                <span className="font-bold text-foreground">{total}</span> result{total === 1 ? '' : 's'}
                {query && (
                  <>
                    {' '}
                    for <span className="font-semibold text-teal">“{query}”</span>
                  </>
                )}
              </p>
              <SortSelect
                defaultValue={(sp.ordering as string) ?? 'score'}
                hiddenInputs={Array.from(params.entries()).filter(
                  ([key]) => key !== 'ordering' && key !== 'page',
                )}
              />
            </div>

            {dbError ? (
              <div className="card py-16 text-center">
                <p className="text-4xl" aria-hidden="true">🛠️</p>
                <h2 className="mt-3 font-bold text-foreground">The directory is temporarily unavailable</h2>
                <p className="mt-1 text-sm text-muted-foreground">Please try again in a moment.</p>
              </div>
            ) : cards.length > 0 ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {cards.map((card) => (
                    <ScholarshipCard key={card.id} row={card} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <nav className="mt-8 flex items-center justify-center gap-2" aria-label="Pagination">
                    {page > 1 && (
                      <Link className="btn-outline px-3 py-1.5" href={pageUrl(page - 1)}>
                        ← Prev
                      </Link>
                    )}
                    <span className="text-sm text-muted-foreground">
                      Page {page} of {totalPages}
                    </span>
                    {page < totalPages && (
                      <Link className="btn-outline px-3 py-1.5" href={pageUrl(page + 1)}>
                        Next →
                      </Link>
                    )}
                  </nav>
                )}
              </>
            ) : (
              <div className="card py-24 text-center border-dashed border-2">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                  <p className="text-2xl" aria-hidden="true">🔍</p>
                </div>
                <h2 className="mt-5 font-display text-xl font-bold text-foreground">No scholarships match those filters</h2>
                <p className="mt-2 text-sm text-muted-foreground text-balance">Try removing a filter or searching a different term to find what you&apos;re looking for.</p>
                <Link href="/scholarships/" className="btn-primary mt-6">
                  Clear all filters
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      <StickyCta />
    </>
  );
}
