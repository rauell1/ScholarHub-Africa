'use client';

import { useEffect, useRef, useState } from 'react';

interface ScholarshipHit {
  slug: string;
  name: string;
  country_name: string;
  score: number;
}

export interface SearchHint {
  label: string;
  href: string;
  type: 'country' | 'field';
  emoji?: string;
}

/**
 * Search bar with debounced live scholarship suggestions + instant
 * country/field category hints passed as props from the parent.
 */
export function SearchBar({
  id = 'main',
  large = false,
  placeholder = 'Search scholarships, countries, fields…',
  initialValue = '',
  hints = [],
}: {
  id?: string;
  large?: boolean;
  placeholder?: string;
  initialValue?: string;
  hints?: SearchHint[];
}) {
  const [query, setQuery] = useState(initialValue);
  const [scholarships, setScholarships] = useState<ScholarshipHit[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Matching country/field hints (instant, client-side)
  const matchingHints = query.trim().length >= 1
    ? hints.filter((h) => h.label.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 4)
    : [];

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const value = query.trim();
    if (value.length < 2) {
      setScholarships([]);
      setOpen(matchingHints.length > 0);
      return;
    }
    setOpen(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/search/?q=${encodeURIComponent(value)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { results: ScholarshipHit[] };
        setScholarships(data.results ?? []);
        setOpen((data.results ?? []).length > 0 || matchingHints.length > 0);
      } catch {
        /* network error — keep hints open */
      }
    }, 300);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const hasDropdown = open && (matchingHints.length > 0 || scholarships.length > 0);

  return (
    <div ref={containerRef} className="relative w-full">
      <form action="/scholarships/" method="get" role="search">
        <label htmlFor={`q-${id}`} className="sr-only">Search scholarships</label>
        <div className="relative">
          <input
            id={`q-${id}`}
            type="search"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { if (matchingHints.length > 0 || scholarships.length > 0) setOpen(true); }}
            placeholder={placeholder}
            autoComplete="off"
            className={`input ${large ? 'py-4 text-base' : ''} pr-12`}
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-teal px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal/90 hover:shadow-md active:scale-95"
          >
            Search
          </button>
        </div>
      </form>

      {hasDropdown && (
        <div
          className="absolute left-0 right-0 top-full z-30 mt-2 max-h-[28rem] overflow-y-auto rounded-2xl bg-card p-2 shadow-elevated ring-1 ring-border animate-fade-in-up"
          style={{ animationDuration: '0.2s' }}
          role="listbox"
          aria-label="Search suggestions"
        >
          {/* Country / field category hits */}
          {matchingHints.length > 0 && (
            <div>
              <p className="px-3 pb-1 pt-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                Countries &amp; Fields
              </p>
              {matchingHints.map((h) => (
                <a
                  key={h.href}
                  href={h.href}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 transition-colors hover:bg-foreground/5"
                  onClick={() => setOpen(false)}
                >
                  {h.emoji && <span className="text-lg" aria-hidden="true">{h.emoji}</span>}
                  <span className="text-sm font-medium text-foreground">{h.label}</span>
                  <span className="ml-auto shrink-0 rounded-full bg-muted px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                    {h.type}
                  </span>
                </a>
              ))}
            </div>
          )}

          {/* Scholarship hits */}
          {scholarships.length > 0 && (
            <div>
              {matchingHints.length > 0 && (
                <p className="px-3 pb-1 pt-3 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  Scholarships
                </p>
              )}
              {scholarships.map((r) => (
                <a
                  key={r.slug}
                  href={`/scholarships/${r.slug}/`}
                  className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-foreground/5"
                  onClick={() => setOpen(false)}
                >
                  <span className="min-w-0 text-sm font-semibold text-foreground truncate">{r.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {r.country_name} · {r.score}/100
                  </span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
