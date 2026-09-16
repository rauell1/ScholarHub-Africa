import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import { eq, inArray } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { inngest } from './client';
import { getDb } from '@/lib/db';
import { scholarships, countries } from '@/db/schema';
import { SCHOLARSHIP_DATA_TAG } from '@/lib/queries';

const DIRECTORIES = [
  'https://www.scholars4dev.com/category/scholarships-for-africans/',
  'https://www.opportunitiesforafricans.com/category/scholarships/',
];

// NOTE: these were added from general knowledge of each programme's
// canonical page, not verified live from this environment (outbound
// fetches to daad.de/fulbrightonline.org/gatescambridge.org/rhodeshouse.ox.ac.uk
// are blocked by this sandbox's network egress proxy). Confirm each URL
// still resolves and still describes the programme before relying on it -
// a dead or redirected link just yields zero scholarships from that
// entry, but a page that now covers something else could feed the LLM
// extractor wrong data.
const DIRECT_LINKS = [
  'https://apply.unicaf.org/refer-a-friend/en?refcode=SNDIW465zF',
  'https://mastercardfdn.org/all/scholars/becoming-a-scholar/apply-to-the-scholars-program/',
  'https://www.chevening.org/scholarship/',
  'https://www.daad.de/en/study-and-research-in-germany/scholarships/daad-scholarships/',
  'https://foreign.fulbrightonline.org/about/foreign-fulbright',
  'https://www.gatescambridge.org/apply/',
  'https://www.rhodeshouse.ox.ac.uk/scholarships/the-rhodes-scholarship/',
];

// Extraction model, kept separate from the CSV-upload pipeline's model
// (src/inngest/functions.ts) so each pipeline's model can be tuned
// independently. meta/llama-3.2-90b-vision-instruct also accepts
// text-only prompts, so it's a drop-in for the larger/vision-capable
// model without adding image handling.
const CRAWL_MODEL = process.env.NVIDIA_CRAWL_MODEL || 'meta/llama-3.3-70b-instruct';

// Search queries for discovery beyond the hardcoded directories/links above.
// Unlike DIRECTORIES (which needs a hand-written cheerio selector per site)
// this scales to any provider a query happens to surface, at the cost of
// noisier results — hence the is_scholarship guard in the extract step below.
const SEARCH_QUERIES = [
  'fully funded masters scholarship 2026 apply',
  'fully funded scholarship for international students 2026',
  'scholarship for african students masters 2026',
  'chevening scholarship 2026 apply',
  'daad scholarship application deadline 2026',
  'gates cambridge scholarship 2026',
  'rhodes scholarship 2026 apply',
  'mastercard foundation scholars program 2026',
  'fulbright foreign student program 2026 apply',
];

// Small, deliberately conservative gap between queries - the paid Search
// tier's capacity (50 req/s) makes this unnecessary for throughput, but
// keeps a nightly batch of ~9 queries from bursting all at once.
async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function searchBrave(query: string): Promise<string[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) return [];

  const res = await fetch(
    `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=10`,
    { headers: { Accept: 'application/json', 'X-Subscription-Token': apiKey } },
  );
  if (!res.ok) {
    console.error('Brave search failed:', query, res.status, await res.text().catch(() => ''));
    return [];
  }

  const data = (await res.json()) as { web?: { results?: Array<{ url?: string }> } };
  return (data.web?.results ?? [])
    .map((r) => r.url)
    .filter((u): u is string => Boolean(u));
}

/* ─────────────────────────────────────────────────────────────────────────
 * Step 1: Discovery — triggered by Vercel Cron. Scrapes directories,
 * deduplicates against the DB, then fans out one `crawl.process` event
 * per new URL. No AI calls, no DB writes — just coordination.
 * ───────────────────────────────────────────────────────────────────────── */
export const discoverScholarships = inngest.createFunction(
  {
    id: 'discover-scholarships',
    triggers: [{ event: 'crawl.discover' }],
    // Retry the discovery itself up to 2 times if cheerio fails
    retries: 2,
  },
  async ({ step }) => {
    const discovered = await step.run('scrape-directories', async () => {
      const links: string[] = [...DIRECT_LINKS];

      for (const url of DIRECTORIES) {
        try {
          const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
          const $ = cheerio.load(await res.text());

          if (url.includes('scholars4dev')) {
            $('div.post.clearfix').each((_, el) => {
              const href = $(el).find('h2 a').attr('href');
              if (href) links.push(href);
            });
          } else if (url.includes('opportunitiesforafricans')) {
            $('article h2 a').each((_, el) => {
              const href = $(el).attr('href');
              if (href) links.push(href);
            });
          }
        } catch (e) {
          console.error('Directory fetch failed:', url, e);
        }
      }

      return [...new Set(links)];
    });

    const searchDiscovered = await step.run('search-discover', async () => {
      if (!process.env.BRAVE_SEARCH_API_KEY) return [];

      const links: string[] = [];
      for (const query of SEARCH_QUERIES) {
        try {
          links.push(...(await searchBrave(query)));
        } catch (e) {
          console.error('Brave search failed:', query, e);
        }
        await sleep(1100);
      }
      return [...new Set(links)];
    });

    const allDiscovered = [...new Set([...discovered, ...searchDiscovered])];
    if (allDiscovered.length === 0) return { dispatched: 0 };

    const newLinks = await step.run('filter-existing', async () => {
      const db = getDb();
      const existing = await db.query.scholarships.findMany({
        where: inArray(scholarships.officialLink, allDiscovered),
        columns: { officialLink: true },
      });
      const existingSet = new Set(existing.map((e) => e.officialLink));
      return allDiscovered.filter((l) => !existingSet.has(l));
    });

    if (newLinks.length === 0) return { dispatched: 0 };

    // Fan out — one independent Inngest job per URL, each with its own retries
    await inngest.send(
      newLinks.map((url) => ({ name: 'crawl.process' as const, data: { url } })),
    );

    return { dispatched: newLinks.length };
  },
);

