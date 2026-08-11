import Link from 'next/link';

/**
 * Sticky mobile CTA (port of components/sticky_cta.html, UX checklist #6).
 * Fixed to the bottom of the viewport on mobile only.
 */
export function StickyCta() {
  return (
    <div className="sticky-cta" aria-label="Quick actions">
      <Link href="/scholarships/" className="btn-primary flex-1 justify-center py-3">
        🎓 Find my scholarship
      </Link>
      <Link
        href="/scholarships/country/"
        className="btn-outline justify-center px-4 py-3"
        title="Browse by country"
        aria-label="Browse scholarships by country"
      >
        🌍
      </Link>
    </div>
  );
}
