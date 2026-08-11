import type { Metadata } from 'next';

import { LoginForm } from '@/components/LoginForm';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
};

// useSearchParams (callbackUrl) requires a real request - render on demand.
export const dynamic = 'force-dynamic';

export default function LoginPage() {
  return <LoginForm />;
}
