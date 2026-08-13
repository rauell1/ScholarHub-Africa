import Link from 'next/link';

import { Logo } from '@/components/Logo';

const EXPLORE_LINKS = [
  { href: '/scholarships/', label: 'All scholarships' },
  { href: '/scholarships/country/', label: 'Browse by country' },
  { href: '/scholarships/field/', label: 'Browse by field' },
  { href: '/case-studies/', label: 'Case studies' },
  { href: '/tracker/', label: 'Application tracker' },
];

const COMPANY_LINKS = [
  { href: '/about/', label: 'About us' },
  { href: '/faq/', label: 'FAQ' },
  { href: '/contact/', label: 'Contact & directions' },
  { href: '/privacy/', label: 'Privacy Policy' },
];

function IconCheck() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0 text-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16" style={{ background: '#0f172a' }}>
      {/* Teal accent bar */}
      <div className="h-[3px] w-full" style={{ background: 'linear-gradient(90deg, #14b8a6 0%, #0e9488 60%, transparent 100%)' }} />

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Brand */}
        <div className="space-y-4">
          <Logo variant="dark" />

          <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Fully-funded international master&apos;s scholarships for African students. Every record is human-verified against official sources.
          </p>

          <div
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
            style={{ background: 'rgba(20,184,166,0.12)', color: '#14b8a6', border: '1px solid rgba(20,184,166,0.2)' }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: '#14b8a6', boxShadow: '0 0 6px #14b8a6' }}
            />
            133 scholarships &middot; 40+ countries
          </div>
        </div>

        {/* Explore */}
        <div>
          <h2
            className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em]"
            style={{ color: '#14b8a6' }}
          >
            Explore
          </h2>
          <ul className="space-y-2.5">
            {EXPLORE_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="group inline-flex items-center gap-1 text-sm transition-colors duration-200"
                  style={{ color: 'rgba(255,255,255,0.60)' }}
                >
                  <span className="group-hover:text-white transition-colors duration-200">{link.label}</span>
                  <svg
                    className="h-3 w-3 opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
                    style={{ color: '#14b8a6' }}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h2
            className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em]"
            style={{ color: '#14b8a6' }}
          >
            Company
          </h2>
          <ul className="space-y-2.5">
            {COMPANY_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="group inline-flex items-center gap-1 text-sm transition-colors duration-200"
                  style={{ color: 'rgba(255,255,255,0.60)' }}
                >
                  <span className="group-hover:text-white transition-colors duration-200">{link.label}</span>
                  <svg
                    className="h-3 w-3 opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
                    style={{ color: '#14b8a6' }}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Trust & Data */}
        <div>
          <h2
            className="mb-4 text-[11px] font-bold uppercase tracking-[0.12em]"
            style={{ color: '#14b8a6' }}
          >
            Trust &amp; Data
          </h2>
          <ul className="space-y-3">
            <li className="flex items-start gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
              <IconCheck />
              <span>Every entry shows a <span className="font-semibold text-white">verification date</span> and official source link</span>
            </li>
            <li className="flex items-start gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
              <IconRefresh />
              <span>Deadlines reviewed weekly</span>
            </li>
            <li className="flex items-start gap-2.5 text-sm" style={{ color: 'rgba(255,255,255,0.60)' }}>
              <IconLock />
              <span>Your application data is private</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-5 sm:flex-row sm:px-6"
        style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
      >
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
          © {year} ScholarHub Africa
        </p>
        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
          Built for Roy, and every African student after him.
        </p>
      </div>
    </footer>
  );
}
