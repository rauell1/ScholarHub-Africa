import type { Metadata, Viewport } from 'next';

import { AuthSessionProvider } from '@/components/AuthSessionProvider';
import { ChatWidget } from '@/components/ChatWidget';
import { Analytics } from '@/components/consent/Analytics';
import { ConsentProvider } from '@/components/consent/ConsentProvider';
import { Footer } from '@/components/Footer';
import { Navbar } from '@/components/Navbar';
import { getConfig } from '@/lib/server/store';
import { site } from '@/lib/site';
import './globals.css';

/**
 * Root layout - parity with templates/base.html:
 * - same fonts (Outfit/Inter/JetBrains Mono) - self-hosted via Fontsource
 *   variable fonts imported in globals.css (CSP-safe: font-src 'self' data:
 *   stays valid; the Django build's Google Fonts <link> would violate it)
 * - SEO defaults via the Metadata API (title template, description,
 *   canonical, OG/Twitter, en_GB locale)
 * - site-wide Organization + WebSite JSON-LD with SearchAction
 * - consent layer (consent-manager port): banner/modal/shield + consent-gated
 *   GA4 (base.html parity - no consent → nothing loads)
 */
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: 'ScholarHub Africa - Scholarships for African Students',
    template: '%s - ScholarHub Africa',
  },
  description: site.tagline,
  alternates: { canonical: '/' },
  openGraph: {
    siteName: site.name,
    title: `${site.name} - ${site.tagline}`,
    description: site.tagline,
    type: 'website',
    url: site.url,
    locale: 'en_GB',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${site.name} - ${site.tagline}`,
    description: site.tagline,
    images: ['/og-image.png'],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
};

const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': `${site.url}/#organization`,
      name: site.name,
      url: `${site.url}/`,
      logo: `${site.url}/og-image.png`,
      email: site.email,
      telephone: site.phone,
      address: {
        '@type': 'PostalAddress',
        streetAddress: site.address,
        addressLocality: 'Nairobi',
        addressCountry: 'KE',
      },
      openingHours: 'Mo-Fr 09:00-18:00',
      sameAs: [],
    },
    {
      '@type': 'WebSite',
      '@id': `${site.url}/#website`,
      url: `${site.url}/`,
      name: site.name,
      publisher: { '@id': `${site.url}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${site.url}/scholarships/?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Server-side: load the banner config (DB overrides merged over defaults;
  // returns DEFAULT_CONFIG before the Phase 2 migration).
  const config = await getConfig();

  return (
    <html lang="en" className="scroll-smooth h-full">
      {/* Apply persisted theme before first paint to avoid flash */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{const t=localStorage.getItem('sh-theme');if(t)document.documentElement.setAttribute('data-theme',t);}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-accent/30 transition-colors duration-500">
        {/* Skip-to-content — visible only on keyboard focus */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-lg focus:ring-2 focus:ring-accent"
        >
          Skip to main content
        </a>
        <AuthSessionProvider>
        <ConsentProvider config={config}>
          <Navbar />
          <main id="main-content" className="flex-grow">{children}</main>
          <Footer />
          <ChatWidget />
          <Analytics ga4Id={site.ga4MeasurementId} />
          {/* Site-wide structured data (SEO track 1.3 - parity with base.html) */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }}
          />
        </ConsentProvider>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
