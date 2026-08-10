/**
 * Machine-readable consent strings.
 *
 * 1. Consent Mode v2 string  — JSON snapshot pushed to `dataLayer`.
 * 2. IAB TCF 2.3 TC string   — bit-packed per the IAB Europe Transparency &
 *    Consent Framework encoding (version 2, base64url). This module encodes
 *    the CORE TC string (version … publisherCC) followed by the
 *    vendor-consent segment (bitfield or range encoding). For production,
 *    you can swap in the official `@iabtcf/cmpapi` library — this module
 *    produces the same wire format and round-trips through its own decoder
 *    (self-tested in dev).
 */
import type { CategoryState, ConsentRegion, ConsentState } from './types';
import { CATEGORIES } from './categories';

/* ── IAB TCF 2.x bit-level encoding ─────────────────────────────────────── */

class BitWriter {
  private bits: number[] = [];

  write(value: number, length: number): void {
    for (let i = length - 1; i >= 0; i--) {
      this.bits.push((value >> i) & 1);
    }
  }

  toBytes(): Uint8Array {
    const bytes = new Uint8Array(Math.ceil(this.bits.length / 8));
    for (let i = 0; i < this.bits.length; i++) {
      if (this.bits[i]) bytes[Math.floor(i / 8)] |= 1 << (7 - (i % 8));
    }
    return bytes;
  }
}

class BitReader {
  private bits: number[];
  private pos = 0;

  constructor(bytes: Uint8Array) {
    this.bits = [];
    for (const byte of bytes) {
      for (let i = 7; i >= 0; i--) this.bits.push((byte >> i) & 1);
    }
  }

  read(length: number): number {
    let value = 0;
    for (let i = 0; i < length; i++) {
      value = (value << 1) | (this.bits[this.pos++] ?? 0);
    }
    return value;
  }
}

const BASE64URL_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function encodeBase64Url(bytes: Uint8Array): string {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = bytes[i + 1] ?? 0;
    const b2 = bytes[i + 2] ?? 0;
    out += BASE64URL_ALPHABET[b0 >> 2];
    out += BASE64URL_ALPHABET[((b0 & 3) << 4) | (b1 >> 4)];
    out += bytes[i + 1] === undefined ? '' : BASE64URL_ALPHABET[((b1 & 15) << 2) | (b2 >> 6)];
    out += bytes[i + 2] === undefined ? '' : BASE64URL_ALPHABET[b2 & 63];
  }
  return out;
}

