'use client';

/**
 * Admin Command Center - the entire admin surface lives behind
 * `/admin/consent-manager`, and the server page redirects non-ADMIN users.
 * Every tab below talks only to RBAC-protected /api/admin/* routes.
 */
import { useState } from 'react';

import { AnalyticsCharts } from './AnalyticsCharts';
import { ConsentLogsTable } from './ConsentLogsTable';
import { CookieScanner } from './CookieScanner';
import { CustomizationEngine } from './CustomizationEngine';
import { PolicyGenerator } from './PolicyGenerator';

type Tab = 'customize' | 'scanner' | 'policies' | 'logs' | 'analytics';

const TABS: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'customize', label: 'Customization', icon: '🎨' },
  { id: 'scanner', label: 'Cookie Scanner', icon: '🕵️' },
  { id: 'policies', label: 'Policy Generators', icon: '📜' },
  { id: 'logs', label: 'Consent Logs', icon: '📋' },
  { id: 'analytics', label: 'Analytics', icon: '📈' },
];

export function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('customize');

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    window.location.href = '/admin/login';
  }

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand">
          <span className="admin-sidebar__logo">🛡️</span>
          <div>
            <div className="admin-sidebar__title">Consent Manager</div>
            <div className="admin-sidebar__subtitle">Admin Environment</div>
          </div>
        </div>

        <nav className="admin-nav" aria-label="Admin sections">
          {TABS.map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              className={`admin-nav__item ${tab === id ? 'admin-nav__item--active' : ''}`}
              onClick={() => setTab(id)}
            >
              <span>{icon}</span> {label}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar__footer">
          <span className="admin-role-badge" title="Role-Based Access Control">
            ROLE: ADMIN
          </span>
          <button type="button" className="admin-btn admin-btn--ghost" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {tab === 'customize' && <CustomizationEngine />}
        {tab === 'scanner' && <CookieScanner />}
        {tab === 'policies' && <PolicyGenerator />}
        {tab === 'logs' && <ConsentLogsTable />}
        {tab === 'analytics' && <AnalyticsCharts />}
      </main>
    </div>
  );
}
