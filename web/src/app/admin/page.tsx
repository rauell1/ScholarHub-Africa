import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { processUploadAction } from './actions';

export const metadata = {
  title: 'Admin Dashboard - ScholarHub',
};

export default async function AdminPage() {
  const session = await auth();

  // Upgrade 'royokola3@gmail.com' to ADMIN
  if (!session?.user?.email || session.user.email !== 'royokola3@gmail.com') {
    redirect('/');
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 md:py-24">
      <h1 className="font-display text-4xl font-semibold text-foreground mb-4">
        Admin Dashboard
      </h1>
      <p className="text-muted-foreground mb-8">
        Welcome, {session.user.name || session.user.email}. You have admin privileges.
      </p>

      <div className="rounded-xl border border-border bg-card p-6 shadow-soft">
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
    </div>
  );
}