/* ─────────────────────────────────────────────────────────────────────────
 * Step 2: Process — one function per URL. Fetches the page, calls NVIDIA,
 * inserts the scholarship. Retried independently if it fails.
 * ───────────────────────────────────────────────────────────────────────── */
export const processScholarshipLink = inngest.createFunction(
  {
    id: 'process-scholarship-link',
    triggers: [{ event: 'crawl.process' }],
    retries: 3,
    // Throttle so we don't hammer NVIDIA or target sites
    throttle: { limit: 5, period: '1m' },
  },
  async ({ event, step }) => {
    const { url } = event.data as { url: string };

    const extracted = await step.run('extract', async () => {
      const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const $ = cheerio.load(await res.text());
      const text = ($('div.entry').text() || $('body').text()).substring(0, 15000);

      const client = new OpenAI({
        baseURL: 'https://integrate.api.nvidia.com/v1',
        apiKey: process.env.NVIDIA_API_KEY,
      });

      const completion = await client.chat.completions.create({
        model: CRAWL_MODEL,
        messages: [
          {
            role: 'system',
            content:
              'You are a creative copywriter and data extraction expert for an elite scholarship platform. Extract scholarship details from the provided text and output ONLY valid JSON. Write the "notes" field as an engaging, persuasive, and beautifully structured Markdown overview designed to excite and inform applicants.',
          },
          {
            role: 'user',
            content: `This page was found by a search crawler and may not actually be about a
specific scholarship (it could be a news article, forum post, expired
listing, or unrelated page). First decide whether it genuinely describes
one specific scholarship programme a student could apply to.

Extract scholarship details into JSON:
{
  "is_scholarship": true or false,
  "name": "Full name",
  "short_name": "Short name",
  "programme": "Degree level",
  "university": "University name",
  "country_name": "Country Name",
  "funding_type": "full or partial",
  "funding_detail": "Detail",
  "eligibility_label": "PE",
  "english_requirement": "IELTS etc",
  "age_max": null,
  "gpa_minimum": null,
  "score": 70,
  "notes": "Compelling Markdown overview"
}

If is_scholarship is false, the other fields can be empty/null.

Text: ${text}`,
          },
        ],
        response_format: { type: 'json_object' },
      });

      return JSON.parse(completion.choices[0].message.content ?? '{}') as Record<string, unknown>;
    });

    if (extracted.is_scholarship === false) return;

    await step.run('save', async () => {
      const db = getDb();

      const countryName = (extracted.country_name as string) || 'Various';

      // Race-safe upsert for country
      const [countryRec] = await db
        .insert(countries)
        .values({ name: countryName, isoCode: 'UN', region: 'Unknown' })
        .onConflictDoUpdate({ target: countries.name, set: { name: countryName } })
        .returning();

      const slug = ((extracted.name as string) || 'unknown')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      await db
        .insert(scholarships)
        .values({
          slug,
          name: (extracted.name as string) || 'Unknown Scholarship',
          shortName: (extracted.short_name as string) || '',
          programme: (extracted.programme as string) || '',
          university: (extracted.university as string) || '',
          officialLink: url,
          countryId: countryRec.id,
          fundingType: ['full', 'partial', 'tuition', 'unknown'].includes(
            extracted.funding_type as string,
          )
            ? (extracted.funding_type as 'full' | 'partial' | 'tuition' | 'unknown')
            : 'unknown',
          fundingDetail: (extracted.funding_detail as string) || '',
          eligibilityLabel: 'PE',
          englishRequirement: (extracted.english_requirement as string) || '',
          ageMax: (extracted.age_max as number) ?? null,
          gpaMinimum: extracted.gpa_minimum ? String(extracted.gpa_minimum) : null,
          mbaImpact: 'none',
          score: (extracted.score as number) || 70,
          notes: (extracted.notes as string) || '',
          status: 'open',
          isVerified: false,
          verifiedSource: 'NVIDIA AI Crawl',
        })
        .onConflictDoNothing();

      revalidateTag(SCHOLARSHIP_DATA_TAG);
    });
  },
);