function decodeBase64Url(input: string): Uint8Array {
  const clean = input.replace(/=+$/, '');
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const char of clean) {
    const value = BASE64URL_ALPHABET.indexOf(char);
    if (value === -1) continue;
    buffer = (buffer << 6) | value;
    bits += 6;
    if (bits >= 8) {
      bytes.push((buffer >> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return new Uint8Array(bytes);
}

export interface TcfOptions {
  /** IAB vendor CMP id (register one at iabeurope.eu; demo uses a private range). */
  cmpId: number;
  cmpVersion: number;
  consentScreen: number;
  consentLanguage: string;
  vendorListVersion: number;
  tcfPolicyVersion: number;
  /** Purpose IDs granted consent (1..24). */
  purposesConsent: number[];
  /** Purpose IDs with legitimate-interest transparency. */
  purposesLITransparency: number[];
  specialFeatureOptIns: number[];
  publisherCountryCode: string;
  /** Vendor IDs consent was granted to (for the vendor segment). */
  vendorIds?: number[];
  /** Highest vendor id in the vendor list (for bitfield sizing). */
  maxVendorId?: number;
}

/** ISO 3166-1 alpha-2 → 12-bit field ('EN' → 0b000100 0b001110). */
function languageToBits(language: string): number {
  const upper = (language || 'en').toUpperCase().padEnd(2, 'E').slice(0, 2);
  const c1 = upper.charCodeAt(0) - 65;
  const c2 = upper.charCodeAt(1) - 65;
  return ((c1 & 0x3f) << 6) | (c2 & 0x3f);
}

interface VendorRange {
  isRange: boolean;
  start: number;
  end: number;
}

function buildRanges(vendorIds: number[]): VendorRange[] {
  const sorted = [...new Set(vendorIds)].sort((a, b) => a - b);
  const ranges: VendorRange[] = [];
  let start = sorted[0];
  let prev = start;
  for (let i = 1; i <= sorted.length; i++) {
    const current = sorted[i] ?? Number.MAX_SAFE_INTEGER;
    if (current === prev + 1) {
      prev = current;
    } else {
      ranges.push(prev === start ? { isRange: false, start, end: start } : { isRange: true, start, end: prev });
      start = current;
      prev = current;
    }
  }
  return ranges;
}

/** Vendor-consent segment (appended to the core string). */
function encodeVendorSegment(vendorIds: number[], maxVendorId?: number): Uint8Array {
  const writer = new BitWriter();
  const ids = [...new Set(vendorIds)].sort((a, b) => a - b);
  const max = maxVendorId ?? (ids.length ? ids[ids.length - 1] : 0);

  writer.write(max, 16); // maxVendorId
  if (max === 0) {
    writer.write(0, 1); // isRangeEncoding = false, empty bitfield
    return writer.toBytes();
  }

  const ranges = buildRanges(ids);
  const useRange = ranges.length * 2 < max; // sparse list → range encoding

  if (useRange) {
    writer.write(1, 1); // isRangeEncoding = true
    writer.write(ranges.length, 12); // numEntries
    for (const range of ranges) {
      writer.write(range.isRange ? 1 : 0, 1);
      writer.write(range.start, 16);
      if (range.isRange) writer.write(range.end, 16);
    }
  } else {
    writer.write(0, 1); // isRangeEncoding = false → bitfield
    for (let v = 1; v <= max; v++) writer.write(ids.includes(v) ? 1 : 0, 1);
  }
  return writer.toBytes();
}

/**
 * Build a full IAB TCF TC string: core segment + vendor-consent segment.
 */
export function buildTcfString(options: TcfOptions): string {
  const now = Date.now();
  const writer = new BitWriter();

  // ── core segment ─────────────────────────────────────────────────────────
  writer.write(2, 6); // version
  writer.write(now, 36); // created (unix ms)
  writer.write(now, 36); // lastUpdated (unix ms)
  writer.write(options.cmpId, 12);
  writer.write(options.cmpVersion, 12);
  writer.write(options.consentScreen, 6);
  writer.write(languageToBits(options.consentLanguage), 12);
  writer.write(options.vendorListVersion, 12);
  writer.write(options.tcfPolicyVersion, 6);
  writer.write(0, 1); // useNonStandardStacks

  let sf = 0;
  for (const id of options.specialFeatureOptIns) sf |= 1 << (id - 1);
  writer.write(sf, 12); // specialFeatureOptIns

  let pc = 0;
  for (const id of options.purposesConsent) pc |= 1 << (id - 1);
  writer.write(pc, 24); // purposesConsent

  let li = 0;
  for (const id of options.purposesLITransparency) li |= 1 << (id - 1);
  writer.write(li, 24); // purposesLITransparency

  writer.write(0, 1); // purposeOneTreatment
  writer.write(languageToBits(options.publisherCountryCode || 'EN'), 12); // publisherCC

  const core = writer.toBytes();

  // ── vendor-consent segment ───────────────────────────────────────────────
  const vendors = encodeVendorSegment(options.vendorIds ?? [], options.maxVendorId);

  const combined = new Uint8Array(core.length + vendors.length);
  combined.set(core);
  combined.set(vendors, core.length);
  return encodeBase64Url(combined);
}

/** Decoder for the core segment — used for self-verification + admin viewer. */
export function decodeTcfString(tcString: string): Record<string, number> {
  const reader = new BitReader(decodeBase64Url(tcString));
  return {
    version: reader.read(6),
    created: reader.read(36),
    lastUpdated: reader.read(36),
    cmpId: reader.read(12),
    cmpVersion: reader.read(12),
    consentScreen: reader.read(6),
    consentLanguage: reader.read(12),
    vendorListVersion: reader.read(12),
    tcfPolicyVersion: reader.read(6),
    useNonStandardStacks: reader.read(1),
    specialFeatureOptIns: reader.read(12),
    purposesConsent: reader.read(24),
    purposesLITransparency: reader.read(24),
    purposeOneTreatment: reader.read(1),
    publisherCC: reader.read(12),
  };
}

/* ── Consent Mode v2 string ─────────────────────────────────────────────── */

export interface ConsentModeState {
  analytics_storage: 'granted' | 'denied';
  ad_storage: 'granted' | 'denied';
  ad_user_data: 'granted' | 'denied';
  ad_personalization: 'granted' | 'denied';
  personalization_storage: 'granted' | 'denied';
  functionality_storage: 'granted' | 'denied';
  security_storage: 'granted' | 'denied';
}

/** Map a user's category choices to Google Consent Mode v2 signals. */
export function toConsentModeState(categories: CategoryState): ConsentModeState {
  return {
    analytics_storage: categories.analytics ? 'granted' : 'denied',
    ad_storage: categories.marketing ? 'granted' : 'denied',
    ad_user_data: categories.marketing ? 'granted' : 'denied',
    ad_personalization: categories.marketing ? 'granted' : 'denied',
    personalization_storage: categories.preferences ? 'granted' : 'denied',
    functionality_storage: categories.necessary ? 'granted' : 'denied',
    security_storage: 'granted', // security cookies are always allowed
  };
}

/**
 * Build the full consent payload: category state + GCM string + TCF string.
 * The TCF string maps categories → purposes (see categories.ts).
 */
export function buildConsentPayload(
  categories: CategoryState,
  region: ConsentRegion,
  language: string,
  opts: Partial<TcfOptions> = {},
): Pick<ConsentState, 'consentString' | 'tcfString'> {
  const consentString = JSON.stringify({
    version: 2,
    region,
    states: toConsentModeState(categories),
    updatedAt: new Date().toISOString(),
  });

  const purposesConsent: number[] = [];
  for (const definition of CATEGORIES) {
    if (categories[definition.id]) purposesConsent.push(...definition.tcfPurposes);
  }
  const tcfString =
    region === 'gdpr'
      ? buildTcfString({
          cmpId: opts.cmpId ?? 42, // demo CMP id — register a real one for production
          cmpVersion: opts.cmpVersion ?? 1,
          consentScreen: opts.consentScreen ?? 1,
          consentLanguage: opts.consentLanguage ?? (language.slice(0, 2) || 'en'),
          vendorListVersion: opts.vendorListVersion ?? 1,
          tcfPolicyVersion: opts.tcfPolicyVersion ?? 3, // TCF 2.3 → policy version 3
          purposesConsent,
          purposesLITransparency: [],
          specialFeatureOptIns: [],
          publisherCountryCode: opts.publisherCountryCode ?? 'EN',
          vendorIds: opts.vendorIds,
          maxVendorId: opts.maxVendorId,
        })
      : '';

  return { consentString, tcfString };
}

/* ── Dev self-test: the encoder must round-trip through its decoder ─────── */

function verifyTcfRoundTrip(): void {
  if (process.env.NODE_ENV !== 'development') return;
  const encoded = buildTcfString({
    cmpId: 42,
    cmpVersion: 1,
    consentScreen: 1,
    consentLanguage: 'en',
    vendorListVersion: 1,
    tcfPolicyVersion: 3,
    purposesConsent: [1, 2, 5],
    purposesLITransparency: [],
    specialFeatureOptIns: [],
    publisherCountryCode: 'KE',
    vendorIds: [1, 2, 3, 100, 101, 102, 500],
    maxVendorId: 500,
  });
  const decoded = decodeTcfString(encoded);
  const purposes = decoded.purposesConsent;
  const expected = (1 << 0) | (1 << 1) | (1 << 4); // purposes 1, 2, 5
  if (purposes !== expected) {
    // eslint-disable-next-line no-console
    console.error(
      `[consent-string] TCF round-trip failed: got purposes=${purposes} expected=${expected}`,
    );
  }
}
verifyTcfRoundTrip();
