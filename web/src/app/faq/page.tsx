import type { Metadata } from 'next';
import Link from 'next/link';

import { FaqAccordion, type FaqItem } from '@/components/FaqAccordion';
import { Breadcrumbs } from '@/components/scholarships/Breadcrumbs';

/**
 * FAQ (port of templates/pages/faq.html + apps/pages/views.py faqs) with
 * FAQPage JSON-LD mirroring the visible content.
 */
export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Answers about ScholarHub Africa: is it free, how are scholarships verified, who is eligible, what the 0–100 fit score means, and how the tracker works.',
  alternates: { canonical: '/faq/' },
};

const FAQS: FaqItem[] = [
  {
    question: 'Is ScholarHub Africa free to use?',
    answer:
      'Yes. Every scholarship listing, filter, score and tracking tool is completely free. We believe verified scholarship information should never be paywalled - especially for students who need it most.',
  },
  {
    question: 'How do you verify that scholarships are real and current?',
    answer:
      'Every entry is human-checked against its official source before publication. Each scholarship card shows its verification date and a link to the official website, and deadlines are re-checked weekly so you never act on stale data.',
  },
  {
    question: 'Who can use ScholarHub Africa?',
    answer:
      "The directory is open to any African student looking for fully-funded international master's opportunities. Nationality notes on each listing tell you exactly who is eligible - Kenya and most African countries are covered by the major programmes.",
  },
  {
    question: 'What does the 0–100 score mean?',
    answer:
      'The score estimates how strong a fit a scholarship is for your profile: the higher the score, the better your chances of being shortlisted. It factors in your field, experience, age limits, English requirements and competition level. Use it to prioritise where to spend your application effort.',
  },
  {
    question: 'How does the application tracker help me?',
    answer:
      'Add any scholarship to your tracker with one click, then move it through stages - planning, drafting, submitted, decision. The built-in 24-item document checklist and the Monday email digest keep your documents ready and your deadlines in front of you.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map((faq) => ({
    '@type': 'Question',
    name: faq.question,
    acceptedAnswer: { '@type': 'Answer', text: faq.answer },
  })),
};

export default function FaqPage() {
  return (
    <>
      <section className="bg-background py-10 border-b border-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <Breadcrumbs items={[{ name: 'Home', href: '/' }]} current="FAQ" />
          <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">Frequently asked questions</h1>
          <p className="mt-2 text-sm text-muted-foreground">Straight answers about how ScholarHub Africa works.</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <FaqAccordion faqs={FAQS} />

        <div className="mt-10 rounded-2xl bg-background p-6 text-center border border-border">
          <h2 className="font-bold text-foreground">Still curious?</h2>
          <p className="mt-1 text-sm text-muted-foreground">We answer every message within one business day.</p>
          <Link href="/contact/" className="btn-primary mt-4">Contact us</Link>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </>
  );
}
