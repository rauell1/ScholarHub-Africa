import Link from 'next/link';

/**
 * Custom 404 - port of templates/404.html (branded, helpful, keeps users on site).
 */
export default function NotFound() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <div className="mx-auto w-64" role="img" aria-label="Illustration of a lost graduation cap searching with a magnifying glass">
        <svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <circle cx="100" cy="75" r="58" fill="#D6EAF8" />
          <circle cx="100" cy="75" r="46" fill="#A3E8DA" />
          <circle cx="88" cy="62" r="18" fill="none" stroke="#1F3864" strokeWidth="6" />
          <line x1="101" y1="75" x2="118" y2="92" stroke="#1F3864" strokeWidth="7" strokeLinecap="round" />
          <path d="M40 52 L90 34 L140 52 L90 70 Z" fill="#1ABC9C" />
          <path d="M58 60 v18 q32 16 64 0 v-18" fill="none" stroke="#1F3864" strokeWidth="4" strokeLinejoin="round" />
          <line x1="90" y1="34" x2="90" y2="52" stroke="#1F3864" strokeWidth="4" />
          <text x="150" y="40" fontSize="22" fill="#F39C12" fontFamily="sans-serif" fontWeight="bold">?</text>
          <text x="36" y="118" fontSize="18" fill="#C0392B" fontFamily="sans-serif" fontWeight="bold">?</text>
        </svg>
      </div>

      <p className="mt-6 text-sm font-bold uppercase tracking-widest text-teal">Error 404</p>
      <h1 className="mt-2 text-2xl font-extrabold text-foreground sm:text-3xl">Oops - this page wandered off</h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
        The page you&apos;re looking for doesn&apos;t exist or has moved. Your scholarship is still out
        there, though - let&apos;s find it.
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <Link href="/" className="btn-primary">← Back to homepage</Link>
        <Link href="/scholarships/" className="btn-outline">Browse scholarships</Link>
      </div>

      <div className="mx-auto mt-8 max-w-sm">
        <form action="/scholarships/" role="search" aria-label="Search scholarships">
          <input
            type="search"
            name="q"
            placeholder='Try "DAAD" or "Germany"…'
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-2 focus:ring-teal/50"
            aria-label="Search scholarships"
          />
        </form>
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Popular shortcuts:{' '}
        <Link href="/scholarships/country/" className="text-teal underline">By country</Link> ·{' '}
        <Link href="/scholarships/field/" className="text-teal underline">By field</Link> ·{' '}
        <Link href="/faq/" className="text-teal underline">FAQ</Link> ·{' '}
        <Link href="/contact/" className="text-teal underline">Contact</Link>
      </p>
    </section>
  );
}
