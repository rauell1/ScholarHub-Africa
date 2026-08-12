'use client';

import { useEffect, useState } from 'react';

interface ProgressState {
  totalProcessed: number;
  total: number;
  status: string;
}

interface Upload {
  id: number;
  filename: string;
  status: string;
  totalProcessed: number;
  rows: unknown;
  uploadedAt: Date;
}

export function UploadProgressRow({
  upload,
  onResync,
  onDelete,
}: {
  upload: Upload;
  onResync: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  const [progress, setProgress] = useState<ProgressState>({
    totalProcessed: upload.totalProcessed,
    total: Array.isArray(upload.rows) ? upload.rows.length : 0,
    status: upload.status,
  });

  useEffect(() => {
    // Only stream live updates for in-progress uploads
    if (upload.status === 'completed' || upload.status === 'error') return;

    const evtSource = new EventSource(`/api/admin/upload-progress/${upload.id}`);

    evtSource.onmessage = (e) => {
      const data = JSON.parse(e.data) as ProgressState;
      setProgress(data);
      if (data.status === 'completed' || data.status === 'error') {
        evtSource.close();
      }
    };

    evtSource.onerror = () => evtSource.close();

    return () => evtSource.close();
  }, [upload.id, upload.status]);

  const statusColors: Record<string, string> = {
    completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
    processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  };

  const pct = progress.total > 0
    ? Math.round((progress.totalProcessed / progress.total) * 100)
    : null;

  return (
    <tr className="border-b border-border/50 last:border-0">
      <td className="py-4 pr-4 text-sm">
        {upload.uploadedAt.toLocaleDateString()}{' '}
        {upload.uploadedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </td>
      <td className="py-4 px-4 text-sm font-medium">{upload.filename}</td>
      <td className="py-4 px-4 text-sm">
        <span
          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[progress.status] ?? statusColors.processing}`}
        >
          {progress.status}
        </span>
      </td>
      <td className="py-4 px-4 text-sm text-muted-foreground">
        {progress.totalProcessed}
        {progress.total > 0 && ` / ${progress.total}`}
        {pct !== null && progress.status === 'processing' && (
          <span className="ml-2 text-xs text-accent">({pct}%)</span>
        )}
        {progress.status === 'processing' && progress.total > 0 && (
          <div className="mt-1 h-1 w-24 rounded bg-border overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </td>
      <td className="py-4 pl-4 flex gap-2 justify-end">
        <button
          onClick={() => onResync(upload.id)}
          className="text-xs px-3 py-1.5 rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
        >
          Resync
        </button>
        <button
          onClick={() => onDelete(upload.id)}
          className="text-xs px-3 py-1.5 rounded bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
