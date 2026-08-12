import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { scholarships, countries, fieldsOfStudy, scholarshipFields } from '@/db/schema';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max on Vercel

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export async function GET(request: NextRequest) {
  if (!authorized(request)) {
    return NextResponse.json({ detail: 'Unauthorized.' }, { status: 401 });
  }

  const db = getDb();
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'NVIDIA_API_KEY not configured' }, { status: 500 });
  }

  const client = new OpenAI({
    baseURL: 'https://integrate.api.nvidia.com/v1',
    apiKey: apiKey,
  });

  try {
    // 1. Fetch links from directory
    const url = 'https://www.scholars4dev.com/category/scholarships-for-africans/';
    const listResponse = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const listHtml = await listResponse.text();
    const $list = cheerio.load(listHtml);
    
    const links: string[] = [];
    $list('div.post.clearfix').each((_, el) => {
      const href = $list(el).find('h2 a').attr('href');
      if (href) links.push(href);
    });

    if (links.length === 0) {
      return NextResponse.json({ ok: true, message: 'No links found.' });
    }

    // 2. Fetch existing URLs to avoid reprocessing
    const existing = await db.query.scholarships.findMany({
      where: inArray(scholarships.officialLink, links),
      columns: { officialLink: true }
    });
    const existingLinks = new Set(existing.map(e => e.officialLink));
    const newLinks = links.filter(l => !existingLinks.has(l));

    if (newLinks.length === 0) {
      return NextResponse.json({ ok: true, message: 'No new scholarships to process.' });
    }

    // We process only 1 or 2 per cron run to respect Vercel timeouts and API rate limits
    const BATCH_LIMIT = 2;
    const linksToProcess = newLinks.slice(0, BATCH_LIMIT);
    let processedCount = 0;

    for (const link of linksToProcess) {
      console.log('Processing:', link);
      const articleResponse = await fetch(link, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const articleHtml = await articleResponse.text();
      const $article = cheerio.load(articleHtml);
      
      const contentDiv = $article('div.entry').text();
      const textContent = (contentDiv || $article('body').text()).substring(0, 15000);

      const completion = await client.chat.completions.create({
        model: "meta/llama-3.3-70b-instruct",
        messages: [
          {
            role: "system",
            content: "You are a data extraction assistant. Extract scholarship details from the provided text and output ONLY valid JSON."
          },
          {
            role: "user",
            content: `Extract the scholarship details from the following text into JSON matching this schema:
{
  "name": "Full name",
  "short_name": "Short name",
  "programme": "Degree level",
  "university": "University name",
  "country_name": "Country Name",
  "fields_of_study": ["Field 1"],
  "funding_type": "full or partial",
  "funding_detail": "Detail",
  "eligibility_label": "PE",
  "english_requirement": "IELTS etc",
  "age_max": null,
  "gpa_minimum": null,
  "mba_impact": "unknown",
  "score": 70
}

Text: ${textContent}`
          }
        ],
        response_format: { type: "json_object" }
      });

      const parsedStr = completion.choices[0].message.content;
      if (!parsedStr) continue;
      
      const data = JSON.parse(parsedStr);

      // Resolve country
      let countryRec = await db.query.countries.findFirst({
        where: eq(countries.name, data.country_name || 'Various')
      });
      if (!countryRec) {
        // Fallback to ID 1 or create
        countryRec = await db.query.countries.findFirst();
      }
      const countryId = countryRec ? countryRec.id : 1;
      const slug = (data.name || 'Unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

      // Insert scholarship
      const inserted = await db.insert(scholarships)
        .values({
          slug,
          name: data.name || 'Unknown Scholarship',
          shortName: data.short_name || '',
          programme: data.programme || '',
          university: data.university || '',
          officialLink: link,
          countryId,
          fundingType: ['full', 'partial', 'tuition_only', 'living_only'].includes(data.funding_type) ? data.funding_type : 'full',
          fundingDetail: data.funding_detail || '',
          eligibilityLabel: 'PE',
          englishRequirement: data.english_requirement || '',
          ageMax: data.age_max || null,
          gpaMinimum: data.gpa_minimum ? data.gpa_minimum.toString() : null,
          mbaImpact: 'unknown',
          score: data.score || 70,
          status: 'open',
          isVerified: false,
          verifiedSource: 'NVIDIA AI Crawl'
        })
        .onConflictDoNothing() // in case slug collides
        .returning({ id: scholarships.id });

      processedCount++;
    }

    return NextResponse.json({
      ok: true,
      processed: processedCount,
      message: `Successfully processed ${processedCount} new scholarships.`
    });

  } catch (error) {
    console.error('Crawler Error:', error);
    return NextResponse.json({ ok: false, error: 'Crawler failed' }, { status: 500 });
  }
}
