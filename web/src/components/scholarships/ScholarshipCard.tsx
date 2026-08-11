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
    <article className="card group relative flex flex-col gap-3 overflow-hidden border border-border bg-white/80 backdrop-blur-md transition-all duration-300 hover:-translate-y-2 hover:border-teal/50 hover:shadow-neon-teal dark:bg-navy-light/80">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-teal/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative z-10 flex items-start justify-between gap-2">
        <FlagChip row={row} />
        <div className="flex shrink-0 items-center gap-1.5">
          <EligibilityBadge code={row.eligibility_label} />
          <ScoreBadge score={row.score} />
        </div>
      </div>

      <div className="relative z-10">
        <h3 className="font-bold leading-snug text-navy">
          <Link href={`/scholarships/${row.slug}/`} className="transition-colors hover:text-teal">
            {row.name}
          </Link>
        </h3>
        <p className="mt-0.5 text-sm text-navy/60">{row.university || row.programme}</p>
      </div>

      <dl className="relative z-10 space-y-1.5 text-sm">
        <div className="flex items-center justify-between gap-2">
          <dt className="text-navy/60">💰 Funding</dt>
          <dd className="text-right font-medium">
            {fundingLabel(row.funding_type)}
            {row.funding_detail ? (
              <span className="block text-xs text-navy/50">
                {row.funding_detail.length > 42
                  ? `${row.funding_detail.slice(0, 42)}…`
                  : row.funding_detail}
              </span>
            ) : null}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-2">
          <dt className="text-navy/60">🗓 Deadline</dt>
          <dd>
            <DeadlineBadge deadline={row.deadline_date} />
          </dd>
        </div>
      </dl>

      <div className="relative z-10 flex flex-wrap gap-1">
        {row.fields.slice(0, 3).map((slug) => (
          <span key={slug} className="badge bg-sky-light text-sky">
            {slug.replace(/-/g, ' ')}
          </span>
        ))}
      </div>

      <Link href={`/scholarships/${row.slug}/`} className="btn-primary relative z-10 mt-auto w-full">
        View Details →
      </Link>
    </article>
  );
}
