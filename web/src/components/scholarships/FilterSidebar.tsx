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
      (searchParams.getAll(key) ?? []).flatMap((v) => v.split(',').filter(Boolean));
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
      className="rounded border-navy/30 text-teal focus:ring-teal"
      aria-label={value}
    />
  );

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-outline w-full md:hidden"
        aria-expanded={open}
      >
        {open ? 'Hide Filters' : 'Show Filters'}
        {activeCount > 0 && (
          <span className="badge bg-teal text-white">{activeCount} active</span>
        )}
      </button>

      <div
        className={`space-y-5 rounded-2xl bg-white p-4 ring-1 ring-navy/5 ${open ? 'block' : 'hidden md:block'}`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wide text-navy">Filters</h3>
          {activeCount > 0 && (
            <button type="button" onClick={clearAll} className="btn-ghost px-2 py-1 text-xs">
              Clear all
            </button>
          )}
        </div>

        {/* Destination Country */}
        <div className="filter-group">
          <h4 className="mb-2 text-sm font-semibold text-navy/70">Destination Country</h4>
          <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
            {countries.map((country) => (
              <label
                key={country.iso_code}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1 text-sm transition-colors hover:bg-gray-50"
              >
                <span className="flex items-center gap-2">
                  {checkbox('countries', country.iso_code, selected.countries.includes(country.iso_code))}
                  <span>
                    {country.flag_emoji} {country.name}
                  </span>
                </span>
                <span className="badge bg-navy/5 text-navy/60">{country.scholarship_count}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Field of Study */}
        <div className="filter-group">
          <h4 className="mb-2 text-sm font-semibold text-navy/70">Field of Study</h4>
          <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
            {fields.map((field) => (
              <label
                key={field.slug}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-1 text-sm transition-colors hover:bg-gray-50"
              >
                <span className="flex items-center gap-2">
                  {checkbox('fields', field.slug, selected.fields.includes(field.slug))}
                  <span>
                    {field.icon} {field.name}
                  </span>
                </span>
                <span className="badge bg-navy/5 text-navy/60">{field.scholarship_count}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Funding */}
        <div className="filter-group">
          <h4 className="mb-2 text-sm font-semibold text-navy/70">Funding</h4>
          <div className="space-y-1.5">
            {FUNDING_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm transition-colors hover:bg-gray-50"
              >
                {checkbox('funding', option.value, selected.funding.includes(option.value))}
                {option.label}
              </label>
            ))}
          </div>
        </div>

        {/* Eligibility */}
        <div className="filter-group">
          <h4 className="mb-2 text-sm font-semibold text-navy/70">Eligibility</h4>
          <div className="space-y-1.5">
            {ELIG_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm transition-colors hover:bg-gray-50"
              >
                {checkbox('eligibility', option.value, selected.eligibility.includes(option.value))}
                {option.label}
              </label>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="filter-group">
          <h4 className="mb-2 text-sm font-semibold text-navy/70">Status</h4>
          <div className="space-y-1.5">
            {STATUS_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm transition-colors hover:bg-gray-50"
              >
                {checkbox('statuses', option.value, selected.statuses.includes(option.value))}
                {option.label}
              </label>
            ))}
          </div>
        </div>

        {/* Minimum score slider */}
        <div className="filter-group">
          <h4 className="mb-2 text-sm font-semibold text-navy/70">
            Minimum score: <span className="text-teal">{selected.minScore}</span>
          </h4>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            value={selected.minScore}
            onChange={(e) => setMinScore(parseInt(e.target.value, 10))}
            className="w-full accent-teal"
            aria-label="Minimum score"
          />
        </div>
      </div>
    </div>
  );
}
