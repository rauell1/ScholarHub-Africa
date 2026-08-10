'use client';

/**
 * Consent Logs — secure audit table (Anonymized IP · Timestamp · Geolocation
 * · Consent String/State · Version) with filters and pagination.
 */
import { useCallback, useEffect, useState } from 'react';

import type { ConsentLogEntry } from '@/lib/consent/types';

interface LogsResponse {
  items: ConsentLogEntry[];
  total: number;
  page: number;
  pages: number;
  pageSize: number;
}

const REGIONS = ['gdpr', 'ccpa', 'none'];

export function ConsentLogsTable() {
  const [data, setData] = useState<LogsResponse | null>(null);
  const [region, setRegion] = useState('');
  const [accepted, setAccepted] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), page_size: '20' });
    if (region) params.set('region', region);
    if (accepted) params.set('accepted', accepted);
    const res = await fetch(`/api/admin/logs?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [page, region, accepted]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="admin-panel">
      <div className="admin-panel__header">
        <h1>Consent Logs</h1>
        <p>
          Every consent decision, stored with an anonymized IP, timestamp,
          geolocation, consent string and version — exportable for audits.
        </p>
      </div>

      <div className="admin-filters">
        <select className="admin-input" value={region} onChange={(e) => { setRegion(e.target.value); setPage(1); }}>
          <option value="">All regions</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>
              {r.toUpperCase()}
            </option>
          ))}
        </select>
        <select className="admin-input" value={accepted} onChange={(e) => { setAccepted(e.target.value); setPage(1); }}>
          <option value="">Any outcome</option>
          <option value="true">Accepted</option>
          <option value="false">Rejected</option>
        </select>
        <span className="admin-muted">
          {data ? `${data.total} record${data.total === 1 ? '' : 's'}` : ''}
        </span>
      </div>

      <div className="admin-card">
        {loading ? (
          <p className="admin-muted">Loading…</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Geolocation</th>
                <th>Anonymized IP</th>
                <th>Outcome</th>
                <th>State</th>
                <th>Consent string</th>
                <th>Version</th>
              </tr>
            </thead>
            <tbody>
              {(data?.items ?? []).map((log) => (
                <LogRow key={log.id} log={log} expanded={expanded === log.id} onToggle={() => setExpanded(expanded === log.id ? null : log.id)} />
              ))}
              {(data?.items ?? []).length === 0 && (
                <tr>
                  <td colSpan={7} className="admin-muted">
                    No consent records yet — open the site and make a choice in the banner.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {data && data.pages > 1 && (
          <div className="admin-pagination">
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Prev
            </button>
            <span className="admin-muted">
              Page {data.page} / {data.pages}
            </span>
            <button
              type="button"
              className="admin-btn admin-btn--ghost"
              disabled={page >= data.pages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function LogRow({
  log,
  expanded,
  onToggle,
}: {
  log: ConsentLogEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr onClick={onToggle} className="admin-row--clickable" title="Click for details">
        <td>{new Date(log.timestamp).toLocaleString()}</td>
        <td>
          {log.geolocation.region.toUpperCase()}
          {log.geolocation.country ? ` (${log.geolocation.country})` : ''}
        </td>
        <td className="admin-mono">{log.anonymizedIp}</td>
        <td>
          <span className={`admin-chip ${log.accepted ? 'admin-chip--accepted' : 'admin-chip--rejected'}`}>
            {log.accepted ? 'Accepted' : 'Rejected'}
          </span>
        </td>
        <td className="admin-mono">
          N:{log.state.necessary ? 1 : 0} A:{log.state.analytics ? 1 : 0} M:{log.state.marketing ? 1 : 0} P:{log.state.preferences ? 1 : 0}
        </td>
        <td className="admin-mono admin-cell--truncate">{log.consentString}</td>
        <td>v{log.version}</td>
      </tr>
      {expanded && (
        <tr className="admin-row--expanded">
          <td colSpan={7}>
            <strong>Consent string (GCM v2):</strong>
            <pre className="admin-mono admin-pre">{log.consentString}</pre>
            {log.tcfString && (
              <>
                <strong>TC string (IAB TCF 2.3):</strong>
                <pre className="admin-mono admin-pre">{log.tcfString}</pre>
              </>
            )}
          </td>
        </tr>
      )}
    </>
  );
}
