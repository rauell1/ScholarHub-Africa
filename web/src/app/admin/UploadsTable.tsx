'use client';

import { useTransition } from 'react';
import { resyncUploadAction, deleteUploadAction } from './actions';
import { UploadProgressRow } from './UploadProgressRow';

interface Upload {
  id: number;
  filename: string;
  status: string;
  totalProcessed: number;
  rows: unknown;
  uploadedAt: Date;
}

export function UploadsTable({ uploads }: { uploads: Upload[] }) {
  const [, startTransition] = useTransition();

  const handleResync = (id: number) =>
    startTransition(() => resyncUploadAction(id));

  const handleDelete = (id: number) =>
    startTransition(() => deleteUploadAction(id));

  if (uploads.length === 0) {
    return <p className="text-sm text-muted-foreground">No uploads found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-border text-sm text-muted-foreground">
            <th className="pb-3 pr-4 font-medium">Date</th>
            <th className="pb-3 px-4 font-medium">Filename</th>
            <th className="pb-3 px-4 font-medium">Status</th>
            <th className="pb-3 px-4 font-medium">Processed</th>
            <th className="pb-3 pl-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {uploads.map((upload) => (
            <UploadProgressRow
              key={upload.id}
              upload={upload}
              onResync={handleResync}
              onDelete={handleDelete}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
