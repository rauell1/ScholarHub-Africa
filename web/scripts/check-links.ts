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
const TIMEOUT_MS = 25_000;
// A real-browser UA: many government and university sites 403 anything that
// looks like a bot, which buried the genuinely dead links in noise.
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

/** Errors that mean the host or page really is gone, not just unreachable from here. */
const DEAD_ERROR_CODES = new Set(['ENOTFOUND', 'EAI_NONAME', 'ERR_INVALID_URL']);
const DEAD_STATUSES = new Set([404, 410]);

interface Result {
  url: string;
  ids: string[];
  status: number | null;
  finalUrl: string | null;
  error: string | null;
  /** Low-level cause (e.g. ENOTFOUND, ECONNRESET, CERT_HAS_EXPIRED). */
  code: string | null;
}

async function check(url: string): Promise<Omit<Result, 'ids'>> {
  const attempt = async (method: 'HEAD' | 'GET') =>
    fetch(url, {
      method,
      redirect: 'follow',
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-GB,en;q=0.9',
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  const once = async (): Promise<Omit<Result, 'ids'>> => {
    try {
      let res = await attempt('HEAD');
      // Many sites reject HEAD (405/403) but serve GET fine.
      if (res.status >= 400) res = await attempt('GET');
      return { url, status: res.status, finalUrl: res.url, error: null, code: null };
    } catch (err) {
      const e = err as Error & { cause?: { code?: string } };
      return { url, status: null, finalUrl: null, error: e.message, code: e.cause?.code ?? e.name ?? null };
    }
  };
  const first = await once();
  // One retry for transient failures (timeouts, resets, 5xx).
  const transient = first.status === null ? !DEAD_ERROR_CODES.has(first.code ?? '') : first.status >= 500;
  return transient ? once() : first;
}

function isDead(r: Result): boolean {
  if (r.status !== null) return DEAD_STATUSES.has(r.status);
  return DEAD_ERROR_CODES.has(r.code ?? '');
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
  const dead = results.filter(isDead);
  const unverified = results.filter((r) => !isDead(r) && (r.status === null || r.status >= 400));
  const moved = results.filter(
    (r) => r.status !== null && r.status < 400 && r.finalUrl && host(r.finalUrl) !== host(r.url),
  );

  console.log(`\n\n✅ OK: ${results.length - dead.length - unverified.length - moved.length}`);
  if (missing.length) {
    console.log(`\n⚠️  Rows with no Official Link (${missing.length}):`);
    missing.forEach((m) => console.log(`   ${m}`));
  }
  if (moved.length) {
    console.log(`\n↪️  Redirects to a different site - check the page still describes the programme (${moved.length}):`);
    moved.forEach((r) => console.log(`   [IDs ${r.ids.join(', ')}] ${r.url}\n      → ${r.finalUrl}`));
  }
  if (unverified.length) {
    console.log(
      `\n🔒 Could not verify - site blocks scripts, rate-limits or is slow; open in a browser (${unverified.length}):`,
    );
    unverified.forEach((r) =>
      console.log(`   [IDs ${r.ids.join(', ')}] ${r.status ?? r.code ?? r.error} ${r.url}`),
    );
  }
  if (dead.length) {
    console.log(`\n❌ Dead - page gone (404/410) or domain does not exist (${dead.length}):`);
    dead.forEach((r) =>
      console.log(`   [IDs ${r.ids.join(', ')}] ${r.status ?? r.code} ${r.url}`),
    );
  }
  process.exitCode = dead.length ? 1 : 0;
}

main();
