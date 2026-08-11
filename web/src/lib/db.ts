import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import type { NeonDatabase } from 'drizzle-orm/neon-serverless';

import * as schema from '../db/schema';
import { env } from './env';

export type Db = NeonDatabase<typeof schema>;

/**
 * Serverless-safe DB client (docs/MIGRATION_PLAN.md §2, §3).
 *
 * - @neondatabase/serverless Pool with the POOLED connection string keeps a
 *   single connection per function instance (replaces Django's conn_max_age).
 * - Drizzle is bound to the full schema (src/db/schema.ts).
 * - LAZY: getDb() throws only when first USED without DATABASE_URL, so pages
 *   that don't touch the DB (homepage, consent banner) still build and run
 *   in previews; callers that must survive DB absence wrap in try/catch.
 * - Module-level singleton survives RSC/route-handler reuse; the global
 *   cache prevents pool duplication during dev hot reloads.
 */
function createClient(): Db {
  if (!env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set - add it to web/.env.local using the Neon POOLED connection string.',
    );
  }
  const pool = new Pool({ connectionString: env.DATABASE_URL, max: 1 });
  return drizzle(pool, { schema });
}

const globalForDb = globalThis as unknown as {
  __scholarhubDb?: Db;
};

export function getDb(): Db {
  if (!globalForDb.__scholarhubDb) {
    globalForDb.__scholarhubDb = createClient();
  }
  return globalForDb.__scholarhubDb;
}
