import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/components/scholarships/Breadcrumbs';
import { Countdown } from '@/components/scholarships/Countdown';
import { EligibilityBadge } from '@/components/scholarships/EligibilityBadge';
import { ScoreBadge } from '@/components/scholarships/ScoreBadge';
import { deadlineDisplay, formatDateEat, scoreLabel } from '@/lib/dates';
import {
  eligibilityLabel,
  fundingLabel,
  mbaLabel,
  statusLabel,
} from '@/lib/labels';
import {
  getChangeLogs,
  getRelatedScholarships,
  getScholarshipBySlug,
  getSitemapScholarships,
} from '@/lib/queries';
import { site } from '@/lib/site';

/**
 * Scholarship detail (port of templates/scholarships/detail.html).
 * Static + ISR (hourly revalidate): detail pages are the highest-value SEO
 * pages, so they render once and serve from the CDN, like Django + Cloudflare
 * caching but smarter.
 */
export const revalidate = 3600;

const truncate = (value: string, length: number) =>
  value.length > length ? `${value.slice(0, length - 1)}…` : value;

export async function generateStaticParams() {
  try {
    const rows = await getSitemapScholarships();
    return rows.map((row) => ({ slug: row.slug }));
  } catch {
    return []; // DB unavailable at build (preview) - render on demand instead
  }
}

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  let detail = null;
  try {
    detail = await getScholarshipBySlug(slug);
  } catch {
    detail = null;
  }
  if (!detail) {
    return {
      title: 'Scholarship - ScholarHub Africa',
      description: site.tagline,
      alternates: { canonical: `/scholarships/${slug}/` },
    };
  }

  const title = truncate(detail.short_name || detail.name, 42);
  const description = truncate(detail.notes || detail.name, 160);
  const url = `${site.url}/scholarships/${detail.slug}/`;

  return {
    title,
    description,
    alternates: { canonical: `/scholarships/${detail.slug}/` },
    openGraph: {
      siteName: site.name,
      title: `${detail.name} - Score ${detail.score}/100`,
      description: truncate(detail.notes, 155),
      type: 'article',
      url,
      locale: 'en_GB',
      images: [{ url: `${site.url}/og-image.png`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${detail.name} - Score ${detail.score}/100`,
      description: truncate(detail.notes, 155),
      images: [`${site.url}/og-image.png`],
    },
  };
}

export default async function ScholarshipDetailPage({ params }: { params: Params }) {
  const { slug } = await params;

  let detail = null;
  let changeLogs: Awaited<ReturnType<typeof getChangeLogs>> = [];
  let related: Awaited<ReturnType<typeof getRelatedScholarships>> = [];
  try {
    detail = await getScholarshipBySlug(slug);
    if (detail) {
      [changeLogs, related] = await Promise.all([
        getChangeLogs(detail.id, 12),
        getRelatedScholarships(slug, 3),
      ]);
    }
  } catch {
    detail = null;
  }

  if (!detail) notFound();

  const deadline = deadlineDisplay(detail.deadline_date);
  const monetaryGrantJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'MonetaryGrant',
    name: detail.name,
    description: truncate(detail.notes || detail.name, 300),
    url: `${site.url}/scholarships/${detail.slug}/`,
    funder: {
      '@type': 'Organization',
      name: detail.university || detail.name,
    },
    provider: {
      '@type': 'EducationalOrganization',
      name: detail.university || detail.name,
    },
    amount: {
      '@type': 'MonetaryAmount',
      currency: detail.currency,
      value: detail.funding_detail || detail.funding_type,
    },
    ...(detail.deadline_date ? { startDate: detail.deadline_date } : {}),
    eligibleRegion: detail.nationality_notes || 'African students',
  };

  return (
    <>
      {/* Hero */}
      <section className="bg-background border-b border-border">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <Breadcrumbs
            items={[
              { name: 'Home', href: '/' },
              { name: 'Scholarships', href: '/scholarships/' },
            ]}
            current={detail.short_name || detail.name}
          />
          <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-3xl">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="text-2xl" aria-hidden="true">{detail.country.flag_emoji}</span>
                <span className="font-semibold text-muted-foreground">{detail.country.name}</span>
                <EligibilityBadge code={detail.eligibility_label} />
                <ScoreBadge score={detail.score} />
                <span className="badge bg-foreground/10 text-muted-foreground">{statusLabel(detail.status)}</span>
              </div>
              <h1 className="text-2xl font-extrabold leading-tight sm:text-3xl">{detail.name}</h1>
              {detail.university && <p className="mt-1.5 text-muted-foreground">{detail.university}</p>}
              {detail.programme && <p className="mt-0.5 text-sm text-muted-foreground">{detail.programme}</p>}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-6 lg:col-span-2">
            <div className="card">
              <h2 className="text-lg font-bold text-foreground">Overview</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {detail.notes || 'No notes yet - check the official link below.'}
              </p>
              {detail.action_required && (
                <div className="mt-4 rounded-xl bg-amber-light p-4">
                  <h3 className="text-sm font-bold text-amber">⚡ Action required</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{detail.action_required}</p>
                </div>
              )}
            </div>

            <div className="card">
              <h2 className="text-lg font-bold text-foreground">💰 Funding</h2>
              <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                <div className="rounded-xl bg-muted p-3">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Type</dt>
                  <dd className="mt-1 font-semibold text-foreground">{fundingLabel(detail.funding_type)}</dd>
                </div>
                {detail.funding_detail && (
                  <div className="rounded-xl bg-muted p-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What&apos;s covered</dt>
                    <dd className="mt-1 font-semibold text-foreground">{detail.funding_detail}</dd>
                  </div>
                )}
                {detail.application_fee && detail.application_fee !== '0' && (
                  <div className="rounded-xl bg-muted p-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Application fee</dt>
                    <dd className="mt-1 font-semibold text-foreground">
                      {detail.application_fee} {detail.currency}
                    </dd>
                  </div>
                )}
                {detail.deadline_notes && (
                  <div className="rounded-xl bg-muted p-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Deadline note</dt>
                    <dd className="mt-1 font-semibold text-foreground">{detail.deadline_notes}</dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="card">
              <h2 className="text-lg font-bold text-foreground">🎯 Eligibility</h2>
              <dl className="mt-3 space-y-3 text-sm">
                <div className="flex flex-wrap gap-2">
                  <span className="badge bg-muted text-foreground">
                    Label: {eligibilityLabel(detail.eligibility_label)}
                  </span>
                  {detail.age_max != null && (
                    <span className="badge bg-muted text-foreground">Max age: {detail.age_max}</span>
                  )}
                  {detail.experience_years_min != null && (
                    <span className="badge bg-muted text-foreground">
                      Min experience: {detail.experience_years_min} yrs
                    </span>
                  )}
                  {detail.gpa_minimum != null && (
                    <span className="badge bg-muted text-foreground">Min GPA: {detail.gpa_minimum}</span>
                  )}
                  {detail.cycle_year != null && (
                    <span className="badge bg-muted text-foreground">Cycle: {detail.cycle_year}</span>
                  )}
                </div>
                {detail.nationality_notes && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nationality</dt>
                    <dd className="mt-0.5 text-muted-foreground">{detail.nationality_notes}</dd>
                  </div>
                )}
                {detail.english_requirement && (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">English requirement</dt>
                    <dd className="mt-0.5 text-muted-foreground">{detail.english_requirement}</dd>
                  </div>
                )}
                {detail.mba_impact !== 'none' && (
                  <div className="rounded-xl bg-crimson-light p-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-crimson">
                      MBA impact: {mbaLabel(detail.mba_impact)}
                    </dt>
                    <dd className="mt-0.5 text-muted-foreground">
                      {detail.mba_notes || 'Confirm with the programme directly.'}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="card">
              <h2 className="text-lg font-bold text-foreground">📚 Fields of study</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {detail.fields.map((fieldSlug) => (
                  <a
                    key={fieldSlug}
                    href={`/scholarships/?field=${fieldSlug}`}
                    className="badge bg-sky-light text-sky transition-colors hover:bg-sky hover:text-background"
                  >
                    {fieldSlug.replace(/-/g, ' ')}
                  </a>
                ))}
              </div>
            </div>

            {changeLogs.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-bold text-foreground">🕓 Change history</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Transparency: every edit is logged, so you know the data is current.
                </p>
                <ul className="mt-3 space-y-2 text-sm">
                  {changeLogs.map((log) => (
                    <li
                      key={`${log.changedAt.toISOString()}-${log.fieldChanged}`}
                      className="flex items-start justify-between gap-3 rounded-lg bg-muted px-3 py-2"
                    >
                      <span className="text-muted-foreground">
                        <span className="font-semibold text-foreground">
                          {log.fieldChanged ? log.fieldChanged.charAt(0).toUpperCase() + log.fieldChanged.slice(1) : 'Update'}
                        </span>{' '}
                        {log.oldValue && (
                          <>
                            <span className="text-muted-foreground line-through">{log.oldValue.slice(0, 40)}</span> →{' '}
                          </>
                        )}
                        <span className="text-forest">{log.newValue.slice(0, 40)}</span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDateEat(log.changedAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {related.length > 0 && (
              <div className="card">
                <h2 className="text-lg font-bold text-foreground">🔗 You might also consider</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Similar programmes - same field or destination country.
                </p>
                <div className="mt-3 space-y-2">
                  {related.map((item) => (
                    <Link
                      key={item.id}
                      href={`/scholarships/${item.slug}/`}
                      className="flex items-center justify-between gap-3 rounded-xl bg-muted px-4 py-3 transition-colors hover:bg-teal-light"
                    >
                      <span className="text-sm font-semibold text-foreground">
                        {item.short_name || item.name}
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {item.country.flag_emoji} {item.country.name} · {item.score}/100
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sticky action panel */}
          <aside className="lg:col-span-1">
            <div className="card sticky top-20 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-foreground">Application</h2>
                <Countdown
                  deadline={detail.deadline_date}
                  initialText={deadline.text}
                  className={deadline.className}
                />
              </div>

              <p className="text-sm text-muted-foreground">
                Status: <span className="font-semibold text-foreground">{statusLabel(detail.status)}</span>
                {detail.days_until_deadline != null && (
                  <> · {detail.days_until_deadline} days to deadline</>
                )}
              </p>

              {/* TODO(Phase 5): session-aware tracker CTA */}
              <Link href="/login/" className="btn-primary w-full">
                Login to track this
              </Link>

              {detail.official_link && (
                <a
                  href={detail.official_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline w-full"
                >
                  🔗 Official link ↗
                </a>
              )}

              <div className="rounded-xl bg-muted p-3 text-xs text-muted-foreground">
                {detail.is_verified ? (
                  <>
                    <p className="font-semibold text-forest">✅ Human-verified</p>
                    <p className="mt-1">Verified {formatDateEat(detail.verified_at)}</p>
                    {detail.verified_source && <p className="mt-1">Source: {detail.verified_source}</p>}
                  </>
                ) : (
                  <p className="font-semibold text-amber">⚠️ Not yet verified - cross-check before applying</p>
                )}
              </div>

              <p className="text-xs text-muted-foreground">
                Score {detail.score}/100 - {scoreLabel(detail.score)} fit.
                {detail.competitiveness && <> Competitiveness: {detail.competitiveness}.</>}
              </p>
            </div>
          </aside>
        </div>
      </section>

      {/* MonetaryGrant structured data (parity with detail.html) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(monetaryGrantJsonLd) }}
      />
    </>
  );
}
