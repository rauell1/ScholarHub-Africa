import Link from 'next/link';
import { site } from '@/lib/site';

/**
 * Breadcrumb navigation + BreadcrumbList JSON-LD
 * (port of components/breadcrumbs.html, UX checklist #5).
 */
export interface Crumb {
  name: string;
  href?: string;
}

export function Breadcrumbs({
  items,
  current,
}: {
  items: Crumb[];
  current?: string;
}) {
  const crumbs = [
    ...items,
    ...(current ? [{ name: current }] : []),
  ].map((crumb, index) => ({ ...crumb, position: index + 1 }));

  if (crumbs.length === 0) return null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: crumbs.map((crumb) => ({
      '@type': 'ListItem',
      position: crumb.position,
      name: crumb.name,
      ...(crumb.href ? { item: `${site.url}${crumb.href}` } : {}),
    })),
  };

  return (
    <>
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-navy/60">
          {crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            return (
              <li key={crumb.name} className="flex items-center gap-x-1.5">
                {crumb.href ? (
                  <Link href={crumb.href} className="transition-colors hover:text-teal">
                    {crumb.name}
                  </Link>
                ) : (
                  <span className={isLast && current ? 'font-semibold text-navy' : ''} aria-current={isLast && current ? 'page' : undefined}>
                    {crumb.name}
                  </span>
                )}
                {!isLast && (
                  <span className="text-navy/30" aria-hidden="true">
                    /
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </>
  );
}
