import type { Metadata } from 'next';

import { ConsentProvider } from '@/components/end-user/ConsentProvider';
import { getConfig } from '@/lib/server/store';

import './globals.css';

export const metadata: Metadata = {
  title: 'ScholarHub Africa — Consent Manager Demo',
  description:
    'GDPR & CCPA-compliant cookie and consent management for ScholarHub Africa.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side: load the admin-customised banner config (merged over defaults).
  const config = await getConfig();

  return (
    <html lang={config.language}>
      <body>
        <ConsentProvider config={config}>{children}</ConsentProvider>
      </body>
    </html>
  );
}
