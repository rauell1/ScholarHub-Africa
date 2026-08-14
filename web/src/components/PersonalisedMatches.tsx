'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface MatchCard {
  id: number;
  name: string;
  short_name: string | null;
  slug: string;
  country_name: string;
  country_flag: string;
  funding_label: string;
  score: number;
  deadline_date: string | null;
}

interface ApiResponse {
  results: MatchCard[];
}

export function PersonalisedMatches() {
  const [matches, setMatches] = useState<MatchCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch('/api/v1/scholarships/recommended/')
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json() as Promise<ApiResponse>;
      })
      .then((data) => setMatches(data.results.slice(0, 6)))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="mt-8">
        <h2 className="mb-4 text-base font-bold text-foreground">Recommended for you</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl border border-border bg-muted/30" />
          ))}
        </div>
      </section>
    );
  }

  if (error || matches.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">Recommended for you</h2>
        <Link href="/scholarships/" className="text-xs font-semibold text-teal hover:underline">
          See all →
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {matches.map((s) => {
          const daysLeft = s.deadline_date
            ? Math.ceil((new Date(s.deadline_date).getTime() - Date.now()) / 86400000)
            : null;

          return (
            <Link
              key={s.id}
              href={`/scholarships/${s.slug}/`}
              className="group flex flex-col justify-between gap-3 rounded-2xl border border-border/50 bg-card p-4 transition-all hover:border-teal/40 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold leading-snug text-foreground group-hover:text-teal transition-colors">
                    {s.short_name || s.name}
                  </p>
                  <span className="shrink-0 font-mono text-xs font-bold text-teal">{s.score}</span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span>{s.country_flag} {s.country_name}</span>
                  <span>·</span>
                  <span className="capitalize">{s.funding_label}</span>
                </div>
              </div>
              {daysLeft !== null && (
                <p className={`text-[11px] font-semibold ${daysLeft <= 14 ? 'text-crimson' : daysLeft <= 30 ? 'text-amber-500' : 'text-muted-foreground'}`}>
                  {daysLeft <= 0 ? 'Deadline passed' : `${daysLeft}d left`}
                </p>
              )}
            </Link>
          );
        })}
      </div>
      <p className="mt-3 text-[11px] text-muted-foreground">
        Matches based on your profile field, nationality, and degree. <Link href="/accounts/profile/" className="text-teal hover:underline">Update profile</Link>
      </p>
    </section>
  );
}
