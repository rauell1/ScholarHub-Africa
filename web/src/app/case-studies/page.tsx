import type { Metadata } from 'next';
import Link from 'next/link';

import { Breadcrumbs } from '@/components/scholarships/Breadcrumbs';
import { site } from '@/lib/site';

/**
 * Case study (port of templates/pages/case_study.html + the study data from
 * apps/pages/views.py) with Article JSON-LD.
 */
export const metadata: Metadata = {
  title: 'Case study - DAAD EPOS scholarship',
  description:
    'A renewable-energy professional with four years of experience and a history of missed deadlines used ScholarHub Africa to go from scattered notes to a fully funded MSc offer in Germany.',
  alternates: { canonical: '/case-studies/' },
};

const STUDY = {
  slug: 'daad-epos-rem',
  title: 'From 45 listings to one offer: how Roy landed the DAAD EPOS scholarship',
  eyebrow: 'Case study · Application tracking',
  summary:
    'A renewable-energy professional with four years of experience and a history of missed deadlines used ScholarHub Africa to go from scattered notes to a fully funded MSc offer in Germany.',
  client_background: [
    "Roy Okola Otieno, a Kenyan engineer with a BSc in Mechanical Engineering and 4 years of experience in the renewable energy sector.",
    "Goal: a fully funded international master's in renewable energy management, ideally in Germany, without paying application fees out of pocket.",
  ],
  challenge: [
    'Information was scattered across a dozen spreadsheets, bookmarked pages and WhatsApp forwards - deadlines kept getting missed.',
    'Eligibility rules (DAAD "two years of experience", English thresholds, age limits) were hard to compare quickly across programmes.',
    'No central place to track document readiness; transcripts and references were only started after a deadline had already slipped.',
  ],
  solution: [
    'Used the directory filters (country = Germany, funding = full, field = Renewable Energy) to shortlist 14 viable programmes in minutes.',
    'Relied on the 0–100 fit score to rank applications: DAAD EPOS – REM scored 93 and went to the top of the list.',
    'Moved every shortlisted programme through the application tracker (planning → drafting → submitted) and used the 24-item checklist to prepare transcripts, references and the DAAD motivation documents early.',
    'The Monday email digest kept the 31 October deadline visible with live countdowns, so nothing slipped again.',
  ],
  results: [
    { value: '14', label: 'applications tracked in one dashboard' },
    { value: '3', label: 'applications submitted before their deadlines' },
    { value: '2', label: 'interviews secured' },
    { value: '1', label: 'fully funded offer - DAAD EPOS, TH Köln' },
  ],
  quote: {
    text: 'The score badge changed everything. I stopped applying to everything and started applying to what fit - the tracker made it feel like a project I could actually win.',
    author: 'Roy Okola Otieno',
    role: 'Founder, ScholarHub Africa',
  },
  next: {
    title: 'Start your own case study',
    text: 'The same tools are waiting for you - free.',
    cta: 'Browse scholarships',
    url: '/scholarships/',
  },
};

const articleJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: STUDY.title,
  description: STUDY.summary,
  author: { '@type': 'Person', name: STUDY.quote.author },
  publisher: {
    '@type': 'Organization',
    name: site.name,
    logo: { '@type': 'ImageObject', url: `${site.url}/og-image.png` },
  },
  mainEntityOfPage: `${site.url}/case-studies/`,
  datePublished: '2026-08-10',
};

export default function CaseStudyPage() {
  return (
    <article>
      <header className="bg-background py-10 border-b border-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <Breadcrumbs
            items={[
              { name: 'Home', href: '/' },
              { name: 'Resources' },
            ]}
            current="Case study"
          />
          <p className="mt-4 text-xs font-bold uppercase tracking-widest text-teal">{STUDY.eyebrow}</p>
          <h1 className="mt-2 text-2xl font-extrabold leading-tight sm:text-3xl">{STUDY.title}</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">{STUDY.summary}</p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <section className="mb-8">
          <h2 className="section-title"><span className="text-teal">1.</span> Client background</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            {STUDY.client_background.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1 text-teal" aria-hidden="true">▸</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="section-title"><span className="text-amber">2.</span> The challenge</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            {STUDY.challenge.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1 text-amber" aria-hidden="true">▸</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="section-title"><span className="text-sky">3.</span> The solution</h2>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
            {STUDY.solution.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1 text-sky" aria-hidden="true">▸</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="section-title"><span className="text-forest">4.</span> The results</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {STUDY.results.map((result) => (
              <div key={result.label} className="card text-center">
                <p className="text-3xl font-extrabold text-teal">{result.value}</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{result.label}</p>
              </div>
            ))}
          </div>
        </section>

        <blockquote className="my-8 rounded-2xl bg-teal-light p-6">
          <p className="text-base font-medium leading-relaxed text-foreground">“{STUDY.quote.text}”</p>
          <footer className="mt-3 text-sm font-bold text-foreground">
            - {STUDY.quote.author},{' '}
            <span className="font-normal text-muted-foreground">{STUDY.quote.role}</span>
          </footer>
        </blockquote>

        <section className="card flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <h2 className="text-lg font-bold text-foreground">{STUDY.next.title}</h2>
            <p className="text-sm text-muted-foreground">{STUDY.next.text}</p>
          </div>
          <Link href={STUDY.next.url} className="btn-primary shrink-0">
            {STUDY.next.cta} →
          </Link>
        </section>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
    </article>
  );
}
