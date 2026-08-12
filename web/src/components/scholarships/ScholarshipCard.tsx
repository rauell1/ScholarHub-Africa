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
    <article className="card group relative flex flex-col gap-4 overflow-hidden bg-card transition-all duration-500 hover:border-border-soft hover:shadow-elevated">
      
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
      <div className="relative z-10 mt-auto pt-2">
        <Link 
          href={`/scholarships/${row.slug}/`}
          className="btn-primary w-full py-2.5 shadow-sm"
        >
          View details
        </Link>
      </div>
    </article>
  );
}
