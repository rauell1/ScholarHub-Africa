import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Study in the UK — Destination Guide for African Students',
  description: 'Chevening, Commonwealth, and university scholarships. Student visa, Graduate Route, and costs. The complete guide for African students studying in the UK.',
  alternates: { canonical: '/destinations/united-kingdom/' },
  openGraph: { title: 'Study in the UK — Destination Guide', type: 'article' },
};

export default function UKPage() {
  return (
    <article className="min-h-screen bg-background">
      <header className="border-b border-border py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <nav className="mb-6 flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link href="/destinations/" className="hover:text-foreground">Destinations</Link>
            <span>/</span>
            <span className="text-foreground">United Kingdom</span>
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-5xl" aria-hidden="true">🇬🇧</span>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">United Kingdom</h1>
              <p className="mt-1 text-muted-foreground">Destination guide for African students</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: 'Avg. monthly cost', value: '£1,200–1,800' },
              { label: 'Tuition (intl. masters)', value: '£15–35k/yr' },
              { label: 'Graduate Route visa', value: '2 years' },
            ].map((s) => (
              <div key={s.label} className="rounded-xl border border-border/50 bg-muted/20 p-3 text-center">
                <p className="font-bold text-foreground">{s.value}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 space-y-10">
        <section>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">Top Scholarships</h2>
          <ul className="space-y-3">
            {[
              { name: 'Chevening Scholarship', detail: 'Full tuition + £1,100+/mo living + flights + visa. For leaders with 2+ years professional experience.' },
              { name: 'Commonwealth Shared Scholarships', detail: 'Full funding for students from Commonwealth developing countries. Priority for underrepresented fields.' },
              { name: 'Rhodes Scholarship', detail: 'Two years at Oxford, fully funded. The most competitive scholarship in the world.' },
              { name: 'University-specific awards', detail: 'Oxford, Cambridge, LSE, and most Russell Group universities offer their own Africa-specific funding.' },
            ].map((s) => (
              <li key={s.name} className="rounded-2xl border border-border/50 bg-card p-4">
                <p className="font-semibold text-foreground text-sm">{s.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">Student Visa (Tier 4)</h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>You need a <strong className="text-foreground">UK Student visa</strong> (formerly Tier 4) to study in the UK. Apply online at least 3 months before your course starts.</p>
            <p><strong className="text-foreground">Required:</strong> CAS (Confirmation of Acceptance for Studies) from your university, proof of financial means (£1,334/month outside London, £1,023/month in London, for course duration), English language proof, academic qualifications.</p>
            <p><strong className="text-foreground">Healthcare surcharge:</strong> £776/year, paid upfront with your visa application. Gives you access to the NHS.</p>
            <p><strong className="text-foreground">Processing:</strong> Apply from within your country at a UKVI visa application centre. Typically 3 weeks.</p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">Cost of Living</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2 text-left text-muted-foreground">Expense</th>
                  <th className="px-4 py-2 text-right text-muted-foreground">London</th>
                  <th className="px-4 py-2 text-right text-muted-foreground">Other cities</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {[
                  ['Accommodation', '£900–1,600', '£450–800'],
                  ['Food & groceries', '£250–350', '£200–280'],
                  ['Transport', '£150–200', '£60–100'],
                  ['Phone & utilities', '£50–80', '£40–70'],
                ].map(([item, l, o]) => (
                  <tr key={item} className="border-b border-border/50">
                    <td className="px-4 py-2">{item}</td>
                    <td className="px-4 py-2 text-right font-mono">{l}</td>
                    <td className="px-4 py-2 text-right font-mono">{o}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">Graduate Route Visa</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            After graduation, the <strong className="text-foreground">Graduate Route</strong> gives you 2 years (3 for PhD graduates) to work or look for work in the UK at any skill level — no employer sponsorship required. This is a significant advantage for building UK work experience before transitioning to a Skilled Worker visa.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">Chevening: What the Selectors Look For</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Chevening selects on <strong className="text-foreground">leadership</strong>, <strong className="text-foreground">networking ability</strong>, <strong className="text-foreground">a clear career plan</strong>, and <strong className="text-foreground">return to home country</strong>. Academic results matter less than most applicants expect. The mandatory 2-year home return after the scholarship is a firm condition — if you are not willing to commit to it, Chevening is the wrong choice.
          </p>
        </section>
      </div>
    </article>
  );
}
