import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Study in the Netherlands — Destination Guide for African Students',
  description: 'Orange Tulip and Holland Scholarships, student visa, costs, and life in Dutch university cities. The complete guide for African students studying in the Netherlands.',
  alternates: { canonical: '/destinations/netherlands/' },
  openGraph: { title: 'Study in the Netherlands — Destination Guide', type: 'article' },
};

export default function NetherlandsPage() {
  return (
    <article className="min-h-screen bg-background">
      <header className="border-b border-border py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <nav className="mb-6 flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link href="/destinations/" className="hover:text-foreground">Destinations</Link>
            <span>/</span>
            <span className="text-foreground">Netherlands</span>
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-5xl" aria-hidden="true">🇳🇱</span>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">Netherlands</h1>
              <p className="mt-1 text-muted-foreground">Destination guide for African students</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: 'English-taught masters', value: '750+' },
              { label: 'Avg. monthly cost', value: '€900–1,400' },
              { label: 'Orientation year visa', value: '1 year' },
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
              { name: 'Orange Tulip Scholarship', detail: 'Partial to full funding for students from select countries. Run through Dutch embassies and universities.' },
              { name: 'Holland Scholarship', detail: '€5,000 award for non-EEA students starting a bachelor\'s or master\'s. Many Dutch universities participate.' },
              { name: 'Erasmus Mundus', detail: 'Joint master\'s across 2–3 European universities. Many consortia include Dutch institutions.' },
              { name: 'NFP (Netherlands Fellowship Programmes)', detail: 'Full funding for professionals from developing countries. Managed by Nuffic.' },
            ].map((s) => (
              <li key={s.name} className="rounded-2xl border border-border/50 bg-card p-4">
                <p className="font-semibold text-foreground text-sm">{s.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">Visa Requirements</h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>African nationals require a <strong className="text-foreground">Dutch student visa (MVV + residence permit)</strong>. Your Dutch university processes the application on your behalf through the IND (Immigration and Naturalisation Service) — you do not apply independently.</p>
            <p><strong className="text-foreground">Timeline:</strong> The IND process takes approximately 4 weeks once your university submits. Your university submits after you accept your offer and pay the deposit (if any).</p>
            <p><strong className="text-foreground">Health insurance:</strong> Once you are in the Netherlands and have a BSN (citizen service number), you must take out Dutch health insurance (€130–200/month) or a student-friendly expat insurance plan.</p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">Cost of Living</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-2 text-left text-muted-foreground">Expense</th>
                  <th className="px-4 py-2 text-right text-muted-foreground">Amsterdam</th>
                  <th className="px-4 py-2 text-right text-muted-foreground">Other cities</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                {[
                  ['Room/studio rent', '€900–1,400', '€400–700'],
                  ['Groceries', '€200–280', '€180–250'],
                  ['Transport (OV-chipkaart)', '€80–150', '€60–120'],
                  ['Health insurance', '€130–200', '€130–200'],
                ].map(([item, a, o]) => (
                  <tr key={item} className="border-b border-border/50">
                    <td className="px-4 py-2">{item}</td>
                    <td className="px-4 py-2 text-right font-mono">{a}</td>
                    <td className="px-4 py-2 text-right font-mono">{o}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Housing in Amsterdam is extremely competitive. Delft, Groningen, Enschede, and Maastricht are significantly more affordable and have excellent universities.</p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">Post-Study Options</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            After graduating, you can apply for a <strong className="text-foreground">Zoekjaar (Orientation Year) visa</strong> — one year to find work or start a business, with no employer sponsorship required. If you secure a job at a recognised sponsor company, you can transition to a Highly Skilled Migrant permit, which is a pathway to a Dutch permanent residence permit after 5 years.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">Why the Netherlands?</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="text-teal mt-0.5">✓</span>750+ English-taught master's programmes — no Dutch required for most fields.</li>
            <li className="flex gap-2"><span className="text-teal mt-0.5">✓</span>Dutch people are among the most proficient English speakers in Europe.</li>
            <li className="flex gap-2"><span className="text-teal mt-0.5">✓</span>Wageningen (agriculture), TU Delft (engineering), and Erasmus (economics) are world-ranked.</li>
            <li className="flex gap-2"><span className="text-teal mt-0.5">✓</span>Strong tech ecosystem in Amsterdam and Eindhoven.</li>
            <li className="flex gap-2"><span className="text-teal mt-0.5">✓</span>Convenient travel across Europe via train and budget airlines.</li>
          </ul>
        </section>
      </div>
    </article>
  );
}
