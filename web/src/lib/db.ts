import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

import { env } from './env';

/**
 * Serverless-safe DB client (docs/MIGRATION_PLAN.md §2, §3).
 *
 * - @neondatabase/serverless Pool with the POOLED connection string keeps a
 *   single connection per function instance (replaces Django's conn_max_age).
 * - The Drizzle schema object is wired in Phase 2 (src/db/schema.ts);
 *   until then the client is connection-only.
 * - Module-level singleton survives RSC/route-handler reuse; the global
 *   cache prevents pool duplication during dev hot reloads.
 */
function createClient() {
  if (!env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set - add it to web/.env.local using the Neon POOLED connection string.',
    );
  }
  const pool = new Pool({ connectionString: env.DATABASE_URL, max: 1 });
  return drizzle(pool);
}

const globalForDb = globalThis as unknown as {
  __scholarhubDb?: ReturnType<typeof createClient>;
};

export const db = globalForDb.__scholarhubDb ?? createClient();

if (process.env.NODE_ENV !== 'production') {
  globalForDb.__scholarhubDb = db;
}
