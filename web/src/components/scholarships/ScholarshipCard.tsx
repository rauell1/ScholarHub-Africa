import Link from 'next/link';

import { fundingLabel } from '@/lib/labels';
import type { ScholarshipCardRow } from '@/lib/queries';
import { DeadlineBadge } from './DeadlineBadge';
import { EligibilityBadge } from './EligibilityBadge';

import { FlagChip } from './FlagChip';
import { ScoreBadge } from './ScoreBadge';

/**
 * Reusable scholarship card featuring editorial typography and minimal layout.
 * Server component - no client JS needed for rendering.
 */
export function ScholarshipCard({ row }: { row: ScholarshipCardRow }) {
  return (
    <article className="card group relative flex flex-col gap-4 overflow-hidden">
      
      {/* Subtle background glow on hover */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-accent/0 to-accent/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" aria-hidden="true" />

      {/* Title & Editorial Subtitle */}
      <div className="relative z-10">
        <h3 className="font-display text-2xl font-bold leading-tight text-foreground">
          {row.name}
        </h3>
        <p className="mt-2 flex flex-wrap items-center gap-1.5 font-serif text-lg italic text-muted-foreground">
          {row.university || row.programme || null}
          {(row.university || row.programme) && <span className="not-italic text-border px-1">•</span>}
          <span className="not-italic inline-flex"><FlagChip row={row} /></span>
        </p>
      </div>

      {/* Simplified Metadata */}
      {row.status === 'closed' && (
        <div className="relative z-10 -mt-1 flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-crimson/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-crimson ring-1 ring-inset ring-crimson/20">
            Closed
          </span>
          {row.cycle_year != null && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber ring-1 ring-inset ring-amber/20">
              Reopens {row.cycle_year}
            </span>
          )}
        </div>
      )}

      <div className="relative z-10 mt-2 space-y-1.5 border-l-2 border-border pl-3 text-sm text-foreground">
        <p>
          <span className="font-semibold text-muted-foreground">Award:</span> {fundingLabel(row.funding_type)}
          {row.funding_detail ? (
            <span className="text-muted-foreground"> ({row.funding_detail.length > 30 ? `${row.funding_detail.slice(0, 30)}…` : row.funding_detail})</span>
          ) : null}
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-muted-foreground">Deadline:</span>
          <DeadlineBadge deadline={row.deadline_date} />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-semibold text-muted-foreground">Eligibility:</span>
          <EligibilityBadge code={row.eligibility_label} />
          {row.score !== undefined && (
            <span className="ml-2 border-l border-border pl-3"><ScoreBadge score={row.score} /></span>
          )}
        </div>
      </div>

      {/* Fields */}
      <div className="relative z-10 flex flex-wrap gap-1">
        {row.fields.slice(0, 2).map((slug) => (
          <span key={slug} className="badge">
            {slug.replace(/-/g, ' ')}
          </span>
        ))}
      </div>

      {/* Primary Action Button (Indigo) */}
      <div className="relative z-10 mt-auto pt-4">
        <Link 
          href={`/scholarships/${row.slug}/`}
          className="btn-primary group/btn flex w-full items-center justify-center gap-2 py-3"
        >
          View details
          <svg className="h-4 w-4 text-accent-foreground/70 transition-transform duration-300 group-hover/btn:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </Link>
      </div>
    </article>
  );
}
