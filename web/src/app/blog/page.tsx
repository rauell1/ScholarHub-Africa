import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog — ScholarHub Africa',
  description: 'Guides, insights, and strategy for African students applying to fully-funded international master\'s scholarships.',
  alternates: { canonical: '/blog/' },
};

const ARTICLES = [
  {
    slug: 'how-to-write-a-motivation-letter',
    title: 'How to Write a Motivation Letter That Gets You Shortlisted',
    excerpt: 'Scholarship committees read hundreds of letters. Here\'s how to write one that stands out — with a structure used by successful applicants across DAAD, Chevening, and Erasmus.',
    date: '2025-06-12',
    readTime: '8 min',
    tag: 'Applications',
  },
  {
    slug: 'gpa-below-3-can-you-still-win-a-scholarship',
    title: 'GPA Below 3.0? You Can Still Win a Scholarship',
    excerpt: 'A low GPA is a hurdle, not a wall. Discover which scholarships weight research experience, professional work, and personal statements more heavily than academic scores.',
    date: '2025-07-03',
    readTime: '6 min',
    tag: 'Strategy',
  },
  {
    slug: 'daad-vs-chevening-vs-erasmus',
    title: 'DAAD vs Chevening vs Erasmus: Which Is Right for You?',
    excerpt: 'Three of the world\'s most competitive fully-funded scholarships — compared on coverage, eligibility, application burden, and what each funder really looks for.',
    date: '2025-08-20',
    readTime: '10 min',
    tag: 'Comparison',
  },
  {
    slug: 'study-in-germany-guide',
    title: 'The Complete Guide to Studying in Germany as an African Student',
    excerpt: 'Visas, blocked accounts, health insurance, registration, and finding housing — everything you need to know before and after you land in Germany.',
    date: '2025-09-15',
    readTime: '12 min',
    tag: 'Destination',
  },
];

const TAG_COLORS: Record<string, string> = {
  Applications: 'bg-teal/10 text-teal ring-teal/20',
  Strategy: 'bg-blue-500/10 text-blue-400 ring-blue-400/20',
  Comparison: 'bg-amber/10 text-amber-500 ring-amber/20',
  Destination: 'bg-purple-500/10 text-purple-400 ring-purple-400/20',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function BlogIndexPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="border-b border-border py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">ScholarHub Blog</p>
          <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Guides &amp; Insights
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Strategy, destination guides, and application advice for African students chasing fully-funded master&apos;s scholarships.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="space-y-8">
          {ARTICLES.map((article) => (
            <article key={article.slug} className="group border-b border-border/50 pb-8 last:border-none">
              <Link href={`/blog/${article.slug}/`} className="block">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${TAG_COLORS[article.tag] ?? 'bg-muted text-muted-foreground ring-border'}`}>
                    {article.tag}
                  </span>
                  <time className="font-mono text-[11px] text-muted-foreground" dateTime={article.date}>
                    {formatDate(article.date)}
                  </time>
                  <span className="font-mono text-[11px] text-muted-foreground">{article.readTime} read</span>
                </div>
                <h2 className="mt-3 font-display text-xl font-bold text-foreground transition-colors group-hover:text-teal sm:text-2xl">
                  {article.title}
                </h2>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                  {article.excerpt}
                </p>
                <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-teal">
                  Read article
                  <svg className="h-4 w-4 translate-x-0 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </span>
              </Link>
            </article>
          ))}
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: 'ScholarHub Africa Blog',
            url: 'https://scholarhub.africa/blog/',
            description: 'Guides and insights for African students applying to international scholarships.',
            blogPost: ARTICLES.map((a) => ({
              '@type': 'BlogPosting',
              headline: a.title,
              url: `https://scholarhub.africa/blog/${a.slug}/`,
              datePublished: a.date,
            })),
          }),
        }}
      />
    </div>
  );
}
