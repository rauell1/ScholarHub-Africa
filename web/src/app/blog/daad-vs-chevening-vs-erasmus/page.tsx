import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'DAAD vs Chevening vs Erasmus: Which Is Right for You? — ScholarHub Africa',
  description: "Three of the world's most competitive fully-funded scholarships — compared on coverage, eligibility, application burden, and what each funder really looks for.",
  alternates: { canonical: '/blog/daad-vs-chevening-vs-erasmus/' },
  openGraph: {
    title: 'DAAD vs Chevening vs Erasmus: Which Is Right for You?',
    description: 'A side-by-side comparison of three major fully-funded master\'s scholarships for African students.',
    type: 'article',
    publishedTime: '2025-08-20',
  },
};

const TABLE = [
  { attr: 'Funder', daad: 'German Academic Exchange Service', chev: 'UK Foreign, Commonwealth & Development Office', eras: 'European Commission' },
  { attr: 'Duration', daad: '1–2 years (programme length)', chev: '1 year', eras: '1–2 years' },
  { attr: 'Coverage', daad: 'Tuition + monthly stipend (~€934) + travel + health insurance', chev: 'Tuition + living allowance (£1,100+/mo) + flights + visa', eras: 'Tuition (up to €9,000/yr) + monthly living allowance (€1,000–2,000)' },
  { attr: 'Work experience required', daad: '2 years (Development-Related Courses)', chev: '2 years minimum', eras: 'None (bachelor\'s degree sufficient)' },
  { attr: 'GPA minimum', daad: 'Strong academic record (no hard cutoff)', chev: 'Equivalent to UK 2:1 or above', eras: 'Varies by consortium (often 3.0+)' },
  { attr: 'Return requirement', daad: 'Not required (encouraged for development courses)', chev: 'Must return home for 2 years after', eras: 'None' },
  { attr: 'Application cycle opens', daad: 'July–September (most programmes)', chev: 'August–November', eras: 'October–January (most consortia)' },
  { attr: 'Result timeline', daad: '3–4 months after deadline', chev: '9–12 months (February of award year)', eras: '3–6 months after deadline' },
];

export default function ComparisonPage() {
  return (
    <article className="min-h-screen bg-background">
      <header className="border-b border-border py-12">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <nav className="mb-6 flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link href="/blog/" className="hover:text-foreground">Blog</Link>
            <span>/</span>
            <span className="text-foreground">DAAD vs Chevening vs Erasmus</span>
          </nav>
          <span className="inline-flex items-center rounded-full bg-amber/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-500 ring-1 ring-amber/20">Comparison</span>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            DAAD vs Chevening vs Erasmus: Which Is Right for You?
          </h1>
          <div className="mt-4 flex items-center gap-4 font-mono text-xs text-muted-foreground">
            <time dateTime="2025-08-20">20 August 2025</time>
            <span>10 min read</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="prose prose-invert max-w-none [&>h2]:font-display [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-foreground [&>h2]:mt-10 [&>h2]:mb-4 [&>p]:text-muted-foreground [&>p]:leading-relaxed [&>p]:mb-4 [&>ul]:text-muted-foreground [&>ul]:leading-relaxed [&>ul]:mb-4 [&>ul]:list-disc [&>ul]:pl-6">

          <p>
            DAAD, Chevening, and Erasmus Mundus are three of the most recognised fully-funded scholarships available to African master&apos;s applicants. All three cover tuition and living costs. All three are competitive. But they are not the same scholarship — and choosing where to concentrate your application energy matters.
          </p>

          <h2>Side-by-Side Comparison</h2>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-4 py-3 text-left font-semibold text-muted-foreground w-36" />
                <th className="px-4 py-3 text-left font-semibold text-foreground">DAAD</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Chevening</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Erasmus Mundus</th>
              </tr>
            </thead>
            <tbody>
              {TABLE.map((row, i) => (
                <tr key={row.attr} className={`border-b border-border/50 ${i % 2 === 0 ? '' : 'bg-muted/10'}`}>
                  <td className="px-4 py-3 font-semibold text-muted-foreground align-top">{row.attr}</td>
                  <td className="px-4 py-3 text-muted-foreground align-top">{row.daad}</td>
                  <td className="px-4 py-3 text-muted-foreground align-top">{row.chev}</td>
                  <td className="px-4 py-3 text-muted-foreground align-top">{row.eras}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 prose prose-invert max-w-none [&>h2]:font-display [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-foreground [&>h2]:mt-10 [&>h2]:mb-4 [&>p]:text-muted-foreground [&>p]:leading-relaxed [&>p]:mb-4 [&>ul]:text-muted-foreground [&>ul]:leading-relaxed [&>ul]:mb-4 [&>ul]:list-disc [&>ul]:pl-6">

          <h2>Choose DAAD if…</h2>
          <ul>
            <li>You want to study in Germany specifically.</li>
            <li>You have 2+ years of professional experience and strong academic results.</li>
            <li>Your field aligns with development priorities (energy, water, agriculture, public health, engineering).</li>
            <li>You want a stipend rather than a reimbursement model.</li>
          </ul>

          <h2>Choose Chevening if…</h2>
          <ul>
            <li>You have a clear leadership narrative — roles where you influenced, led, or changed something.</li>
            <li>You are comfortable returning to your home country for at least two years after.</li>
            <li>You want to study in the UK.</li>
            <li>You can articulate a specific vision for what you will do with the degree.</li>
          </ul>

          <h2>Choose Erasmus Mundus if…</h2>
          <ul>
            <li>You want a truly international experience — multiple European countries in one programme.</li>
            <li>You are a recent graduate with limited work experience (no minimum required).</li>
            <li>Your field has strong Erasmus Mundus consortia (engineering, data science, environmental science, education).</li>
            <li>You do not want a home-country return obligation.</li>
          </ul>

          <h2>Can You Apply to All Three?</h2>
          <p>
            Yes — they are not mutually exclusive. Chevening requires you to apply to and receive an offer from a UK university first. DAAD and Erasmus have their own application portals. In a strong application cycle, it is reasonable to apply to all three simultaneously, adjusting your positioning for each funder.
          </p>

          <h2>The Honest Trade-off</h2>
          <p>
            Erasmus Mundus has the lowest application burden and no work experience requirement — making it the highest-leverage choice for early-career candidates. Chevening has the most competitive profile of accepted scholars but also the clearest selection criteria: leadership, leadership, leadership. DAAD is the most rewarding for candidates in technical or development-focused fields who can demonstrate professional depth.
          </p>
          <p>
            Apply to the one where your profile is strongest first. Then apply to the others if time allows.
          </p>
        </div>

        <div className="mt-12 rounded-2xl border border-border/50 bg-muted/20 p-6">
          <p className="font-bold text-foreground">Find DAAD, Chevening, and Erasmus on ScholarHub</p>
          <p className="mt-1 text-sm text-muted-foreground">All three are in our database — with verified deadlines, eligibility, and application links.</p>
          <Link href="/scholarships/" className="btn-primary mt-4 inline-block">Browse scholarships</Link>
        </div>
      </div>
    </article>
  );
}
