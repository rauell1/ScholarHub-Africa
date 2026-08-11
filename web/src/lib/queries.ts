/**
 * Shared data-fetching layer (docs/MIGRATION_PLAN.md §5 - Phase 3).
 *
 * These are the ONLY functions pages and API routes call for scholarship
 * data, so RSC pages and /api/v1/* handlers can never drift apart. Signatures
 * below are the M1 placeholders; the Drizzle implementations land in Phase 3
 * (the SQL semantics are already specified by the Django originals:
 * apps/scholarships/filters.py, search.py, views.py, tasks.py).
 */
export type HomeStats = {
  scholarships: number;
  countries: number;
  open_now: number;
  verified: number;
};

/** Homepage stats strip. M1: placeholder zeros until Phase 3 wires the DB. */
export async function getHomeStats(): Promise<HomeStats> {
  // TODO(Phase 3): COUNT(*) equivalents of apps/scholarships/views.py home()
  return { scholarships: 0, countries: 0, open_now: 0, verified: 0 };
}
