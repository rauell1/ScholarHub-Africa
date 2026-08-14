import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Breadcrumbs } from '@/components/scholarships/Breadcrumbs';
import { Countdown } from '@/components/scholarships/Countdown';
import { EligibilityBadge } from '@/components/scholarships/EligibilityBadge';
import { ScoreBadge } from '@/components/scholarships/ScoreBadge';
import { TrackButton } from '@/components/scholarships/TrackButton';
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

export const revalidate = 3600;

const truncate = (value: string, length: number) =>
  value.length > length ? `${value.slice(0, length - 1)}…` : value;

export async function generateStaticParams() {
  try {
    const rows = await getSitemapScholarships();
    return rows.map((row) => ({ slug: row.slug }));
  } catch {
    return []; 
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
      images: [{ url: `${site.url}/api/og/${detail.slug}`, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${detail.name} - Score ${detail.score}/100`,
      description: truncate(detail.notes, 155),
      images: [`${site.url}/api/og/${detail.slug}`],
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
    <main className="min-h-screen bg-background pb-16">
      {/* Dynamic Hero Section */}
      <section className="relative overflow-hidden border-b border-border/40 bg-gradient-to-b from-primary/5 via-background to-background pt-8 pb-16">
        {/* Abstract decorative blobs */}
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-12 -right-12 h-64 w-64 rounded-full bg-teal/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <Breadcrumbs
            items={[
              { name: 'Home', href: '/' },
              { name: 'Scholarships', href: '/scholarships/' },
            ]}
            current={detail.short_name || detail.name}
          />
          <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-4xl">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 rounded-full bg-background/50 px-3 py-1.5 shadow-sm backdrop-blur-sm ring-1 ring-border/50">
                  <span className="text-xl" aria-hidden="true">{detail.country.flag_emoji}</span>
                  <span className="text-sm font-semibold text-foreground">{detail.country.name}</span>
                </div>
                <EligibilityBadge code={detail.eligibility_label} />
                <ScoreBadge score={detail.score} />
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {statusLabel(detail.status)}
                </span>
              </div>
              <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.1]">
                {detail.name}
              </h1>
              {detail.university && (
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0v6m0-6l-9 5m9-5l9 5" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{detail.university}</p>
                    {detail.programme && <p className="text-sm text-muted-foreground">{detail.programme}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-3">
          {/* Main column */}
          <div className="space-y-8 lg:col-span-2">
            
            {/* Overview / Notes */}
            <div className="group relative overflow-hidden rounded-3xl border border-border/50 bg-background/50 p-8 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              <div className="relative">
                <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
                  <span className="text-2xl">✨</span> Overview
                </h2>
                <div className="prose prose-zinc mt-6 max-w-none text-muted-foreground prose-headings:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline prose-strong:text-foreground">
                  {detail.notes ? (
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {detail.notes}
                    </ReactMarkdown>
                  ) : (
                    <p>No notes yet - check the official link below.</p>
                  )}
                </div>

                {detail.action_required && (
                  <div className="mt-8 rounded-2xl bg-amber/10 p-5 ring-1 ring-amber/20">
                    <h3 className="flex items-center gap-2 text-sm font-bold text-amber-700 dark:text-amber-400">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Action required
                    </h3>
                    <p className="mt-2 text-sm text-amber-800 dark:text-amber-200/80">{detail.action_required}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Funding */}
            <div className="overflow-hidden rounded-3xl border border-border/50 bg-background/50 p-8 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
              <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
                <span className="text-2xl">💰</span> Funding Details
              </h2>
              <dl className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-muted/50 p-5 ring-1 ring-border/50">
                  <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Type</dt>
                  <dd className="mt-2 text-lg font-semibold text-foreground">{fundingLabel(detail.funding_type)}</dd>
                </div>
                {detail.funding_detail && (
                  <div className="rounded-2xl bg-muted/50 p-5 ring-1 ring-border/50">
                    <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">What&apos;s covered</dt>
                    <dd className="mt-2 font-medium text-foreground">{detail.funding_detail}</dd>
                  </div>
                )}
                {detail.application_fee && detail.application_fee !== '0.00' && detail.application_fee !== '0' && (
                  <div className="rounded-2xl bg-muted/50 p-5 ring-1 ring-border/50">
                    <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Application fee</dt>
                    <dd className="mt-2 text-lg font-semibold text-foreground">
                      {detail.application_fee} {detail.currency}
                    </dd>
                  </div>
                )}
                {detail.deadline_notes && (
                  <div className="rounded-2xl bg-muted/50 p-5 ring-1 ring-border/50">
                    <dt className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Deadline note</dt>
                    <dd className="mt-2 font-medium text-foreground">{detail.deadline_notes}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Eligibility */}
            <div className="overflow-hidden rounded-3xl border border-border/50 bg-background/50 p-8 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
              <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
                <span className="text-2xl">🎯</span> Eligibility Criteria
              </h2>
              <div className="mt-6 space-y-6">
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary ring-1 ring-primary/20">
                    {eligibilityLabel(detail.eligibility_label)}
                  </span>
                  {detail.age_max != null && (
                    <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium text-foreground ring-1 ring-border/50">
                      Max age: {detail.age_max}
                    </span>
                  )}
                  {detail.experience_years_min != null && (
                    <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium text-foreground ring-1 ring-border/50">
                      Min exp: {detail.experience_years_min} yrs
                    </span>
                  )}
                  {detail.gpa_minimum != null && (
                    <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium text-foreground ring-1 ring-border/50">
                      Min GPA: {detail.gpa_minimum}
                    </span>
                  )}
                  {detail.cycle_year != null && (
                    <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm font-medium text-foreground ring-1 ring-border/50">
                      Cycle: {detail.cycle_year}
                    </span>
                  )}
                </div>
                
                <dl className="grid gap-6 sm:grid-cols-2">
                  {detail.nationality_notes && (
                    <div className="rounded-2xl border border-border/50 p-4">
                      <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Nationality
                      </dt>
                      <dd className="mt-2 font-medium text-foreground">{detail.nationality_notes}</dd>
                    </div>
                  )}
                  {detail.english_requirement && (
                    <div className="rounded-2xl border border-border/50 p-4">
                      <dt className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                        </svg>
                        English Requirement
                      </dt>
                      <dd className="mt-2 font-medium text-foreground">{detail.english_requirement}</dd>
                    </div>
                  )}
                </dl>

                {detail.mba_impact !== 'none' && (
                  <div className="rounded-2xl bg-gradient-to-r from-crimson/10 to-transparent p-5 ring-1 ring-crimson/20">
                    <dt className="text-sm font-bold tracking-wide text-crimson">
                      MBA impact: {mbaLabel(detail.mba_impact)}
                    </dt>
                    <dd className="mt-1 font-medium text-foreground">
                      {detail.mba_notes || 'Confirm with the programme directly.'}
                    </dd>
                  </div>
                )}
              </div>
            </div>

            {/* Fields of study */}
            {detail.fields && detail.fields.length > 0 && (
              <div className="overflow-hidden rounded-3xl border border-border/50 bg-background/50 p-8 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
                <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
                  <span className="text-2xl">📚</span> Fields of Study
                </h2>
                <div className="mt-6 flex flex-wrap gap-2">
                  {detail.fields.map((fieldSlug) => (
                    <a
                      key={fieldSlug}
                      href={`/scholarships/?field=${fieldSlug}`}
                      className="rounded-full bg-teal/10 px-4 py-2 text-sm font-medium text-teal ring-1 ring-teal/20 transition-all hover:bg-teal hover:text-white"
                    >
                      {fieldSlug.replace(/-/g, ' ')}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Change History */}
            {changeLogs.length > 0 && (
              <div className="overflow-hidden rounded-3xl border border-border/50 bg-background/50 p-8 shadow-sm backdrop-blur-xl transition-all hover:shadow-md">
                <h2 className="flex items-center gap-2 text-xl font-bold text-foreground">
                  <span className="text-2xl">🕓</span> Change History
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Transparency: every edit is logged, so you know the data is current.
                </p>
                <div className="mt-6 space-y-3">
                  {changeLogs.map((log) => (
                    <div
                      key={`${log.changedAt.toISOString()}-${log.fieldChanged}`}
                      className="flex items-start justify-between gap-4 rounded-2xl border border-border/30 bg-muted/30 p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="text-sm">
                        <span className="font-semibold text-foreground">
                          {log.fieldChanged ? log.fieldChanged.charAt(0).toUpperCase() + log.fieldChanged.slice(1) : 'Update'}
                        </span>{' '}
                        {log.oldValue && (
                          <>
                            <span className="text-muted-foreground line-through opacity-70">{log.oldValue.slice(0, 40)}</span>{' '}
                            <span className="text-muted-foreground">→</span>{' '}
                          </>
                        )}
                        <span className="font-medium text-forest">{log.newValue.slice(0, 40)}</span>
                      </div>
                      <span className="shrink-0 whitespace-nowrap text-xs font-medium text-muted-foreground">
                        {formatDateEat(log.changedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sticky action panel */}
          <aside className="lg:col-span-1">
            <div className="sticky top-24 flex flex-col gap-6">
              
              {/* Application Card */}
              <div className="overflow-hidden rounded-3xl border border-border/50 bg-background/80 p-6 shadow-lg shadow-primary/5 backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <h2 className="text-lg font-bold text-foreground">Application</h2>
                  <Countdown
                    deadline={detail.deadline_date}
                    initialText={deadline.text}
                    className={deadline.className}
                  />
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">Status</span>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-sm font-bold text-primary">
                    {statusLabel(detail.status)}
                  </span>
                </div>
                
                {detail.days_until_deadline != null && (
                  <p className="mt-3 text-center text-sm font-medium text-muted-foreground">
                    {detail.days_until_deadline} days remaining
                  </p>
                )}

                <div className="mt-6 space-y-3">
                  <TrackButton scholarshipId={detail.id} slug={detail.slug} />

                  {detail.official_link && (
                    <a
                      href={detail.official_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-primary/20 bg-primary/5 px-4 py-3 text-sm font-bold text-primary transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground"
                    >
                      Official Link
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>

                <div className="mt-6 rounded-2xl bg-muted/50 p-4 text-sm">
                  {detail.is_verified ? (
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-forest">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-forest">Human-verified</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatDateEat(detail.verified_at)} {detail.verified_source && `via ${detail.verified_source}`}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 text-amber-500">
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-bold text-amber-600 dark:text-amber-500">Not verified</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">Cross-check official site before applying.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between rounded-2xl bg-primary/5 p-4 ring-1 ring-primary/10">
                  <div className="space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Score</p>
                    <p className="text-sm font-medium text-foreground">{scoreLabel(detail.score)} fit</p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-black text-primary-foreground shadow-md">
                    {detail.score}
                  </div>
                </div>
              </div>

              {/* Related */}
              {related.length > 0 && (
                <div className="overflow-hidden rounded-3xl border border-border/50 bg-background/80 p-6 shadow-lg shadow-primary/5 backdrop-blur-xl">
                  <h2 className="text-lg font-bold text-foreground">🔗 Similar Programmes</h2>
                  <div className="mt-4 space-y-3">
                    {related.map((item) => (
                      <Link
                        key={item.id}
                        href={`/scholarships/${item.slug}/`}
                        className="group flex flex-col gap-2 rounded-2xl border border-border/30 bg-muted/30 p-4 transition-all hover:border-teal/30 hover:bg-teal/5"
                      >
                        <span className="font-semibold text-foreground transition-colors group-hover:text-teal">
                          {item.short_name || item.name}
                        </span>
                        <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                          <span>{item.country.flag_emoji} {item.country.name}</span>
                          <span className="h-1 w-1 rounded-full bg-border" />
                          <span>{item.score}/100 Score</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        </div>
      </section>

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(monetaryGrantJsonLd) }}
      />
    </main>
  );
}
