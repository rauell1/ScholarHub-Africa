import { and, eq, ilike, inArray, or } from 'drizzle-orm';

import { countries, fieldsOfStudy, scholarshipFields, scholarships } from '@/db/schema';
import { getDb } from '@/lib/db';
import type { GeoUser } from '@/lib/geo';

/* ── Types ───────────────────────────────────────────────────────────────── */

export interface ScholarshipContext {
  id: number;
  name: string;
  country: string;
  flag: string;
  status: string;
  deadline: string | null;
  cycleYear: number | null;
  fundingType: string;
  fundingDetail: string;
  fields: string[];
  score: number;
  slug: string;
}

/* ── Intent extraction ───────────────────────────────────────────────────── */

const COUNTRY_ALIASES: Record<string, string> = {
  'uk': 'GB', 'britain': 'GB', 'england': 'GB', 'united kingdom': 'GB',
  'usa': 'US', 'america': 'US', 'united states': 'US',
  'germany': 'DE', 'german': 'DE',
  'netherlands': 'NL', 'holland': 'NL', 'dutch': 'NL',
  'france': 'FR', 'french': 'FR',
  'sweden': 'SE', 'swedish': 'SE',
  'norway': 'NO', 'norwegian': 'NO',
  'switzerland': 'CH', 'swiss': 'CH',
  'italy': 'IT', 'italian': 'IT',
  'japan': 'JP', 'japanese': 'JP',
  'china': 'CN', 'chinese': 'CN',
  'australia': 'AU', 'australian': 'AU',
  'canada': 'CA', 'canadian': 'CA',
  'belgium': 'BE', 'belgian': 'BE',
  'finland': 'FI', 'finnish': 'FI',
  'ireland': 'IE', 'irish': 'IE',
  'spain': 'ES', 'spanish': 'ES',
  'turkey': 'TR', 'turkish': 'TR',
  'south korea': 'KR', 'korea': 'KR', 'korean': 'KR',
};

const FIELD_KEYWORDS: Record<string, string> = {
  'water': 'water',
  'energy': 'energy',
  'renewable': 'renewable-energy',
  'solar': 'renewable-energy',
  'engineering': 'engineering',
  'environment': 'environment',
  'environmental': 'environment',
  'climate': 'climate',
  'sustainability': 'sustainability',
  'sustainable': 'sustainability',
  'agriculture': 'agriculture',
  'agricultural': 'agricultural-engineering',
  'public health': 'public-health',
  'health': 'public-health',
  'data science': 'data-science',
  'data': 'data-science',
  'ai': 'ai-for-energy',
  'machine learning': 'data-science',
  'law': 'law',
  'power': 'power-systems',
  'grid': 'smart-grids',
  'ev': 'ev',
  'electric vehicle': 'ev-technology',
  'battery': 'battery',
};

function extractIntent(query: string): { countryIso?: string; fieldSlug?: string; keywords: string } {
  const q = query.toLowerCase();
  let countryIso: string | undefined;
  let fieldSlug: string | undefined;

  for (const [alias, iso] of Object.entries(COUNTRY_ALIASES)) {
    if (q.includes(alias)) { countryIso = iso; break; }
  }

  for (const [kw, slug] of Object.entries(FIELD_KEYWORDS)) {
    if (q.includes(kw)) { fieldSlug = slug; break; }
  }

  return { countryIso, fieldSlug, keywords: query.slice(0, 120) };
}

/* ── Scholarship retrieval ───────────────────────────────────────────────── */

