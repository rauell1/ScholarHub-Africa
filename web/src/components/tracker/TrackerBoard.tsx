'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { DashboardColumn } from '@/lib/tracker-queries';
import { PRIORITY_LABELS, STAGE_LABELS } from '@/lib/tracker-queries';
import { deadlineDisplay } from '@/lib/dates';

/**
 * Kanban tracker board (port of templates/tracker/dashboard.html
 * interactivity): inline update form + delete, backed by the tracker API.
 */
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

function ApplicationCard({
  app,
}: {
  app: DashboardColumn['applications'][number];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    stage: app.stage,
    priority: app.priority,
    sop_status: app.sop_status,
    refs_status: app.refs_status,
    next_action: app.next_action,
    next_action_due: app.next_action_due ?? '',
    transcript_ready: app.transcript_ready,
    moi_ready: app.moi_ready,
    notes: app.notes,
  });

  const deadline = deadlineDisplay(app.deadline_date);
  const priorityTone =
    app.priority === 'reach'
      ? 'bg-crimson-light text-crimson'
      : app.priority === 'target'
        ? 'bg-amber-light text-amber'
        : 'bg-forest-light text-forest';

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/v1/tracker/applications/${app.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          next_action_due: form.next_action_due || null,
        }),
      });
      if (res.ok) {
        setEditing(false);
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

  return (
    <article className="card space-y-2 !p-3.5">
      <div className="flex items-start justify-between gap-2">
        <a
          href={`/scholarships/${app.scholarship_slug}/`}
          className="text-sm font-bold leading-snug text-navy transition-colors hover:text-teal"
        >
          {app.scholarship_name}
        </a>
        <span className={`badge ${priorityTone}`}>{PRIORITY_LABELS[app.priority] ?? app.priority}</span>
      </div>

      <div className="flex items-center justify-between text-xs text-navy/60">
        <span>
          {app.country_flag} {app.country_name}
        </span>
        <span className={deadline.className}>{deadline.text}</span>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs text-navy/60">
          <span>Readiness</span>
          <span className="font-bold text-navy">{app.completion_percentage}%</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full bg-teal transition-all"
            style={{ width: `${app.completion_percentage}%` }}
          />
        </div>
      </div>

      {app.next_action && (
        <p className="rounded-lg bg-amber-light px-2.5 py-1.5 text-xs text-navy/70">
          <span className="font-bold text-amber">Next:</span> {app.next_action}
          {app.next_action_due && (
            <span className="block text-navy/50">due {app.next_action_due}</span>
          )}
        </p>
      )}

      <div className="flex items-center gap-2 pt-1">
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          className="btn-ghost px-2 py-1 text-xs"
          aria-expanded={editing}
        >
          ✏️ Update
        </button>
        <button
          type="button"
          onClick={remove}
          disabled={busy}
          className="btn-ghost ml-auto px-2 py-1 text-xs text-crimson"
        >
          🗑
        </button>
      </div>

      {editing && (
        <form onSubmit={save} className="space-y-2 border-t border-navy/10 pt-2">
          <div>
            <label className="mb-1 block text-xs font-semibold text-navy/60">Stage</label>
            <select
              value={form.stage}
              onChange={(e) => setForm({ ...form, stage: e.target.value })}
              className="input py-1.5"
            >
              {STAGE_CHOICES.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-navy/60">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                className="input py-1.5"
              >
                {PRIORITY_CHOICES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-navy/60">SOP status</label>
              <select
                value={form.sop_status}
                onChange={(e) => setForm({ ...form, sop_status: e.target.value })}
                className="input py-1.5"
              >
                {SOP_CHOICES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-navy/60">Referees</label>
              <select
                value={form.refs_status}
                onChange={(e) => setForm({ ...form, refs_status: e.target.value })}
                className="input py-1.5"
              >
                {REFS_CHOICES.map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-navy/60">Next action due</label>
              <input
                type="date"
                value={form.next_action_due}
                onChange={(e) => setForm({ ...form, next_action_due: e.target.value })}
                className="input py-1.5"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-navy/60">Next action</label>
            <input
              type="text"
              value={form.next_action}
              onChange={(e) => setForm({ ...form, next_action: e.target.value })}
              className="input py-1.5"
              placeholder="e.g. Email referee 1"
            />
          </div>
          <div className="flex items-center gap-4 pt-1">
            <label className="flex items-center gap-1.5 text-xs text-navy/70">
              <input
                type="checkbox"
                checked={form.transcript_ready}
                onChange={(e) => setForm({ ...form, transcript_ready: e.target.checked })}
                className="rounded text-teal"
              />
              Transcript
            </label>
            <label className="flex items-center gap-1.5 text-xs text-navy/70">
              <input
                type="checkbox"
                checked={form.moi_ready}
                onChange={(e) => setForm({ ...form, moi_ready: e.target.checked })}
                className="rounded text-teal"
              />
              MoI letter
            </label>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-navy/60">Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="input py-1.5"
              placeholder="Private notes"
            />
          </div>
          <button type="submit" disabled={busy} className="btn-primary w-full py-1.5 text-xs">
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </form>
      )}
    </article>
  );
}

export function TrackerBoard({ columns }: { columns: DashboardColumn[] }) {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {columns.map((column) => (
        <div key={column.key} className="rounded-2xl bg-navy/5 p-3">
          <h2 className="mb-3 flex items-center justify-between px-1 text-sm font-bold uppercase tracking-wide text-navy">
            {column.label}
            <span className="badge bg-white text-navy shadow-sm">{column.applications.length}</span>
          </h2>

          <div className="space-y-3">
            {column.applications.map((app) => (
              <ApplicationCard key={app.id} app={app} />
            ))}
            {column.applications.length === 0 && (
              <p className="rounded-xl border border-dashed border-navy/20 p-4 text-center text-xs text-navy/40">
                {column.key === 'planning'
                  ? 'Nothing here yet - browse the directory and add a scholarship.'
                  : 'No applications in this stage.'}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
