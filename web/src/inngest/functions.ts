import { inngest } from './client';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { getDb } from '@/lib/db';
import { scholarships, countries } from '@/db/schema';
import { eq } from 'drizzle-orm';

const ScholarshipDataSchema = z.object({
  name: z.string(),
  short_name: z.string().default(''),
  programme: z.string().default(''),
  university: z.string().default(''),
  country: z.string().describe('The name of the country (e.g. United Kingdom, Germany, etc)'),
  funding_type: z.enum(['full', 'partial', 'tuition', 'unknown']),
  funding_detail: z.string().default(''),
  application_fee: z.number().default(0),
  currency: z.string().default('USD'),
  eligibility_label: z.enum(['PE', 'AA', 'GM']),
  english_requirement: z.string().default(''),
  age_max: z.number().nullable().default(null),
  gpa_minimum: z.number().nullable().default(null),
  nationality_notes: z.string().default(''),
  mba_impact: z.enum(['none', 'required', 'preferred', 'not_applicable']),
  notes: z.string().default(''),
  action_required: z.string().default(''),
  official_link: z.string().default(''),
});

const DataListSchema = z.object({
  scholarships: z.array(ScholarshipDataSchema),
});

export const processCsvUpload = inngest.createFunction(
  { id: 'process-csv-upload' },
  { event: 'csv.uploaded' },
  async ({ event, step }) => {
    const rawRows = event.data.rows;
    if (!rawRows || rawRows.length === 0) return { processed: 0 };

    const BATCH_SIZE = 10;
    let totalProcessed = 0;

    for (let i = 0; i < rawRows.length; i += BATCH_SIZE) {
      const chunk = rawRows.slice(i, i + BATCH_SIZE);
      
      // Execute each batch as an individual step in Inngest to avoid Vercel timeouts
      const batchResult = await step.run(`process-batch-${i}`, async () => {
        const client = new OpenAI({
          baseURL: 'https://integrate.api.nvidia.com/v1',
          apiKey: process.env.NVIDIA_API_KEY,
        });

        try {
          const completion = await client.beta.chat.completions.parse({
            model: 'meta/llama-3.3-70b-instruct',
            messages: [
              {
                role: 'system',
                content: "You are an expert AI scholarship data extractor. Convert the following unstructured CSV rows into strict structured JSON. Format the data to fit the exact JSON schema. Extract implicit meaning where possible (e.g., if it says 'Tuition and living stipend', funding_type is 'full').",
              },
              {
                role: 'user',
                content: `Extract the following chunk of CSV data:\n\n${JSON.stringify(chunk)}`
              }
            ],
            response_format: zodResponseFormat(DataListSchema, "scholarship_list"),
          });

          return completion.choices[0].message.parsed;
        } catch (error) {
          console.error("AI Error:", error);
          throw error; // Will trigger Inngest retry
        }
      });

      if (!batchResult) continue;

      // Save to database step
      await step.run(`save-batch-${i}`, async () => {
        const db = getDb();
        
        for (const item of batchResult.scholarships) {
          let countryRec = await db.query.countries.findFirst({
            where: eq(countries.name, item.country)
          });
          if (!countryRec) {
             countryRec = await db.query.countries.findFirst();
          }
          const countryId = countryRec ? countryRec.id : 1; 
          
          const slug = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

          await db.insert(scholarships)
            .values({
              slug,
              name: item.name,
              shortName: item.short_name,
              programme: item.programme,
              university: item.university,
              countryId,
              fundingType: item.funding_type,
              fundingDetail: item.funding_detail,
              applicationFee: item.application_fee.toString(),
              currency: item.currency,
              eligibilityLabel: item.eligibility_label,
              englishRequirement: item.english_requirement,
              ageMax: item.age_max,
              gpaMinimum: item.gpa_minimum ? item.gpa_minimum.toString() : null,
              nationalityNotes: item.nationality_notes,
              mbaImpact: item.mba_impact,
              notes: item.notes,
              actionRequired: item.action_required,
              officialLink: item.official_link,
              isVerified: true,
              status: 'open',
            })
            .onConflictDoUpdate({
              target: scholarships.slug,
              set: {
                fundingType: item.funding_type,
                fundingDetail: item.funding_detail,
                eligibilityLabel: item.eligibility_label,
                englishRequirement: item.english_requirement,
                ageMax: item.age_max,
                gpaMinimum: item.gpa_minimum ? item.gpa_minimum.toString() : null,
                mbaImpact: item.mba_impact,
              }
            });
          totalProcessed++;
        }
      });
    }

    return { message: 'Upload processing complete', totalProcessed };
  }
);
