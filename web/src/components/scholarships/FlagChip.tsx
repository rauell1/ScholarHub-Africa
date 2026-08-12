import type { ScholarshipListRow } from '@/lib/queries';

/** Flag + country name (port of components/flag_chip.html). */
export function FlagChip({ row }: { row: ScholarshipListRow }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-foreground">
      <span className="text-lg leading-none" aria-hidden="true">
        {row.country.flag_emoji}
      </span>
      {row.country.name}
    </span>
  );
}
