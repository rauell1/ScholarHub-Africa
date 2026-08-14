import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Study in France — Destination Guide for African Students',
  description: 'Eiffel Excellence Scholarship, Campus France, student visa, and costs. The complete guide for African students studying in France.',
  alternates: { canonical: '/destinations/france/' },
  openGraph: { title: 'Study in France — Destination Guide', type: 'article' },
};

export default function FrancePage() {
  return (
    <article className="min-h-screen bg-background">
      <header className="border-b border-border py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <nav className="mb-6 flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link href="/destinations/" className="hover:text-foreground">Destinations</Link>
            <span>/</span>
            <span className="text-foreground">France</span>
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-5xl" aria-hidden="true">🇫🇷</span>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">France</h1>
              <p className="mt-1 text-muted-foreground">Destination guide for African students</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: 'Tuition (public uni)', value: '€2,770/yr' },
              { label: 'Avg. monthly cost', value: '€800–1,200' },
              { label: 'Post-study work visa', value: '1 year' },
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
              { name: 'Eiffel Excellence Scholarship', detail: 'Full funding (€1,181/mo + travel + accommodation). Highly competitive. Applied through Campus France.' },
              { name: 'French Government Scholarships', detail: 'Managed by Campus France. Partial to full funding for students from francophone and other African countries.' },
              { name: 'Erasmus Mundus (French consortia)', detail: 'Multiple joint master\'s programmes use French universities as lead institution.' },
              { name: 'École Polytechnique International Scholarship', detail: 'Full funding for the international master\'s programme. Science and engineering focus.' },
            ].map((s) => (
              <li key={s.name} className="rounded-2xl border border-border/50 bg-card p-4">
                <p className="font-semibold text-foreground text-sm">{s.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">Visa &amp; Campus France</h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>African students must apply through <strong className="text-foreground">Campus France</strong> in their country before applying for a student visa. In francophone African countries, this process is mandatory and involves an interview.</p>
            <p><strong className="text-foreground">Required documents:</strong> admission letter, Campus France registration, proof of financial means (€615/month minimum), health insurance, accommodation proof.</p>
            <p>French is not required for all programmes — there are approximately 1,500 English-taught master&apos;s programmes in France.</p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">Why France?</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2"><span className="text-teal mt-0.5">✓</span>Public university tuition is among the lowest in Europe (€2,770/year for most master&apos;s).</li>
            <li className="flex gap-2"><span className="text-teal mt-0.5">✓</span>France has the largest African student population in Europe — a strong diaspora network.</li>
            <li className="flex gap-2"><span className="text-teal mt-0.5">✓</span>Grandes Écoles (HEC, Sciences Po, CentraleSupélec) are globally ranked.</li>
            <li className="flex gap-2"><span className="text-teal mt-0.5">✓</span>CAF social housing assistance available to students.</li>
          </ul>
        </section>
      </div>
    </article>
  );
}
