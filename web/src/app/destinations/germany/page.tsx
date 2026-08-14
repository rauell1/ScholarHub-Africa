import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Study in Germany — Destination Guide for African Students',
  description: 'Scholarships, visa requirements, blocked accounts, health insurance, housing, and life as an African student in Germany. Complete 2025 guide.',
  alternates: { canonical: '/destinations/germany/' },
  openGraph: { title: 'Study in Germany — Destination Guide', type: 'article' },
};

export default function GermanyPage() {
  return (
    <article className="min-h-screen bg-background">
      <header className="border-b border-border py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <nav className="mb-6 flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link href="/destinations/" className="hover:text-foreground">Destinations</Link>
            <span>/</span>
            <span className="text-foreground">Germany</span>
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-5xl" aria-hidden="true">🇩🇪</span>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">Germany</h1>
              <p className="mt-1 text-muted-foreground">Destination guide for African students</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: 'Avg. monthly cost', value: '€900–1,200' },
              { label: 'Tuition (public uni)', value: 'Free' },
              { label: 'Post-study visa', value: '18 months' },
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
              { name: 'DAAD Development-Related Postgraduate Courses', detail: 'Full funding + €934/mo stipend. For applicants with 2+ years professional experience.' },
              { name: 'DAAD Helmut-Schmidt Programme', detail: 'Public policy and good governance. For professionals from developing countries.' },
              { name: 'Heinrich Böll Foundation', detail: 'Covers all costs. For socially engaged applicants committed to democratic values.' },
              { name: 'Konrad-Adenauer-Stiftung', detail: 'For excellent students with civic commitment. Monthly stipend + study allowance.' },
            ].map((s) => (
              <li key={s.name} className="rounded-2xl border border-border/50 bg-card p-4">
                <p className="font-semibold text-foreground text-sm">{s.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.detail}</p>
              </li>
            ))}
          </ul>
          <Link href="/scholarships/country/germany/" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-teal hover:underline">
            See all Germany scholarships →
          </Link>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">Visa &amp; Entry Requirements</h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>Most African nationals require a <strong className="text-foreground">national visa (Type D)</strong> to study in Germany. Apply at your nearest German embassy — book early, as appointment slots in Lagos, Nairobi, Accra, and Cairo book out 8–12 weeks in advance.</p>
            <p><strong className="text-foreground">Required documents:</strong> university admission letter, proof of financial means (scholarship letter or blocked account), health insurance, CV, language certificate (if programme is in German).</p>
            <p><strong className="text-foreground">Processing time:</strong> 4–12 weeks depending on your country. Apply well before your semester start date.</p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">The Blocked Account (Sperrkonto)</h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>Self-funded students must show a blocked account with <strong className="text-foreground">€11,208</strong> (the 2024 requirement). €934 is released to you each month.</p>
            <p>If you hold a DAAD or fully-funded scholarship, your scholarship letter typically substitutes for the blocked account — confirm with your embassy. Popular providers: <strong className="text-foreground">Fintiba, Expatrio, Coracle, Deutsche Bank</strong>.</p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">Cost of Living</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2 text-left text-muted-foreground">Expense</th>
                  <th className="px-4 py-2 text-right text-muted-foreground">Monthly (approx.)</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {[
                  ['Student dormitory', '€250–400'],
                  ['Private flat (1-room)', '€600–1,100'],
                  ['Shared flat (WG)', '€350–550'],
                  ['Health insurance', '€120–130'],
                  ['Groceries', '€200–280'],
                  ['Transport (semester ticket)', '€0–€100'],
                ].map(([item, cost]) => (
                  <tr key={item} className="border-b border-border/50">
                    <td className="px-4 py-2">{item}</td>
                    <td className="px-4 py-2 text-right font-mono">{cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">After You Arrive</h2>
          <ol className="space-y-3 text-sm text-muted-foreground list-decimal pl-5 leading-relaxed">
            <li>Register your address at the Bürgeramt (Anmeldung) within 14 days.</li>
            <li>Enrol at your university — bring your admission letter, health insurance, and Anmeldung.</li>
            <li>Open a German bank account (N26, Deutsche Bank, or Commerzbank).</li>
            <li>Book your Ausländerbehörde appointment immediately — waits in Berlin and Munich can be 6–10 weeks.</li>
          </ol>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">Post-Study Work</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            After graduation, you are entitled to an <strong className="text-foreground">18-month job-seeking visa</strong>. If you find work in your field, you qualify for the <strong className="text-foreground">EU Blue Card</strong> — a pathway to permanent residency after 21–33 months.
          </p>
        </section>

        <div className="rounded-2xl border border-border/50 bg-muted/20 p-6">
          <p className="font-bold text-foreground">Read the full guide</p>
          <p className="mt-1 text-sm text-muted-foreground">Our blog has a step-by-step guide to arriving and settling in Germany as an African student.</p>
          <Link href="/blog/study-in-germany-guide/" className="btn-primary mt-4 inline-block">Read the guide</Link>
        </div>
      </div>
    </article>
  );
}
