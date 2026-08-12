import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { processUploadAction, resyncUploadAction, deleteUploadAction } from './actions';
import { getDb } from '@/lib/db';
import { csvUploads } from '@/db/schema';
import { desc } from 'drizzle-orm';

export const metadata = {
  title: 'Admin Dashboard - ScholarHub',
};

export default async function AdminPage() {
  const session = await auth();

  // Upgrade 'royokola3@gmail.com' to ADMIN
  if (!session?.user?.email || session.user.email !== 'royokola3@gmail.com') {
    redirect('/');
  }

  const db = getDb();
  const uploads = await db.select().from(csvUploads).orderBy(desc(csvUploads.uploadedAt));

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 md:py-24">
      <h1 className="font-display text-4xl font-semibold text-foreground mb-4">
        Admin Dashboard
      </h1>
      <p className="text-muted-foreground mb-8">
        Welcome, {session.user.name || session.user.email}. You have admin privileges.
      </p>

      <div className="rounded-xl border border-border bg-card p-6 shadow-soft mb-8">
        <h2 className="text-xl font-semibold mb-4">Upload Scholarships Spreadsheet</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Upload a CSV export of your Master Database. Our NVIDIA AI will automatically 
          parse the document and populate the database with new scholarships.
        </p>

        <form action={processUploadAction} className="flex flex-col gap-4">
          <input
            type="file"
            name="file"
            accept=".csv, .txt"
            required
            className="block w-full text-sm text-muted-foreground
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-accent/10 file:text-accent
              hover:file:bg-accent/20"
          />
          <button type="submit" className="btn-primary self-start px-6 py-2">
            Upload & Sync
          </button>
        </form>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
        <h2 className="text-xl font-semibold mb-4">Past Uploads</h2>
        
        {uploads.length === 0 ? (
           <p className="text-sm text-muted-foreground">No uploads found.</p>
        ) : (
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
                  <tr key={upload.id} className="border-b border-border/50 last:border-0">
                    <td className="py-4 pr-4 text-sm">
                      {upload.uploadedAt.toLocaleDateString()} {upload.uploadedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-4 px-4 text-sm font-medium">{upload.filename}</td>
                    <td className="py-4 px-4 text-sm">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        upload.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        upload.status === 'error' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                        'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                      }`}>
                        {upload.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-muted-foreground">
                       {upload.totalProcessed} {upload.rows ? ` / ${(upload.rows as any[]).length}` : ''}
                    </td>
                    <td className="py-4 pl-4 flex gap-2 justify-end">
                      <form action={resyncUploadAction.bind(null, upload.id)}>
                        <button type="submit" className="text-xs px-3 py-1.5 rounded bg-accent/10 text-accent hover:bg-accent/20 transition-colors">
                          Resync
                        </button>
                      </form>
                      <form action={deleteUploadAction.bind(null, upload.id)}>
                        <button type="submit" className="text-xs px-3 py-1.5 rounded bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition-colors">
                          Delete
                        </button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