export async function fetchRelevantScholarships(query: string): Promise<ScholarshipContext[]> {
  try {
    const db = getDb();
    const intent = extractIntent(query);

    // Build filter conditions
    const conditions = [eq(scholarships.isActive, true)];

    if (intent.countryIso) {
      const countryRow = await db
        .select({ id: countries.id })
        .from(countries)
        .where(eq(countries.isoCode, intent.countryIso))
        .limit(1);
      if (countryRow[0]) {
        conditions.push(eq(scholarships.countryId, countryRow[0].id));
      }
    }

    // Text search on name/university
    const textConditions = intent.keywords
      ? or(
          ilike(scholarships.name, `%${intent.keywords.split(' ')[0]}%`),
          ilike(scholarships.university, `%${intent.keywords.split(' ')[0]}%`),
        )
      : undefined;

    const baseQuery = db
      .select({
        id: scholarships.id,
        name: scholarships.name,
        countryName: countries.name,
        countryFlag: countries.flagEmoji,
        status: scholarships.status,
        deadline: scholarships.deadlineDate,
        cycleYear: scholarships.cycleYear,
        fundingType: scholarships.fundingType,
        fundingDetail: scholarships.fundingDetail,
        score: scholarships.score,
        slug: scholarships.slug,
      })
      .from(scholarships)
      .innerJoin(countries, eq(scholarships.countryId, countries.id))
      .where(textConditions ? and(...conditions, textConditions) : and(...conditions))
      .orderBy(scholarships.score)
      .limit(8);

    let rows = await baseQuery;

    // If field filter needed, filter in JS (field is many-to-many via scholarshipFields)
    if (intent.fieldSlug && rows.length > 0) {
      const fieldRow = await db
        .select({ id: fieldsOfStudy.id })
        .from(fieldsOfStudy)
        .where(ilike(fieldsOfStudy.slug, `%${intent.fieldSlug}%`))
        .limit(1);

      if (fieldRow[0]) {
        const links = await db
          .select({ scholarshipId: scholarshipFields.scholarshipId })
          .from(scholarshipFields)
          .where(
            and(
              eq(scholarshipFields.fieldId, fieldRow[0].id),
              inArray(scholarshipFields.scholarshipId, rows.map((r) => r.id)),
            ),
          );
        const matchIds = new Set(links.map((l) => l.scholarshipId));
        const filtered = rows.filter((r) => matchIds.has(r.id));
        if (filtered.length > 0) rows = filtered;
      }
    }

    // Fallback: if nothing found, fetch top-scored scholarships
    if (rows.length === 0) {
      rows = await db
        .select({
          id: scholarships.id,
          name: scholarships.name,
          countryName: countries.name,
          countryFlag: countries.flagEmoji,
          status: scholarships.status,
          deadline: scholarships.deadlineDate,
          cycleYear: scholarships.cycleYear,
          fundingType: scholarships.fundingType,
          fundingDetail: scholarships.fundingDetail,
          score: scholarships.score,
          slug: scholarships.slug,
        })
        .from(scholarships)
        .innerJoin(countries, eq(scholarships.countryId, countries.id))
        .where(eq(scholarships.isActive, true))
        .orderBy(scholarships.score)
        .limit(5);
    }

    // Fetch field names for each scholarship
    const ids = rows.map((r) => r.id);
    const fieldLinks = ids.length
      ? await db
          .select({ scholarshipId: scholarshipFields.scholarshipId, name: fieldsOfStudy.name })
          .from(scholarshipFields)
          .innerJoin(fieldsOfStudy, eq(scholarshipFields.fieldId, fieldsOfStudy.id))
          .where(inArray(scholarshipFields.scholarshipId, ids))
      : [];

    const fieldMap = new Map<number, string[]>();
    for (const { scholarshipId, name } of fieldLinks) {
      const arr = fieldMap.get(scholarshipId) ?? [];
      arr.push(name);
      fieldMap.set(scholarshipId, arr);
    }

    return rows.slice(0, 5).map((r) => ({
      id: r.id,
      name: r.name,
      country: r.countryName,
      flag: r.countryFlag,
      status: r.status,
      deadline: r.deadline,
      cycleYear: r.cycleYear,
      fundingType: r.fundingType,
      fundingDetail: r.fundingDetail,
      fields: fieldMap.get(r.id) ?? [],
      score: r.score,
      slug: r.slug,
    }));
  } catch {
    return [];
  }
}

/* ── Prompt builder ──────────────────────────────────────────────────────── */

export function buildSystemPrompt(
  scholarshipList: ScholarshipContext[],
  userGeo?: GeoUser,
): string {
  const contextBlock =
    scholarshipList.length === 0
      ? 'No specific scholarships found for this query. Encourage the user to browse by country or field.'
      : scholarshipList
          .map((s, i) => {
            const status = s.status === 'closed'
              ? `CLOSED${s.cycleYear ? ` (reopens ${s.cycleYear})` : ''}`
              : s.status.toUpperCase();
            const deadline = s.deadline ?? 'Rolling / TBC';
            const fields = s.fields.length ? s.fields.join(', ') : 'General';
            const funding = s.fundingDetail
              ? `${s.fundingType} — ${s.fundingDetail.slice(0, 80)}`
              : s.fundingType;
            return [
              `${i + 1}. **${s.name}**`,
              `   Country: ${s.flag} ${s.country} | Status: ${status} | Deadline: ${deadline}`,
              `   Funding: ${funding}`,
              `   Fields: ${fields} | Fit score: ${s.score}/100`,
              `   URL: /scholarships/${s.slug}/`,
            ].join('\n');
          })
          .join('\n\n');

  const userContext = userGeo?.isAfrican
    ? `\nUSER CONTEXT: The user is browsing from ${userGeo.flag} ${userGeo.name} (${userGeo.iso}). They are likely a ${userGeo.name} national seeking fully-funded master's scholarships abroad. Tailor advice and eligibility notes to ${userGeo.name} applicants where relevant.\n`
    : userGeo
      ? `\nUSER CONTEXT: The user is browsing from ${userGeo.name} (${userGeo.iso}).\n`
      : '';

  return `You are ScholarHub Africa's scholarship advisor — a knowledgeable, friendly guide helping African students find fully-funded international master's scholarships.
${userContext}
ONLY reference scholarships from the verified data below. Do not invent scholarships, deadlines, or details.

RELEVANT SCHOLARSHIPS:
${contextBlock}

RESPONSE RULES:
- Be concise (under 220 words)
- Bold scholarship names with **name**
- Always mention status (open/closed) and deadline
- Suggest clicking "Track this Scholarship" on the detail page to bookmark it
- If the query is vague, ask 1–2 clarifying questions (nationality, field, preferred country)
- If no scholarships match well, say so honestly and suggest browsing /scholarships/country/ or /scholarships/field/
- Never fabricate data`;
}
