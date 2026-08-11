#!/usr/bin/env node
/**
 * ScholarHub Africa — read-only parity verification (M2).
 *
 * Re-checks the migrated data against the Django source tables at any time
 * (post-migration, pre-cutover, post-cutover). Writes nothing.
 *
 * Usage:
 *   npm run db:verify
 */
import { connect, loadDbUrl, printReport, runVerification, tableExists } from './migrate-data.mjs';

const url = loadDbUrl();
if (!url) {
  console.error('DATABASE_URL not set. Add it to web/.env.local (Neon POOLED connection string) or export it.');
  process.exit(1);
}

const { pool, sslVerified, server } = await connect(url);
console.log(`Connected: ${server}`);
if (!sslVerified) console.warn('⚠ Connected WITHOUT TLS certificate verification.');

try {
  const client = await pool.connect();
  try {
    for (const t of ['scholarships', 'countries']) {
      if (!(await tableExists(client, t))) {
        console.error(`New table "${t}" not found - run \`npm run db:migrate\` first.`);
        process.exit(1);
      }
    }
    const result = await runVerification(client);
    printReport(result);
    process.exit(result.ok ? 0 : 1);
  } finally {
    client.release();
  }
} finally {
  await pool.end();
}
