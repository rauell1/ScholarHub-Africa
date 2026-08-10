/**
 * Consent-log analytics — opt-in rates over time and per-category totals.
 * Consumed by the admin dashboard charts.
 */
import type { ConsentLogEntry } from '@/lib/consent/types';

export interface DailySeriesPoint {
  date: string; // YYYY-MM-DD
  total: number;
  accepted: number;
  optInRate: number; // 0..100
}

export interface AnalyticsSummary {
  daily: DailySeriesPoint[];
  overallOptInRate: number;
  totalRecords: number;
  categoryTotals: {
    necessary: number;
    analytics: number;
    marketing: number;
    preferences: number;
  };
  regionBreakdown: Record<string, number>;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function computeAnalytics(logs: ConsentLogEntry[], days = 30): AnalyticsSummary {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buckets = new Map<string, { total: number; accepted: number }>();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * DAY_MS);
    buckets.set(d.toISOString().slice(0, 10), { total: 0, accepted: 0 });
  }

  const categoryTotals = {
    necessary: 0,
    analytics: 0,
    marketing: 0,
    preferences: 0,
  };
  const regionBreakdown: Record<string, number> = {};
  let acceptedTotal = 0;

  for (const log of logs) {
    const day = log.timestamp.slice(0, 10);
    const bucket = buckets.get(day);
    if (bucket) {
      bucket.total += 1;
      if (log.accepted) {
        bucket.accepted += 1;
        acceptedTotal += 1;
      }
    }
    if (log.state.analytics) categoryTotals.analytics += 1;
    if (log.state.marketing) categoryTotals.marketing += 1;
    if (log.state.preferences) categoryTotals.preferences += 1;
    if (log.state.necessary) categoryTotals.necessary += 1;
    regionBreakdown[log.geolocation.region] =
      (regionBreakdown[log.geolocation.region] ?? 0) + 1;
  }

  const daily = [...buckets.entries()].map(([date, b]) => ({
    date,
    total: b.total,
    accepted: b.accepted,
    optInRate: b.total === 0 ? 0 : Math.round((100 * b.accepted) / b.total),
  }));

  const overallOptInRate =
    logs.length === 0 ? 0 : Math.round((100 * acceptedTotal) / logs.length);

  return {
    daily,
    overallOptInRate,
    totalRecords: logs.length,
    categoryTotals,
    regionBreakdown,
  };
}
