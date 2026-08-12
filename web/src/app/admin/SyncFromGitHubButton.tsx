'use client';

import { useState, useTransition } from 'react';
import { syncFromGitHubAction } from './actions';

interface SyncResult {
  upserted: number;
  skipped: number;
  total: number;
  errors: string[];
}

export function SyncFromGitHubButton() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSync() {
    setResult(null);
    setError(null);
    startTransition(async () => {
      try {
        const res = await syncFromGitHubAction();
        setResult(res);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Sync failed');
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={handleSync}
        disabled={isPending}
        className="btn-primary self-start px-6 py-2 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? 'Syncing…' : 'Sync from GitHub CSV'}
      </button>

      {isPending && (
        <p className="text-sm text-muted-foreground animate-pulse">
          Fetching CSV from GitHub and upserting scholarships — this may take 30–60 seconds…
        </p>
      )}

      {result && (
        <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm space-y-1">
          <p className="font-semibold text-foreground">
            Sync complete — {result.upserted} upserted, {result.skipped} skipped ({result.total} total)
          </p>
          {result.errors.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-destructive font-medium">
                {result.errors.length} error{result.errors.length > 1 ? 's' : ''} (click to expand)
              </summary>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {result.errors.map((e, i) => (
                  <li key={i} className="font-mono text-xs break-all">• {e}</li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive font-medium">Error: {error}</p>
      )}
    </div>
  );
}
