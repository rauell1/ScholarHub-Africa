import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

/**
 * Drizzle migrations config (docs/MIGRATION_PLAN.md §4).
 * Use the POOLED Neon connection string.
 *
 * Loads .env.local the same way scripts/import-scholarships-csv.ts does.
 * drizzle-kit does not read it on its own, so `npm run db:migrate` used to see
 * no DATABASE_URL at all and fall through to a `postgres://localhost:5432`
 * default -- either failing with a confusing local connection error or, with a
 * Postgres running locally, migrating the wrong database entirely. Failing
 * loudly is the only safe behaviour for a command that alters schemas.
 */
loadEnv({ path: '.env.local' });

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error(
    'DATABASE_URL is not set. Put the pooled Neon connection string in ' +
    'web/.env.local, or export it in the shell before running drizzle-kit.',
  );
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url },
});
