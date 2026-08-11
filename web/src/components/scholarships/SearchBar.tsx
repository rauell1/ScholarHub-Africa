'use client';

import { useEffect, useRef, useState } from 'react';

interface Suggestion {
  slug: string;
  name: string;
  country_name: string;
  score: number;
}

/**
 * Search bar with debounced live suggestions
 * (port of components/search_bar.html). Submits to /scholarships/?q= for a
 * full server-rendered search page; suggestions come from /api/v1/search/.
 */
export function SearchBar({
  id = 'main',
  large = false,
  placeholder = 'Search scholarships, universities, countries...',
  initialValue = '',
}: {
  id?: string;
  large?: boolean;
  placeholder?: string;
  initialValue?: string;
}) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      setResults([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/v1/search/?q=${encodeURIComponent(value)}`);
        if (!res.ok) return;
        const data = (await res.json()) as { results: Suggestion[] };
        setResults(data.results ?? []);
        setOpen((data.results ?? []).length > 0);
      } catch {
        setOpen(false);
      }
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  return (
    <div ref={containerRef} className="relative w-full">
      <form action="/scholarships/" method="get" role="search">
        <label htmlFor={`q-${id}`} className="sr-only">
          Search scholarships
        </label>
        <div className="relative">
          <input
            id={`q-${id}`}
            type="search"
            name="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            autoComplete="off"
            className={`input ${large ? 'py-4 text-base' : ''} pr-12`}
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-xl bg-teal px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-teal-light"
          >
            Search
          </button>
        </div>
      </form>

      {open && results.length > 0 && (
        <div
          className="absolute left-0 right-0 top-full z-30 mt-2 max-h-96 overflow-y-auto rounded-2xl bg-card p-2 shadow-xl ring-1 ring-border"
          role="listbox"
          aria-label="Search suggestions"
        >
          {results.map((result) => (
            <a
              key={result.slug}
              href={`/scholarships/${result.slug}/`}
              className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-foreground/5"
              onClick={() => setOpen(false)}
            >
              <span className="text-sm font-semibold text-foreground">{result.name}</span>
              <span className="shrink-0 text-xs text-foreground/50">
                {result.country_name} · {result.score}/100
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
