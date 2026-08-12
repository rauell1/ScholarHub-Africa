import type { Metadata } from 'next';
import Link from 'next/link';

/**
 * Post-contact thank-you page (port of templates/pages/thank_you.html).
 */
export const metadata: Metadata = {
  title: 'Thank you',
  description:
    "Thanks for contacting ScholarHub Africa - we reply within 24 hours. Browse 45+ verified scholarships and start your application while you wait for our reply.",
  alternates: { canonical: '/thank-you/' },
  robots: { index: false, follow: false },
};

export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string }>;
}) {
  const { name } = await searchParams;

  return (
    <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <div className="card p-10 text-center">
        <div
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-forest-light text-4xl"
          aria-hidden="true"
        >
          ✅
        </div>
        <h1 className="mt-5 text-2xl font-extrabold text-foreground">
          Thank you{name ? `, ${name}` : ''}!
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Your message is on its way to our team. We reply to every message{' '}
          <strong>within 24 hours</strong> (Mon–Fri, 9:00–18:00 EAT).
        </p>

        <div className="mt-8 rounded-2xl bg-muted p-5 text-left">
          <h2 className="text-sm font-bold uppercase tracking-wide text-foreground">While you wait</h2>
          <ul className="mt-3 space-y-2.5 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span aria-hidden="true">🎓</span>
              <Link href="/scholarships/" className="text-teal underline">
                Browse 45+ verified scholarships
              </Link>{' '}
              - filter by country, field and funding.
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true">📚</span>
              <Link href="/scholarships/field/" className="text-teal underline">
                Explore scholarships by field of study
              </Link>{' '}
              - renewable energy, water, public health and more.
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true">🌍</span>
              <Link href="/scholarships/country/" className="text-teal underline">
                See opportunities by destination country
              </Link>{' '}
              - Germany, UK, Netherlands, Australia…
            </li>
            <li className="flex gap-2">
              <span aria-hidden="true">❓</span>
              <Link href="/faq/" className="text-teal underline">
                Read the FAQ
              </Link>{' '}
              - answers to the questions we hear most.
            </li>
          </ul>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/scholarships/" className="btn-primary">Back to scholarships</Link>
          <Link href="/" className="btn-outline">Go to homepage</Link>
        </div>
      </div>
    </section>
  );
}
