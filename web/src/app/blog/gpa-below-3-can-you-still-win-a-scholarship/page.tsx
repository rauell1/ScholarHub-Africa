import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'GPA Below 3.0? You Can Still Win a Scholarship — ScholarHub Africa',
  description: 'A low GPA is a hurdle, not a wall. Discover which scholarships weight research experience, professional work, and personal statements more heavily than academic scores.',
  alternates: { canonical: '/blog/gpa-below-3-can-you-still-win-a-scholarship/' },
  openGraph: {
    title: 'GPA Below 3.0? You Can Still Win a Scholarship',
    description: 'Which scholarships weight experience and potential over GPA — and how to apply strategically.',
    type: 'article',
    publishedTime: '2025-07-03',
  },
};

export default function GpaPage() {
  return (
    <article className="min-h-screen bg-background">
      <header className="border-b border-border py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <nav className="mb-6 flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link href="/blog/" className="hover:text-foreground">Blog</Link>
            <span>/</span>
            <span className="text-foreground">GPA & Scholarships</span>
          </nav>
          <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-blue-400 ring-1 ring-blue-400/20">Strategy</span>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            GPA Below 3.0? You Can Still Win a Scholarship
          </h1>
          <div className="mt-4 flex items-center gap-4 font-mono text-xs text-muted-foreground">
            <time dateTime="2025-07-03">3 July 2025</time>
            <span>6 min read</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="prose prose-invert max-w-none [&>h2]:font-display [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-foreground [&>h2]:mt-10 [&>h2]:mb-4 [&>p]:text-muted-foreground [&>p]:leading-relaxed [&>p]:mb-4 [&>ul]:text-muted-foreground [&>ul]:leading-relaxed [&>ul]:mb-4 [&>ul]:list-disc [&>ul]:pl-6">

          <p>
            The most common question we get from African students is some version of this: <em>"My GPA is 2.8 — should I even bother applying?"</em> The short answer is yes. The longer answer is: it depends on which scholarship, and how you position yourself.
          </p>

          <p>
            GPA is one signal among many. Funders use it as a proxy for academic ability, but they know that undergraduate results in Nigeria, Kenya, or Ethiopia are not directly comparable to those from European institutions. Most competitive scholarships have formal or informal mechanisms to account for this.
          </p>

          <h2>Which Scholarships Have Lower GPA Thresholds</h2>
          <p>
            These programmes either have no stated minimum, or are known to admit candidates with below-3.0 GPAs regularly:
          </p>
          <ul>
            <li><strong>MasterCard Foundation Scholars Program:</strong> Explicitly values potential and leadership over academic scores. Professional experience and community impact carry significant weight.</li>
            <li><strong>AAUW International Fellowships:</strong> No GPA minimum stated. Research proposal quality is the primary filter.</li>
            <li><strong>DAAD Development-Related Postgraduate Courses:</strong> Strong professional background (typically 2+ years) can offset a modest undergraduate result.</li>
            <li><strong>Commonwealth Shared Scholarship:</strong> Considers the "context" of your degree — quality of your institution, employment since graduation, and references.</li>
            <li><strong>Fulbright (select African countries):</strong> Holistic review. Leadership and potential are weighted alongside GPA.</li>
          </ul>

          <h2>How to Compensate for a Low GPA</h2>
          <p>
            If your GPA is below 3.0, your application must be stronger everywhere else. This is not spin — it is strategy.
          </p>
          <ul>
            <li><strong>Professional track record:</strong> Two to four years of meaningful work experience, with quantified outcomes, is the most effective counterweight to a modest undergraduate result.</li>
            <li><strong>Research output:</strong> A conference paper, a published report, or even a substantial working paper demonstrates academic capacity beyond transcript grades.</li>
            <li><strong>Upward trajectory:</strong> If your final two years were significantly stronger than your first two, highlight this explicitly. Some scholarships request term-by-term transcripts for exactly this reason.</li>
            <li><strong>Reference letters:</strong> A letter from a respected figure who can directly address your academic potential — not just your character — is far more valuable than generic praise.</li>
            <li><strong>Motivation letter:</strong> Acknowledge the GPA briefly if it is low, explain the context (illness, financial difficulty, heavy workload), and move quickly to evidence of what you have achieved since.</li>
          </ul>

          <h2>What Not to Do</h2>
          <ul>
            <li>Do not apply to programmes that explicitly require 3.5 or above and hope for the best — this wastes your time and theirs.</li>
            <li>Do not dwell on the GPA in your letter or make excuses without evidence.</li>
            <li>Do not cherry-pick your strongest semester GPA and present it as your overall result.</li>
          </ul>

          <h2>The Honest Advice</h2>
          <p>
            A 2.8 GPA does not close every door — but it does change the strategy. Focus your energy on scholarships that explicitly value experience, leadership, or community impact. Use the ScholarHub filter to find opportunities that match your profile, and apply selectively to programmes where your full application — not just your transcript — can be competitive.
          </p>
        </div>

        <div className="mt-12 rounded-2xl border border-border/50 bg-muted/20 p-6">
          <p className="font-bold text-foreground">Filter by what you bring, not just your grades</p>
          <p className="mt-1 text-sm text-muted-foreground">Browse scholarships that value professional experience and potential alongside academic results.</p>
          <Link href="/scholarships/" className="btn-primary mt-4 inline-block">Find matching scholarships</Link>
        </div>
      </div>
    </article>
  );
}
