import Link from 'next/link';

import { fundingLabel } from '@/lib/labels';
import type { ScholarshipCardRow } from '@/lib/queries';
import { DeadlineBadge } from './DeadlineBadge';
import { EligibilityBadge } from './EligibilityBadge';
import { FlagChip } from './FlagChip';
import { ScoreBadge } from './ScoreBadge';

/**
 * Reusable scholarship card (port of components/scholarship_card.html).
 * Server component - no client JS needed for rendering.
 */
export function ScholarshipCard({ row }: { row: ScholarshipCardRow }) {
  return (
    <article className="card group relative flex flex-col gap-4 overflow-hidden bg-card transition-all duration-500 hover:border-accent/40">
      <div className="relative z-10 flex items-start justify-between gap-2">
        <FlagChip row={row} />
        <div className="flex shrink-0 items-center gap-1.5">
          <EligibilityBadge code={row.eligibility_label} />
          <ScoreBadge score={row.score} />
        </div>
      </div>

      <div className="relative z-10">
        <h3 className="font-display text-xl font-semibold leading-tight text-foreground transition-colors group-hover:text-accent">
          <Link href={`/scholarships/${row.slug}/`} className="before:absolute before:inset-0">
            {row.name}
          </Link>
        </h3>
        <p className="mt-1.5 text-sm text-muted-foreground">{row.university || row.programme}</p>
      </div>

      <dl className="relative z-10 space-y-2 text-sm border-t border-border-soft pt-4 mt-2">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground font-mono text-[10px] uppercase tracking-widest">Funding</dt>
          <dd className="text-right font-medium text-foreground">
            {fundingLabel(row.funding_type)}
            {row.funding_detail ? (
              <span className="block text-[11px] text-muted-foreground">
                {row.funding_detail.length > 42
                  ? `${row.funding_detail.slice(0, 42)}…`
                  : row.funding_detail}
              </span>
            ) : null}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground font-mono text-[10px] uppercase tracking-widest">Deadline</dt>
          <dd>
            <DeadlineBadge deadline={row.deadline_date} />
          </dd>
        </div>
      </dl>

      <div className="relative z-10 flex flex-wrap gap-1 mt-2">
        {row.fields.slice(0, 3).map((slug) => (
          <span key={slug} className="badge">
            {slug.replace(/-/g, ' ')}
          </span>
        ))}
      </div>

      <div className="relative z-10 mt-auto flex items-center justify-between border-t border-border-soft pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors group-hover:text-accent">
        <span>View Details</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"><path d="M7 7h10v10"></path><path d="M7 17 17 7"></path></svg>
      </div>
    </article>
  );
}
