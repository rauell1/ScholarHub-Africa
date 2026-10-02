/**
 * Link checker for scholarships_data.csv.
 *
 * Requests every unique "Official Link" and reports the ones that are dead
 * (4xx/5xx, DNS or timeout errors) or that redirect to a different site -
 * a redirect to another host usually means the programme page moved or was
 * retired. Read-only: it never touches the database or the CSV.
 *
 * Usage (from web/):
 *   npm run links:check                     # uses ../scholarships_data.csv
 *   npx tsx scripts/check-links.ts path/to/file.csv
 */
import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

const CONCURRENCY = 8;
const TIMEOUT_MS = 15_000;
const USER_AGENT =
  'Mozilla/5.0 (compatible; ScholarHubLinkCheck/1.0; +https://scholar-hub-africa.vercel.app/)';

interface Result {
  url: string;
  ids: string[];
  status: number | null;
  finalUrl: string | null;
  error: string | null;
}

async function check(url: string): Promise<Omit<Result, 'ids'>> {
  const attempt = async (method: 'HEAD' | 'GET') =>
    fetch(url, {
      method,
      redirect: 'follow',
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html,application/pdf,*/*' },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  try {
    let res = await attempt('HEAD');
    // Many sites reject HEAD (405/403) but serve GET fine.
    if (res.status >= 400) res = await attempt('GET');
    return { url, status: res.status, finalUrl: res.url, error: null };
  } catch (err) {
    return { url, status: null, finalUrl: null, error: (err as Error).message };
  }
}

async function main() {
  const csvPath = path.resolve(process.argv[2] ?? path.join(import.meta.dirname, '../../scholarships_data.csv'));
  const { data } = Papa.parse<Record<string, string>>(fs.readFileSync(csvPath, 'utf-8'), {
    header: true,
    skipEmptyLines: true,
  });

  const byUrl = new Map<string, string[]>();
  const missing: string[] = [];
  for (const row of data) {
    const url = row['Official Link']?.trim();
    const id = row['ID']?.trim() || '?';
    if (!url) {
      missing.push(`${id} ${row['Scholarship']?.trim() ?? ''}`);
      continue;
    }
    byUrl.set(url, [...(byUrl.get(url) ?? []), id]);
  }

  const urls = [...byUrl.keys()];
  console.log(`Checking ${urls.length} unique links from ${data.length} rows...\n`);

  const results: Result[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < urls.length) {
        const url = urls[next++];
        const r = await check(url);
        results.push({ ...r, ids: byUrl.get(url)! });
        process.stdout.write(`  ${results.length}/${urls.length}\r`);
      }
    }),
  );

  const host = (u: string) => new URL(u).host.replace(/^www\./, '');
  const dead = results.filter((r) => r.status === null || r.status >= 400);
  const moved = results.filter(
    (r) => r.status !== null && r.status < 400 && r.finalUrl && host(r.finalUrl) !== host(r.url),
  );

  console.log(`\n\n✅ OK: ${results.length - dead.length - moved.length}`);
  if (missing.length) {
    console.log(`\n⚠️  Rows with no Official Link (${missing.length}):`);
    missing.forEach((m) => console.log(`   ${m}`));
  }
  if (moved.length) {
    console.log(`\n↪️  Redirects to a different site - check the page still describes the programme (${moved.length}):`);
    moved.forEach((r) => console.log(`   [IDs ${r.ids.join(', ')}] ${r.url}\n      → ${r.finalUrl}`));
  }
  if (dead.length) {
    console.log(`\n❌ Dead or unreachable (${dead.length}):`);
    dead.forEach((r) =>
      console.log(`   [IDs ${r.ids.join(', ')}] ${r.status ?? r.error} ${r.url}`),
    );
    console.log('\n   403 often means the site blocks scripts - open those in a browser before replacing them.');
  }
  process.exitCode = dead.length ? 1 : 0;
}

main();
