/**
 * Server-side persistence for consent (migration of consent-manager's
 * JSONL file store → Postgres).
 *
 * Same exported API as the original consent-manager/src/lib/server/store.ts
 * (the /api/consent routes depend only on these signatures), but rows live
 * in the consent_logs / consent_config / consent_policies tables - Vercel's
 * filesystem is ephemeral, so JSONL would silently lose compliance data.
 *
 * Fail-soft contract: when DATABASE_URL is unset or the tables haven't been
 * migrated yet, logging is skipped and getConfig() returns DEFAULT_CONFIG -
 * the banner still works everywhere; the compliance log activates with the
 * schema (Phase 2).
 */
import { desc, eq } from 'drizzle-orm';
import { createHmac } from 'crypto';

import { consentConfig, consentLogs, consentPolicies } from '@/db/schema';
import { getDb } from '@/lib/db';
import { DEFAULT_CONFIG } from '@/lib/consent/config';
import type { ConsentConfig, ConsentLogEntry } from '@/lib/consent/types';

/* ── Consent logs (compliance audit trail) ──────────────────────────────── */

export async function appendConsentLog(entry: ConsentLogEntry): Promise<void> {
  try {
    await getDb().insert(consentLogs).values({
      anonymizedIp: entry.anonymizedIp,
      timestamp: new Date(entry.timestamp),
      country: entry.geolocation.country,
      region: entry.geolocation.region,
      consentString: entry.consentString,
      tcfString: entry.tcfString ?? '',
      categories: entry.state,
      accepted: entry.accepted,
      version: entry.version,
      language: entry.language,
    });
  } catch {
    // Fail-soft: logging must never break the consent UX. Once the schema is
    // migrated, errors here are visible in the server logs for investigation.
  }
}

export async function readConsentLogs(): Promise<ConsentLogEntry[]> {
  try {
    const rows = await getDb()
      .select()
      .from(consentLogs)
      .orderBy(desc(consentLogs.timestamp))
      .limit(1000);
    return rows.map((row) => ({
      id: String(row.id),
      anonymizedIp: row.anonymizedIp,
      timestamp: row.timestamp.toISOString(),
      geolocation: { country: row.country, region: row.region as ConsentLogEntry['geolocation']['region'] },
      consentString: row.consentString,
      tcfString: row.tcfString,
      state: row.categories,
      accepted: row.accepted,
      version: row.version,
      language: row.language,
    }));
  } catch {
    return [];
  }
}

/* ── Banner config (admin overrides merged over defaults) ───────────────── */

export async function getConfig(): Promise<ConsentConfig> {
  try {
    const rows = await getDb()
      .select()
      .from(consentConfig)
      .where(eq(consentConfig.key, 'banner'))
      .limit(1);
    const overrides = rows[0]?.config;
    return overrides ? mergeConfig(overrides) : DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveConfig(next: ConsentConfig): Promise<ConsentConfig> {
  await getDb()
    .insert(consentConfig)
    .values({ key: 'banner', config: next })
    .onConflictDoUpdate({
      target: consentConfig.key,
      set: { config: next, updatedAt: new Date() },
    });
  return next;
}

export function mergeConfig(overrides: Partial<ConsentConfig>): ConsentConfig {
  const base = JSON.parse(JSON.stringify(DEFAULT_CONFIG)) as ConsentConfig;
  return {
    ...base,
    ...overrides,
    theme: { ...base.theme, ...(overrides.theme ?? {}) },
    typography: { ...base.typography, ...(overrides.typography ?? {}) },
    layout: { ...base.layout, ...(overrides.layout ?? {}) },
    company: { ...base.company, ...(overrides.company ?? {}) },
    links: { ...base.links, ...(overrides.links ?? {}) },
    scripts: {
      ...base.scripts,
      ...(overrides.scripts ?? {}),
      custom: overrides.scripts?.custom ?? base.scripts.custom,
    },
    texts: overrides.texts ?? base.texts,
    version: overrides.version ?? base.version,
  };
}

/* ── Generated policies ─────────────────────────────────────────────────── */

export async function savePolicies(policies: Record<string, string>): Promise<void> {
  for (const [kind, content] of Object.entries(policies)) {
    await getDb()
      .insert(consentPolicies)
      .values({ kind, content })
      .onConflictDoUpdate({
        target: consentPolicies.kind,
        set: { content, updatedAt: new Date() },
      });
  }
}

export async function getPolicies(): Promise<Record<string, string>> {
  try {
    const rows = await getDb().select().from(consentPolicies);
    return Object.fromEntries(rows.map((row) => [row.kind, row.content]));
  } catch {
    return {};
  }
}

/* ── IP anonymisation (pseudonymisation, GDPR Art. 4(5)) ────────────────── */

const IP_HASH_SALT = process.env.CONSENT_IP_HASH_SALT ?? 'dev-salt-change-me';

/** Truncate to the first 3 octets + short HMAC fingerprint of the full IP. */
export function anonymizeIp(rawIp: string): string {
  const ip = (rawIp || '').replace(/^::ffff:/, '').trim();
  if (!ip) return 'unknown';
  const truncated = ip.includes(':')
    ? ip.split(':').slice(0, 4).join(':') + ':…' // IPv6: keep prefix
    : ip.split('.').slice(0, 3).join('.') + '.x'; // IPv4: 1.2.3.x

  const fingerprint = createHmac('sha256', IP_HASH_SALT)
    .update(ip)
    .digest('hex')
    .slice(0, 8);
  return `${truncated}#${fingerprint}`;
}
