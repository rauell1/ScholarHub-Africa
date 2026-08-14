import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Study in the United States — Destination Guide for African Students',
  description: 'Fulbright, university fellowships, F-1 visa, OPT, and costs. The complete guide for African students studying in the USA.',
  alternates: { canonical: '/destinations/united-states/' },
  openGraph: { title: 'Study in the USA — Destination Guide', type: 'article' },
};

export default function USAPage() {
  return (
    <article className="min-h-screen bg-background">
      <header className="border-b border-border py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <nav className="mb-6 flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link href="/destinations/" className="hover:text-foreground">Destinations</Link>
            <span>/</span>
            <span className="text-foreground">United States</span>
          </nav>
          <div className="flex items-center gap-4">
            <span className="text-5xl" aria-hidden="true">🇺🇸</span>
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">United States</h1>
              <p className="mt-1 text-muted-foreground">Destination guide for African students</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: 'OPT work period', value: '1–3 years' },
              { label: 'Avg. monthly cost', value: '$1,500–3,000' },
              { label: 'Fully-funded options', value: 'Yes (selective)' },
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
              { name: 'Fulbright Foreign Student Program', detail: 'Full funding for graduate study or research. Applied through your country\'s Fulbright commission. Very competitive.' },
              { name: 'AAUW International Fellowships', detail: 'Full funding for women from outside the USA. Graduate and postdoctoral research.' },
              { name: 'University Fellowships & Assistantships', detail: 'Many US graduate programmes — especially PhD and STEM master\'s — offer full tuition waivers + stipends via teaching/research assistantships.' },
              { name: 'MasterCard Foundation Scholars (Wellesley, ASU)', detail: 'Specifically for African students. Full funding at select US partner institutions.' },
            ].map((s) => (
              <li key={s.name} className="rounded-2xl border border-border/50 bg-card p-4">
                <p className="font-semibold text-foreground text-sm">{s.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{s.detail}</p>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">F-1 Student Visa</h2>
          <div className="space-y-3 text-sm text-muted-foreground leading-relaxed">
            <p>You need an <strong className="text-foreground">F-1 student visa</strong> to study in the USA. Apply at the US Embassy or Consulate in your country after your university issues a Form I-20.</p>
            <p><strong className="text-foreground">SEVIS fee:</strong> $350, paid online before your visa appointment.</p>
            <p><strong className="text-foreground">Visa interview:</strong> Required at most African embassies. Bring your I-20, proof of financial support (scholarship letter or bank statements), ties to home country evidence, and university acceptance letter.</p>
            <p><strong className="text-foreground">Processing:</strong> 2–8 weeks depending on location. Book early — some African embassy slots are booked months out.</p>
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">OPT: Post-Study Work</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            After graduation, <strong className="text-foreground">Optional Practical Training (OPT)</strong> gives you 12 months of work authorisation. STEM graduates can apply for a 24-month OPT extension, giving up to 3 years total. To remain long-term, you would need an employer to sponsor an H-1B visa — a lottery-based system that has become increasingly competitive.
          </p>
        </section>

        <section>
          <h2 className="font-display text-xl font-bold text-foreground mb-4">The Realistic Cost Picture</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            The US is one of the most expensive destinations for international students. Tuition at private universities can exceed $50,000/year. The path to full funding is real — but mostly through <strong className="text-foreground">graduate assistantships</strong> (teaching or research), which cover tuition plus a living stipend of $15,000–30,000/year. These are common in STEM PhD programmes; less so in coursework-only master&apos;s. Apply to programmes that fund their graduate students, not just those with famous names.
          </p>
        </section>
      </div>
    </article>
  );
}
