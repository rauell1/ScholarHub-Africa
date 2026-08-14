import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How to Write a Motivation Letter That Gets You Shortlisted — ScholarHub Africa',
  description: "Scholarship committees read hundreds of letters. Here's how to write one that stands out — with a structure used by successful applicants across DAAD, Chevening, and Erasmus.",
  alternates: { canonical: '/blog/how-to-write-a-motivation-letter/' },
  openGraph: {
    title: 'How to Write a Motivation Letter That Gets You Shortlisted',
    description: "A step-by-step structure for writing a motivation letter that scholarship committees remember.",
    type: 'article',
    publishedTime: '2025-06-12',
  },
};

export default function MotivationLetterPage() {
  return (
    <article className="min-h-screen bg-background">
      <header className="border-b border-border py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <nav className="mb-6 flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link href="/blog/" className="hover:text-foreground">Blog</Link>
            <span>/</span>
            <span className="text-foreground">Motivation Letter</span>
          </nav>
          <span className="inline-flex items-center rounded-full bg-teal/10 px-2.5 py-0.5 text-[11px] font-semibold text-teal ring-1 ring-teal/20">Applications</span>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            How to Write a Motivation Letter That Gets You Shortlisted
          </h1>
          <div className="mt-4 flex items-center gap-4 font-mono text-xs text-muted-foreground">
            <time dateTime="2025-06-12">12 June 2025</time>
            <span>8 min read</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="prose prose-invert max-w-none [&>h2]:font-display [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-foreground [&>h2]:mt-10 [&>h2]:mb-4 [&>p]:text-muted-foreground [&>p]:leading-relaxed [&>p]:mb-4 [&>ul]:text-muted-foreground [&>ul]:leading-relaxed [&>ul]:mb-4 [&>ul]:list-disc [&>ul]:pl-6 [&>blockquote]:border-l-4 [&>blockquote]:border-teal [&>blockquote]:pl-4 [&>blockquote]:text-muted-foreground [&>blockquote]:italic">

          <p>
            Scholarship committees at DAAD, Chevening, and Erasmus read thousands of motivation letters every cycle. Most say the same things: &ldquo;I am passionate about development,&rdquo; &ldquo;I want to contribute to my country,&rdquo; &ldquo;I believe this scholarship will help me achieve my goals.&rdquo; These phrases are so common they have become invisible.
          </p>

          <p>
            A letter that gets you shortlisted does something different. It answers a specific question the reader has — <em>why should we fund this person, with this proposal, right now?</em> — and it answers it with evidence, not assertions.
          </p>

          <h2>The Structure That Works</h2>
          <p>
            There is no single format, but the most successful letters follow a logical progression:
          </p>
          <ul>
            <li><strong>Hook (1 paragraph):</strong> Open with a specific moment, observation, or problem — not a general statement about your passion.</li>
            <li><strong>Professional background (1–2 paragraphs):</strong> What you have done, with measurable outcomes where possible.</li>
            <li><strong>Why this programme (1 paragraph):</strong> Name specific modules, faculty, or research clusters. Show you researched the institution.</li>
            <li><strong>Why now, why you (1 paragraph):</strong> The gap between where you are and where you need to be — and how this programme closes it.</li>
            <li><strong>Impact (1 paragraph):</strong> A concrete, realistic picture of what you will do after. Avoid &ldquo;I will transform my country.&rdquo;</li>
            <li><strong>Closing (2–3 sentences):</strong> Short, confident, no summary of what you just wrote.</li>
          </ul>

          <h2>The Hook: Specificity Is Everything</h2>
          <p>
            Compare these two openers:
          </p>
          <blockquote>
            &ldquo;I have always been passionate about renewable energy and its potential to solve Africa&apos;s energy crisis.&rdquo;
          </blockquote>
          <blockquote>
            &ldquo;In 2022, I spent three months working on a mini-grid installation in Rarieda, Kenya. We connected 400 households — but the battery bank we deployed was undersized by 30% because our team lacked the tools to model demand. That gap is what I am applying to this programme to close.&rdquo;
          </blockquote>
          <p>
            The second opener does four things at once: it establishes field credibility, names a specific problem, shows self-awareness, and gives the committee a clear reason why you need the programme.
          </p>

          <h2>What Committees Are Actually Looking For</h2>
          <p>
            Different funders prioritise different things. Understanding this lets you emphasise the right evidence:
          </p>
          <ul>
            <li><strong>DAAD:</strong> Academic excellence + research potential. Name German faculty whose work connects to yours.</li>
            <li><strong>Chevening:</strong> Leadership and influence. Document instances where you changed something, led a team, or shaped policy.</li>
            <li><strong>Erasmus+:</strong> Internationalisation and cross-cultural collaboration. Emphasise experience working across borders or communities.</li>
            <li><strong>MasterCard Foundation:</strong> Service to community. Your return plan and community impact must be central, not an afterthought.</li>
          </ul>

          <h2>Common Mistakes</h2>
          <ul>
            <li>Restating your CV. The letter explains the CV, not repeats it.</li>
            <li>Generic closing paragraphs. &ldquo;I look forward to hearing from you&rdquo; adds nothing.</li>
            <li>Vague future plans. &ldquo;I will work in the public sector&rdquo; is not a plan.</li>
            <li>Over-length. 600–900 words is the sweet spot for most scholarships. Longer is rarely better.</li>
            <li>Ignoring the word limit. Submitting 1,200 words when 800 are allowed signals poor attention to instructions.</li>
          </ul>

          <h2>One Final Check</h2>
          <p>
            Before submitting, read your letter and ask: <em>could this letter have been written by someone else applying to a different scholarship for a different field?</em> If yes, it needs another draft. The goal is a letter that is unmistakably yours, about this specific programme, at this specific moment in your career.
          </p>
        </div>

        <div className="mt-12 rounded-2xl border border-border/50 bg-muted/20 p-6">
          <p className="font-bold text-foreground">Ready to find your scholarship?</p>
          <p className="mt-1 text-sm text-muted-foreground">Browse 130+ fully-funded opportunities — filtered by deadline, field, and country.</p>
          <Link href="/scholarships/" className="btn-primary mt-4 inline-block">Browse scholarships</Link>
        </div>
      </div>
    </article>
  );
}
