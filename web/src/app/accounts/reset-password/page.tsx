import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/ResetPasswordForm';

export const metadata: Metadata = {
  title: 'Reset Password',
  robots: { index: false, follow: false },
};

// Next.js requires Suspense for useSearchParams on the client
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-muted-foreground">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
