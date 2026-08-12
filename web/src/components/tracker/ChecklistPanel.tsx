'use client';

import { useRouter } from 'next/navigation';

import type { DocumentRow } from '@/lib/tracker-queries';
import { DOC_STATUS_LABELS } from '@/lib/tracker-queries';

const STATUS_CHOICES = Object.entries(DOC_STATUS_LABELS);

const STATUS_ICONS: Record<string, string> = {
  ready: '✅',
  in_progress: '🔄',
  not_needed: '➖',
  not_started: '⬜',
};

/**
 * Document checklist (port of templates/tracker/checklist.html
 * interactivity): status select posts to the tracker API and refreshes.
 */
export function ChecklistPanel({ documents }: { documents: DocumentRow[] }) {
  const router = useRouter();

  const setStatus = async (id: number, status: string) => {
    const res = await fetch(`/api/v1/tracker/documents/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) router.refresh();
  };

  if (documents.length === 0) {
    return (
      <div className="card p-6 text-center text-sm text-muted-foreground">
        Checklist will appear once your profile is created.
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {documents.map((doc) => (
        <li key={doc.id} className="card flex flex-wrap items-center gap-3 !p-3">
          <span className="text-lg" aria-hidden="true">
            {STATUS_ICONS[doc.status] ?? '⬜'}
          </span>
          <div className="min-w-0 flex-1">
            <p
              className={`text-sm font-semibold text-foreground ${doc.status === 'ready' ? 'line-through opacity-50' : ''}`}
            >
              {doc.name}
            </p>
            {doc.notes && <p className="text-xs text-muted-foreground">{doc.notes}</p>}
          </div>
          <select
            value={doc.status}
            onChange={(e) => setStatus(doc.id, e.target.value)}
            className="input !w-auto py-1 text-xs"
            aria-label={`Status for ${doc.name}`}
          >
            {STATUS_CHOICES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </li>
      ))}
    </ul>
  );
}
