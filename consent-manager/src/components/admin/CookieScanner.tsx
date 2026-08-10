'use client';

/**
 * Automatic Cookie & Tracker Scan - triggers the headless/static scanner via
 * POST /api/admin/scan and presents findings grouped by cookie category.
 */
import { useState } from 'react';

import type { ConsentCategory } from '@/lib/consent/types';
import type { ScanResult } from '@/lib/scanner/scanner';

const CATEGORY_LABELS: Record<string, string> = {
  necessary: 'Necessary',
  analytics: 'Analytics',
  marketing: 'Marketing',
  preferences: 'Preferences',
  unclassified: 'Unclassified',
};

export function CookieScanner() {
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runScan(target = url) {
    setScanning(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Scan failed');
      setResult(data as ScanResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Scan failed');
      setResult(null);
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className="admin-panel">
      <div className="admin-panel__header">
        <h1>Automatic Cookie & Tracker Scan</h1>
        <p>
          Runs a headless scan against a URL, detects first/third-party
          trackers and auto-classifies them into consent categories.
        </p>
      </div>

      <div className="admin-scan-bar">
        <input
          type="url"
          className="admin-input"
          placeholder="https://scholarhub.africa"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          type="button"
          className="admin-btn admin-btn--primary"
          onClick={() => runScan()}
          disabled={scanning}
        >
          {scanning ? 'Scanning…' : '🔍 Run scan'}
        </button>
      </div>

      {error && <div className="admin-alert admin-alert--error">{error}</div>}

      {result && (
        <>
          <div className="admin-card">
            <h2>Findings - {result.url}</h2>
            <p className="admin-muted">
              Scanned {result.scannedAt.replace('T', ' ').slice(0, 19)} UTC
              {result.headless ? ' · headless (JS-executed)' : ' · static HTML analysis'}
            </p>
            <div className="admin-kpis">
              {Object.entries(result.byCategory).map(([category, count]) => (
                <div key={category} className="admin-kpi">
                  <span className="admin-kpi__label">{CATEGORY_LABELS[category] ?? category}</span>
                  <span className="admin-kpi__value">{count}</span>
                </div>
              ))}
            </div>
          </div>

          {result.cookies && (
            <div className="admin-card">
              <h2>Detected cookies (headless)</h2>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Cookie</th>
                    <th>Domain</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {result.cookies.map((cookie, i) => (
                    <tr key={i}>
                      <td>{cookie.name}</td>
                      <td>{cookie.domain}</td>
                      <td>
                        <span className={`admin-chip admin-chip--${cookie.category}`}>
                          {CATEGORY_LABELS[cookie.category] ?? cookie.category}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="admin-card">
            <h2>Trackers ({result.trackers.length})</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Type</th>
                  <th>Category</th>
                </tr>
              </thead>
              <tbody>
                {result.trackers.map((tracker, i) => (
                  <tr key={i}>
                    <td className="admin-cell--break">{tracker.url}</td>
                    <td>{tracker.type}</td>
                    <td>
                      <span className={`admin-chip admin-chip--${tracker.category}`}>
                        {CATEGORY_LABELS[tracker.category] ?? tracker.category}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
