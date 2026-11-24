import { sql } from 'drizzle-orm';
import { neon, Pool } from '@neondatabase/serverless';
import { drizzle as drizzleHttp } from 'drizzle-orm/neon-http';
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http';
import { drizzle as drizzlePool } from 'drizzle-orm/neon-serverless';
import type { NeonDatabase } from 'drizzle-orm/neon-serverless';

import * as schema from '../db/schema';
import { env } from './env';
import { scoped } from './runtime/request-scope';

export type Db = NeonHttpDatabase<typeof schema>;
export type PoolDb = NeonDatabase<typeof schema>;

/**
 * Serverless-safe DB client (docs/MIGRATION_PLAN.md §2, §3).
 *
 * - Default `getDb()` uses `@neondatabase/serverless` HTTP (`neon()`) with
 *   `drizzle-orm/neon-http`. On Cloudflare Workers, HTTP queries use native
 *   `fetch()` instead of opening a WebSocket + Postgres wire-protocol
 *   handshake on every cold request, cutting Worker CPU time dramatically.
 * - `withUser()` uses a request-scoped WebSocket `Pool` (`max: 1`) because
 *   Row-Level Security (`SET LOCAL app.user_id`) requires a stateful
 *   multi-statement transaction.
 * - LAZY: `getDb()` throws only when first USED without DATABASE_URL, so pages
 *   that don't touch the DB (homepage, consent banner) still build and run
 *   in previews; callers that must survive DB absence wrap in try/catch.
 */
function requireDatabaseUrl(): string {
  if (!env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL is not set - add it to web/.env.local using the Neon POOLED connection string.',
    );
  }
  return env.DATABASE_URL;
}

function createHttpClient(): Db {
  const client = neon(requireDatabaseUrl());
  return drizzleHttp(client, { schema });
}

function createPoolClient(): PoolDb {
  const pool = new Pool({ connectionString: requireDatabaseUrl(), max: 1 });
  return drizzlePool(pool, { schema });
}

/**
 * Fast stateless HTTP client for all standard queries.
 */
export function getDb(): Db {
  return scoped('scholarhub-db-http', createHttpClient);
}

/**
 * Transaction wrapper that enforces Row-Level Security (RLS) by injecting
 * the authenticated user's ID into the Postgres session over a WebSocket Pool
 * transaction.
 */
export async function withUser<T>(
  userId: string,
  callback: (tx: Parameters<Parameters<PoolDb['transaction']>[0]>[0]) => Promise<T>,
): Promise<T> {
  const db = scoped('scholarhub-db-pool', createPoolClient);
  return db.transaction(async (tx) => {
    await tx.execute(sql`SET LOCAL app.user_id = ${userId}`);
    return callback(tx);
  });
}
