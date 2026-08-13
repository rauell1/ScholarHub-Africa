'use client';

import { useMemo, useState } from 'react';

import type { FieldRow } from '@/lib/queries';

/** Slug → emoji map. Falls back to keyword scan then generic icon. */
const SLUG_ICON: Record<string, string> = {
  water: '💧',
  energy: '⚡',
  'renewable-energy': '☀️',
  'sustainable-energy': '🔋',
  'energy-engineering': '⚙️',
  'energy-policy': '📋',
  engineering: '⚙️',
  'environmental-engineering': '🌿',
  environment: '🌿',
  climate: '🌍',
  'smart-grids': '🔌',
  'power-systems': '🔌',
  sustainability: '♻️',
  'agricultural-engineering': '🌾',
  agriculture: '🌱',
  'ai-for-energy': '🤖',
  'data-science': '📊',
  battery: '🔋',
  ev: '⚡',
  'ev-technology': '⚡',
  'public-health': '🏥',
  law: '⚖️',
  'urban-planning': '🏙️',
  'all-fields': '🌐',
  'development-focus': '🌏',
  'international-development': '🌏',
  economics: '📈',
  finance: '💰',
  'social-science': '🤝',
  'computer-science': '💻',
  'information-technology': '💻',
  medicine: '⚕️',
  chemistry: '🧪',
  physics: '⚛️',
  mathematics: '📐',
  architecture: '🏛️',
  'business-administration': '💼',
  education: '🎓',
};

function fieldIcon(slug: string, name: string): string {
  if (SLUG_ICON[slug]) return SLUG_ICON[slug];
  const s = (slug + ' ' + name).toLowerCase();
  if (s.includes('water')) return '💧';
  if (s.includes('solar') || s.includes('renewable')) return '☀️';
  if (s.includes('energy')) return '⚡';
  if (s.includes('climate') || s.includes('environment')) return '🌿';
  if (s.includes('health')) return '🏥';
  if (s.includes('agri')) return '🌱';
  if (s.includes('engineer')) return '⚙️';
  if (s.includes('data') || s.includes('ai') || s.includes('computer')) return '💻';
  if (s.includes('law') || s.includes('legal')) return '⚖️';
  if (s.includes('sustain')) return '♻️';
  if (s.includes('battery') || s.includes('ev')) return '🔋';
  if (s.includes('grid') || s.includes('power')) return '🔌';
  if (s.includes('all field')) return '🌐';
  return '📚';
}

function SearchIcon() {
  return (
    <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 15.803 7.5 7.5 0 0016.803 15.803z" />
    </svg>
  );
}

export function FieldBrowser({ fields }: { fields: FieldRow[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return fields;
    return fields.filter((f) => f.name.toLowerCase().includes(q) || f.slug.includes(q));
  }, [query, fields]);

  const isFiltering = query.trim().length > 0;

  return (
    <>
      {/* Sticky filter */}
      <div className="sticky top-14 z-20 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-6">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <SearchIcon />
            </span>
            <input
              type="search"
              placeholder={`Search ${fields.length} fields of study…`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="input py-2.5 pl-9 text-sm"
              aria-label="Filter fields of study"
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
        </div>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {isFiltering && (
          <p className="mb-6 text-sm text-muted-foreground">
            {filtered.length === 0
              ? `No fields match "${query}"`
              : `${filtered.length} field${filtered.length === 1 ? '' : 's'} matching "${query}"`}
          </p>
        )}

        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((field) => (
              <a
                key={field.slug}
                id={field.slug}
                href={`/scholarships/?field=${field.slug}`}
                className="group flex items-center gap-4 rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:border-teal hover:shadow-soft"
              >
                <span
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted text-2xl transition-transform group-hover:scale-105"
                  aria-hidden="true"
                >
                  {fieldIcon(field.slug, field.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground group-hover:text-teal transition-colors">
                    {field.name}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {field.scholarship_count} scholarship{field.scholarship_count === 1 ? '' : 's'}
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
        ) : (
          <div className="py-20 text-center">
            <p className="text-2xl">📚</p>
            <p className="mt-2 text-sm font-medium text-foreground">No fields found</p>
            <p className="mt-1 text-xs text-muted-foreground">Try a different keyword.</p>
            <button type="button" onClick={() => setQuery('')} className="btn-outline mt-4 text-xs">
              Clear filter
            </button>
          </div>
        )}
      </div>
    </>
  );
}
