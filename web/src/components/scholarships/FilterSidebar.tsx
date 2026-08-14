'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';

import type { CountryRow, FieldRow } from '@/lib/queries';

/**
 * Filter sidebar (port of components/filter_sidebar.html - the Alpine.js
 * filterPanel). Every change navigates to a new URL (full server render),
 * preserving q + ordering - same UX as Django: shareable URLs, back-button,
 * bot-crawlable filtered pages.
 */
const FUNDING_OPTIONS = [
  { value: 'full', label: 'Fully Funded' },
  { value: 'partial', label: 'Partial' },
  { value: 'tuition_only', label: 'Tuition Only' },
  { value: 'living_only', label: 'Living Only' },
];

const ELIG_OPTIONS = [
  { value: 'CE', label: 'Confirmed Eligible' },
  { value: 'LE', label: 'Likely Eligible' },
  { value: 'PE', label: 'Pending Clarification' },
];

const STATUS_OPTIONS = [
  { value: 'open_now', label: 'Open Now' },
  { value: 'opening_soon', label: 'Opening Soon' },
  { value: 'upcoming', label: 'Upcoming' },
];

interface Selected {
  countries: string[];
  fields: string[];
  funding: string[];
  eligibility: string[];
  statuses: string[];
  minScore: number;
}

export function FilterSidebar({
  countries,
  fields,
}: {
  countries: CountryRow[];
  fields: FieldRow[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initial = useMemo<Selected>(() => {
    const list = (key: string) =>
      (searchParams.getAll(key) ?? []).flatMap((v: string) => v.split(',').filter(Boolean));
    return {
      countries: list('country'),
      fields: list('field'),
      funding: list('funding'),
      eligibility: list('eligibility'),
      statuses: list('status'),
      minScore: parseInt(searchParams.get('min_score') ?? '0', 10) || 0,
    };
  }, [searchParams]);

  const [selected, setSelected] = useState<Selected>(initial);
  const [open, setOpen] = useState(false);

  const activeCount =
    selected.countries.length +
    selected.fields.length +
    selected.funding.length +
    selected.eligibility.length +
    selected.statuses.length +
    (selected.minScore > 0 ? 1 : 0);

  const navigate = (next: Selected) => {
    const params = new URLSearchParams();
    if (next.countries.length) params.set('country', next.countries.join(','));
    if (next.fields.length) params.set('field', next.fields.join(','));
    if (next.funding.length) params.set('funding', next.funding.join(','));
    if (next.eligibility.length) params.set('eligibility', next.eligibility.join(','));
    if (next.statuses.length) params.set('status', next.statuses.join(','));
    if (next.minScore > 0) params.set('min_score', String(next.minScore));
    const q = searchParams.get('q');
    if (q) params.set('q', q);
    const ordering = searchParams.get('ordering');
    if (ordering) params.set('ordering', ordering);
    router.push(`/scholarships/?${params.toString()}`);
  };

  const toggle = (
    key: keyof Selected,
    value: string,
  ) => {
    const next = { ...selected };
    const list = [...next[key] as string[]];
    const index = list.indexOf(value);
    if (index >= 0) list.splice(index, 1);
    else list.push(value);
    (next as Record<string, unknown>)[key] = list;
    setSelected(next);
    navigate(next);
  };

  const setMinScore = (value: number) => {
    const next = { ...selected, minScore: value };
    setSelected(next);
    navigate(next);
  };

  const clearAll = () => {
    const next: Selected = {
      countries: [], fields: [], funding: [], eligibility: [], statuses: [], minScore: 0,
    };
    setSelected(next);
    const params = new URLSearchParams();
    const q = searchParams.get('q');
    if (q) params.set('q', q);
    router.push(`/scholarships/?${params.toString()}`);
  };

  const checkbox = (
    key: keyof Selected,
    value: string,
    checked: boolean,
  ) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={() => toggle(key, value)}
      className="h-4 w-4 shrink-0 cursor-pointer rounded border border-border-soft bg-background text-accent transition-all duration-200 focus:ring-2 focus:ring-accent focus:ring-offset-1"
      aria-label={value}
    />
  );

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-outline w-full md:hidden flex justify-between items-center"
        aria-expanded={open}
      >
        <span>{open ? 'Hide Filters' : 'Show Filters'}</span>
        {activeCount > 0 && (
          <span className="badge bg-accent text-accent-foreground border-accent">{activeCount}</span>
        )}
      </button>

      <div
        className={`card space-y-6 ${open ? 'block' : 'hidden md:block'}`}
      >
        <div className="flex items-center justify-between border-b border-border-soft pb-5">
          <h3 className="font-display text-lg font-semibold tracking-tight text-foreground">Filters</h3>
          {activeCount > 0 && (
            <button type="button" onClick={clearAll} className="btn-ghost h-6 px-2 text-[10px] uppercase tracking-widest font-mono">
              Clear
            </button>
          )}
        </div>

        {/* Destination Country */}
        <div className="space-y-3">
          <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Destination Country</h4>
          <div className="max-h-56 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
            {countries.map((country) => (
              <label
                key={country.iso_code}
                className="group flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                <span className="flex items-center gap-2.5 text-foreground">
                  {checkbox('countries', country.iso_code, selected.countries.includes(country.iso_code))}
                  <span>
                    {country.flag_emoji} {country.name}
                  </span>
                </span>
                <span className="font-mono text-[10px] text-muted-foreground group-hover:text-foreground">{country.scholarship_count}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Field of Study */}
        <div className="filter-group">
          <h4 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Field of Study</h4>
          <div className="max-h-56 space-y-1 overflow-y-auto pr-2 custom-scrollbar">
            {fields.map((field) => (
              <label
                key={field.slug}
                className="group flex cursor-pointer items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted"
              >
                <span className="flex items-center gap-2.5 text-foreground">
                  {checkbox('fields', field.slug, selected.fields.includes(field.slug))}
                  <span>
                    {field.icon} {field.name}
                  </span>
                </span>
                <span className="font-mono text-[10px] text-muted-foreground group-hover:text-foreground">{field.scholarship_count}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Funding */}
        <div className="filter-group">
          <h4 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Funding</h4>
          <div className="space-y-1">
            {FUNDING_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
              >
                {checkbox('funding', option.value, selected.funding.includes(option.value))}
                {option.label}
              </label>
            ))}
          </div>
        </div>

        {/* Eligibility */}
        <div className="filter-group">
          <h4 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Eligibility</h4>
          <div className="space-y-1">
            {ELIG_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
              >
                {checkbox('eligibility', option.value, selected.eligibility.includes(option.value))}
                {option.label}
              </label>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="filter-group">
          <h4 className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Status</h4>
          <div className="space-y-1">
            {STATUS_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
              >
                {checkbox('statuses', option.value, selected.statuses.includes(option.value))}
                {option.label}
              </label>
            ))}
          </div>
        </div>

        {/* Minimum score slider */}
        <div className="filter-group">
          <h4 className="mb-3 flex justify-between font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            <span>Minimum score</span>
            <span className="text-accent">{selected.minScore}</span>
          </h4>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={selected.minScore}
            onChange={(e) => setMinScore(parseInt(e.target.value, 10))}
            className="w-full cursor-pointer accent-accent transition-all hover:accent-accent/80"
            aria-label="Minimum score"
          />
        </div>
      </div>
    </div>
  );
}
