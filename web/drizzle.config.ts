import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle migrations config (docs/MIGRATION_PLAN.md §4 - Phase 2).
 * The full table schema lands in src/db/schema.ts during Phase 2; until then
 * `drizzle-kit generate` is a no-op (schema file exports nothing).
 * Use the POOLED Neon connection string for local migrations.
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: process.env.DATABASE_URL ?? 'postgres://localhost:5432/scholarhub',
  },
});
