'use server'

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import Papa from 'papaparse';
import { inngest } from '@/inngest/client';

export async function processUploadAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== 'royokola3@gmail.com') {
    throw new Error('Unauthorized');
  }

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
  
  // Dispatch the event to Inngest to process in the background
  await inngest.send({
    name: 'csv.uploaded',
    data: {
      rows: rawRows,
    },
  });

  redirect('/admin?success=1&queued=true');
}
