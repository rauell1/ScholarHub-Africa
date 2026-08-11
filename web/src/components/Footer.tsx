import Link from 'next/link';

/**
 * Site footer - port of templates/base.html footer block.
 */
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

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-navy/10 bg-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2 text-lg font-extrabold text-navy">
            <span className="text-2xl" aria-hidden="true">🎓</span>
            <span>
              ScholarHub<span className="text-teal"> Africa</span>
            </span>
          </div>
          <p className="mt-3 text-sm text-navy/60">
            Fully-funded international master&apos;s scholarships for African students.
            Every record is human-verified against official sources.
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-navy">Explore</h2>
          <ul className="mt-3 space-y-2 text-sm text-navy/70">
            {EXPLORE_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-teal">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-navy">Company</h2>
          <ul className="mt-3 space-y-2 text-sm text-navy/70">
            {COMPANY_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="transition-colors hover:text-teal">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wide text-navy">Trust &amp; data</h2>
          <ul className="mt-3 space-y-2 text-sm text-navy/70">
            <li>
              ✅ Every entry shows a <span className="font-semibold">verification date</span> and official source link
            </li>
            <li>🔄 Deadlines reviewed weekly</li>
            <li>🔒 Your application data is private</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-navy/10 py-4 text-center text-xs text-navy/50">
        © {year} ScholarHub Africa - built for Roy, and every African student after him.
      </div>
    </footer>
  );
}
