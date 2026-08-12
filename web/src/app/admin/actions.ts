'use server'

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Papa from 'papaparse';
import { inngest } from '@/inngest/client';
import { getDb } from '@/lib/db';
import { csvUploads } from '@/db/schema';
import { eq } from 'drizzle-orm';
import type { Session } from 'next-auth';

function requireAdmin(session: Session | null) {
  if (!session?.user?.email || session.user.email !== 'royokola3@gmail.com') {
    throw new Error('Unauthorized');
  }
}

export async function processUploadAction(formData: FormData) {
  const session = await auth();
  requireAdmin(session);

  const file = formData.get('file') as File;
  if (!file) {
    throw new Error('No file provided');
  }

  const csvText = await file.text();
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  if (parsed.errors.length > 0) {
    throw new Error('Failed to parse CSV');
  }
  
  const rawRows = parsed.data;
  
  const db = getDb();
  const inserted = await db.insert(csvUploads).values({
    filename: file.name,
    rows: rawRows,
    status: 'processing',
    totalProcessed: 0,
  }).returning({ id: csvUploads.id });
  
  const uploadId = inserted[0].id;

  // Dispatch the event to Inngest to process in the background
  await inngest.send({
    name: 'csv.uploaded',
    data: {
      uploadId,
    },
  });

  redirect('/admin?success=1&queued=true');
}

export async function resyncUploadAction(uploadId: number) {
  const session = await auth();
  requireAdmin(session);

  const db = getDb();
  await db.update(csvUploads)
    .set({ status: 'processing', totalProcessed: 0 })
    .where(eq(csvUploads.id, uploadId));

  await inngest.send({
    name: 'csv.uploaded',
    data: {
      uploadId,
    },
  });

  revalidatePath('/admin');
}

export async function deleteUploadAction(uploadId: number) {
  const session = await auth();
  requireAdmin(session);

  const db = getDb();
  await db.delete(csvUploads).where(eq(csvUploads.id, uploadId));

  revalidatePath('/admin');
}

export async function syncFromGitHubAction() {
  const session = await auth();
  requireAdmin(session);

  const { fetchAndSyncFromGitHub } = await import('@/lib/sync-scholarships');
  const result = await fetchAndSyncFromGitHub();

  revalidatePath('/admin');
  return result;
}
