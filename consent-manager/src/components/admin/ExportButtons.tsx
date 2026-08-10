'use client';

/**
 * Export buttons - CSV download (audit log) and PDF (printable report).
 * Both endpoints are RBAC-protected.
 */
export function ExportButtons() {
  return (
    <div className="admin-export">
      <a className="admin-btn admin-btn--ghost" href="/api/admin/export/csv" download>
        ⬇ Export logs as CSV
      </a>
      <a className="admin-btn admin-btn--ghost" href="/api/admin/export/report" target="_blank" rel="noreferrer">
        🖨 PDF report (print)
      </a>
    </div>
  );
}
