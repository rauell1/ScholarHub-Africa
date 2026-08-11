import { z } from 'zod';

/**
 * Validated environment (Zod).
 *
 * Build-safe by design: only SITE_* carry defaults so `next build` works in
 * previews without secrets. DATABASE_URL is optional here - lib/db.ts throws
 * a clear error at runtime if a data-backed page runs without it.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  SITE_URL: z.string().url().default('http://localhost:3000'),
  SITE_DOMAIN: z.string().min(1).default('scholarhub.africa'),
  SITE_EMAIL: z.string().email().default('hello@scholarhub.africa'),
  SITE_PHONE: z.string().default('+254 700 123 456'),
  SITE_ADDRESS: z.string().default('Westlands, Nairobi, Kenya'),
  GA4_MEASUREMENT_ID: z.string().optional(),
});

export const env = envSchema.parse(process.env);

export type Env = typeof env;
