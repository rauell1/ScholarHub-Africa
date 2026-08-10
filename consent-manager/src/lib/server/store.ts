/**
 * Server-side persistence for the admin environment.
 *
 * Files (all under ./data, gitignored):
 *   consent-logs.jsonl — append-only compliance audit log
 *   config.json        — admin-customised banner config overrides
 *   policies.json      — generated & published legal policies
 *
 * For production, swap these helpers for a real database (Postgres/Redis)
 * — the API routes only depend on these function signatures.
 */
import { createHmac } from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

import { DEFAULT_CONFIG } from '@/lib/consent/config';
import type { ConsentConfig, ConsentLogEntry } from '@/lib/consent/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const LOGS_FILE = path.join(DATA_DIR, 'consent-logs.jsonl');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const POLICIES_FILE = path.join(DATA_DIR, 'policies.json');

async function ensureDir(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

/* ── Consent logs (append-only JSONL) ───────────────────────────────────── */

export async function appendConsentLog(entry: ConsentLogEntry): Promise<void> {
  await ensureDir();
  await fs.appendFile(LOGS_FILE, JSON.stringify(entry) + '\n', 'utf8');
}

export async function readConsentLogs(): Promise<ConsentLogEntry[]> {
  try {
    const raw = await fs.readFile(LOGS_FILE, 'utf8');
    return raw
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line) as ConsentLogEntry);
  } catch {
    return [];
  }
}

/* ── Banner config (admin overrides merged over defaults) ───────────────── */

export async function getConfig(): Promise<ConsentConfig> {
  try {
    const raw = await fs.readFile(CONFIG_FILE, 'utf8');
    const overrides = JSON.parse(raw) as Partial<ConsentConfig>;
    return mergeConfig(overrides);
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function saveConfig(next: ConsentConfig): Promise<ConsentConfig> {
  await ensureDir();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(next, null, 2), 'utf8');
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

export async function savePolicies(
  policies: Record<string, string>,
): Promise<void> {
  await ensureDir();
  await fs.writeFile(POLICIES_FILE, JSON.stringify(policies, null, 2), 'utf8');
}

export async function getPolicies(): Promise<Record<string, string>> {
  try {
    const raw = await fs.readFile(POLICIES_FILE, 'utf8');
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return {};
  }
}

/* ── IP anonymisation (pseudonymisation, GDPR Art. 4(5)) ────────────────── */

const IP_HASH_SALT =
  process.env.CONSENT_IP_HASH_SALT ?? 'dev-salt-change-me';

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
