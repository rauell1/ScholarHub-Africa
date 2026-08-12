'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { DashboardColumn } from '@/lib/tracker-queries';
import { PRIORITY_LABELS, STAGE_LABELS } from '@/lib/tracker-queries';
import { deadlineDisplay } from '@/lib/dates';

const STAGE_CHOICES = Object.entries(STAGE_LABELS);
const PRIORITY_CHOICES = Object.entries(PRIORITY_LABELS);
const SOP_CHOICES = [
  ['not_started', 'Not Started'],
  ['drafting', 'Drafting'],
  ['done', 'Done'],
] as const;
const REFS_CHOICES = [
  ['not_started', 'Not Started'],
  ['requested', 'Requested'],
  ['received', 'Received'],
] as const;

function SpreadsheetRow({ app }: { app: DashboardColumn['applications'][number] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    stage: app.stage,
    priority: app.priority,
    sop_status: app.sop_status,
    refs_status: app.refs_status,
    next_action: app.next_action || '',
    next_action_due: app.next_action_due || '',
    transcript_ready: app.transcript_ready,
    moi_ready: app.moi_ready,
    notes: app.notes || '',
  });

  const saveField = async (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/tracker/applications/${app.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          [field]: value,
          next_action_due: field === 'next_action_due' ? (value || null) : (form.next_action_due || null),
        }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!confirm('Remove this application from your tracker?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/tracker/applications/${app.id}`, {
        method: 'DELETE',
      });
      if (res.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const deadline = deadlineDisplay(app.deadline_date);

  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      <td className="p-3 text-sm font-medium">
        <a href={`/scholarships/${app.scholarship_slug}/`} className="text-foreground hover:text-teal block truncate max-wxs">
          {app.scholarship_name}
        </a>
        <div className="text-xs text-muted-foreground mt-1">
          {app.country_flag} {app.country_name} · <span className={deadline.className}>{deadline.text}</span>
        </div>
      </td>
      <td className="p-3">
        <select
          value={form.stage}
          onChange={(e) => saveField('stage', e.target.value)}
          disabled={busy}
          className="input py-1 text-xs bg-transparent border-transparent hover:border-border cursor-pointer w-32"
        >
          {STAGE_CHOICES.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </td>
      <td className="p-3">
        <select
          value={form.priority}
          onChange={(e) => saveField('priority', e.target.value)}
          disabled={busy}
          className="input py-1 text-xs bg-transparent border-transparent hover:border-border cursor-pointer w-24"
        >
          {PRIORITY_CHOICES.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </td>
      <td className="p-3">
        <select
          value={form.sop_status}
          onChange={(e) => saveField('sop_status', e.target.value)}
          disabled={busy}
          className="input py-1 text-xs bg-transparent border-transparent hover:border-border cursor-pointer w-28"
        >
          {SOP_CHOICES.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </td>
      <td className="p-3">
        <select
          value={form.refs_status}
          onChange={(e) => saveField('refs_status', e.target.value)}
          disabled={busy}
          className="input py-1 text-xs bg-transparent border-transparent hover:border-border cursor-pointer w-28"
        >
          {REFS_CHOICES.map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </td>
      <td className="p-3 text-center">
        <input
          type="checkbox"
          checked={form.transcript_ready}
          onChange={(e) => saveField('transcript_ready', e.target.checked)}
          disabled={busy}
          className="rounded text-teal cursor-pointer"
          title="Transcript"
        />
      </td>
      <td className="p-3 text-center">
        <input
          type="checkbox"
          checked={form.moi_ready}
          onChange={(e) => saveField('moi_ready', e.target.checked)}
          disabled={busy}
          className="rounded text-teal cursor-pointer"
          title="MoI letter"
        />
      </td>
      <td className="p-3 min-w-[150px]">
        <input
          type="text"
          value={form.next_action}
          onChange={(e) => setForm({ ...form, next_action: e.target.value })}
          onBlur={(e) => saveField('next_action', e.target.value)}
          disabled={busy}
          placeholder="Next action..."
          className="input py-1 text-xs bg-transparent border-transparent hover:border-border w-full"
        />
      </td>
      <td className="p-3">
        <input
          type="date"
          value={form.next_action_due}
          onChange={(e) => saveField('next_action_due', e.target.value)}
          disabled={busy}
          className="input py-1 text-xs bg-transparent border-transparent hover:border-border"
        />
      </td>
      <td className="p-3 min-w-[150px]">
        <input
          type="text"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          onBlur={(e) => saveField('notes', e.target.value)}
          disabled={busy}
          placeholder="Notes..."
          className="input py-1 text-xs bg-transparent border-transparent hover:border-border w-full"
        />
      </td>
      <td className="p-3 text-right">
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="text-crimson hover:bg-crimson/10 p-1.5 rounded transition-colors"
          title="Delete application"
        >
          🗑
        </button>
      </td>
    </tr>
  );
}

export function TrackerSpreadsheet({ columns }: { columns: DashboardColumn[] }) {
  // Flatten all applications into one list for the spreadsheet
  const allApps = columns.flatMap(col => col.applications);

  if (allApps.length === 0) {
    return (
      <div className="card text-center py-12 mt-8">
        <p className="text-muted-foreground">No applications tracked yet. Browse the directory to add some!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto card !p-0 mt-8">
      <table className="w-full text-left border-collapse min-w-[1000px]">
        <thead>
          <tr className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <th className="p-3 font-semibold">Scholarship</th>
            <th className="p-3 font-semibold">Stage</th>
            <th className="p-3 font-semibold">Priority</th>
            <th className="p-3 font-semibold">SOP</th>
            <th className="p-3 font-semibold">Refs</th>
            <th className="p-3 font-semibold text-center" title="Transcript Ready">Tr.</th>
            <th className="p-3 font-semibold text-center" title="MoI Letter Ready">MoI</th>
            <th className="p-3 font-semibold">Next Action</th>
            <th className="p-3 font-semibold">Due</th>
            <th className="p-3 font-semibold">Notes</th>
            <th className="p-3 font-semibold text-right"></th>
          </tr>
        </thead>
        <tbody>
          {allApps.map((app) => (
            <SpreadsheetRow key={app.id} app={app} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
