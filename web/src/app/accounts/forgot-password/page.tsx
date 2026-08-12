import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Forgot Password',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
