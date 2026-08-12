'use server'

import { auth } from '@/auth';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function processUploadAction(formData: FormData) {
  const session = await auth();
  if (!session?.user?.email || session.user.email !== 'royokola3@gmail.com') {
    throw new Error('Unauthorized');
  }

  const file = formData.get('file') as File;
  if (!file) {
    throw new Error('No file provided');
  }

  // Forward the file to the Django backend for AI parsing and database population.
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
  
  // Format the endpoint correctly avoiding double slashes
  const baseUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
  const endpoint = `${baseUrl}/api/v1/scholarships/upload_csv/`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData, // Next.js fetch supports passing FormData directly
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Django API Error:', errorText);
      throw new Error(`Failed to upload to backend: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Upload Result:', result);
    
    // Revalidate paths so the new data appears immediately
    revalidatePath('/');
    revalidatePath('/scholarships');
    
  } catch (error) {
    console.error('Upload Error:', error);
    throw error;
  }
  
  redirect('/admin?success=1');
}
