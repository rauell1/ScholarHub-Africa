'use client';

/**
 * Analytics dashboard — opt-in rates over time (Recharts) + category and
 * region breakdowns, driven by /api/admin/analytics.
 */
import { useEffect, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import type { AnalyticsSummary } from '@/lib/analytics';

const REGION_COLORS: Record<string, string> = {
  gdpr: '#1F3864',
  ccpa: '#1ABC9C',
  none: '#9ca3af',
};

export function AnalyticsCharts() {
  const [data, setData] = useState<AnalyticsSummary | null>(null);

  useEffect(() => {
    fetch('/api/admin/analytics?days=30')
      .then((r) => r.json())
      .then(setData);
  }, []);

  if (!data) return <div className="admin-panel">Loading analytics…</div>;

  const categoryData = [
    { name: 'Necessary', value: data.categoryTotals.necessary },
    { name: 'Analytics', value: data.categoryTotals.analytics },
    { name: 'Marketing', value: data.categoryTotals.marketing },
    { name: 'Preferences', value: data.categoryTotals.preferences },
  ];
  const regionData = Object.entries(data.regionBreakdown).map(([name, value]) => ({
    name: name.toUpperCase(),
    value,
    color: REGION_COLORS[name] ?? '#9ca3af',
  }));

  return (
    <div className="admin-panel">
      <div className="admin-panel__header">
        <h1>Consent Analytics</h1>
        <p>Opt-in rates over time and category acceptance — from the consent audit log.</p>
      </div>

      <div className="admin-kpis">
        <div className="admin-kpi">
          <span className="admin-kpi__label">Overall opt-in rate</span>
          <span className="admin-kpi__value">{data.overallOptInRate}%</span>
        </div>
        <div className="admin-kpi">
          <span className="admin-kpi__label">Total records</span>
          <span className="admin-kpi__value">{data.totalRecords}</span>
        </div>
        <div className="admin-kpi">
          <span className="admin-kpi__label">Active days (30d)</span>
          <span className="admin-kpi__value">{data.daily.filter((d) => d.total > 0).length}</span>
        </div>
      </div>

      <div className="admin-card">
        <h2>Opt-in rate — last 30 days</h2>
        <div className="admin-chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.daily} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="optIn" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1ABC9C" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#1ABC9C" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
              <Tooltip />
              <Area type="monotone" dataKey="optInRate" name="Opt-in rate" stroke="#1ABC9C" fill="url(#optIn)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="admin-grid">
        <div className="admin-card">
          <h2>Consent events per day</h2>
          <div className="admin-chart admin-chart--small">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.daily} margin={{ top: 8, right: 16, bottom: 0, left: -24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="total" name="Consent events" fill="#1F3864" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-card">
          <h2>Category acceptance</h2>
          <div className="admin-chart admin-chart--small">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={3}>
                  {categoryData.map((entry, i) => (
                    <Cell key={entry.name} fill={['#1F3864', '#1ABC9C', '#F39C12', '#2980B9'][i]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="admin-card">
        <h2>Region breakdown</h2>
        <div className="admin-chart admin-chart--small">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={regionData} dataKey="value" nameKey="name" outerRadius={90}>
                {regionData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
