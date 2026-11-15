import { sql } from 'drizzle-orm';
import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import type { NeonDatabase } from 'drizzle-orm/neon-serverless';

import * as schema from '../db/schema';
import { env } from './env';
import { scoped } from './runtime/request-scope';

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
 * - One client per request on Cloudflare Workers (see getDb), one per
 *   process elsewhere.
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

/**
 * On Cloudflare Workers a socket opened in one request cannot be used by
 * another, so the client is scoped to the current request there; on Node
 * (local dev, scripts, tests) one client is shared by the process.
 */
export function getDb(): Db {
  return scoped('scholarhub-db', createClient);
}

/**
 * Transaction wrapper that enforces Row-Level Security (RLS) by injecting
 * the authenticated user's ID into the Postgres session.
 */
export async function withUser<T>(
  userId: string,
  callback: (tx: Parameters<Parameters<Db['transaction']>[0]>[0]) => Promise<T>,
): Promise<T> {
  const db = getDb();
  return db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL app.user_id = ${userId}`);
    return callback(tx);
  });
}
