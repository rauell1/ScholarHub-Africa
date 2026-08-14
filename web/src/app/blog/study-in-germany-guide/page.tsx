import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'The Complete Guide to Studying in Germany as an African Student — ScholarHub Africa',
  description: 'Visas, blocked accounts, health insurance, registration, and finding housing — everything you need to know before and after you land in Germany.',
  alternates: { canonical: '/blog/study-in-germany-guide/' },
  openGraph: {
    title: 'The Complete Guide to Studying in Germany as an African Student',
    description: 'A practical, step-by-step guide to navigating the German student visa, blocked accounts, health insurance, and arrival logistics.',
    type: 'article',
    publishedTime: '2025-09-15',
  },
};

export default function GermanyGuidePage() {
  return (
    <article className="min-h-screen bg-background">
      <header className="border-b border-border py-12">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <nav className="mb-6 flex items-center gap-2 font-mono text-xs text-muted-foreground">
            <Link href="/" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link href="/blog/" className="hover:text-foreground">Blog</Link>
            <span>/</span>
            <span className="text-foreground">Study in Germany Guide</span>
          </nav>
          <span className="inline-flex items-center rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-purple-400 ring-1 ring-purple-400/20">Destination</span>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            The Complete Guide to Studying in Germany as an African Student
          </h1>
          <div className="mt-4 flex items-center gap-4 font-mono text-xs text-muted-foreground">
            <time dateTime="2025-09-15">15 September 2025</time>
            <span>12 min read</span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="prose prose-invert max-w-none [&>h2]:font-display [&>h2]:text-xl [&>h2]:font-bold [&>h2]:text-foreground [&>h2]:mt-10 [&>h2]:mb-4 [&>p]:text-muted-foreground [&>p]:leading-relaxed [&>p]:mb-4 [&>ul]:text-muted-foreground [&>ul]:leading-relaxed [&>ul]:mb-4 [&>ul]:list-disc [&>ul]:pl-6 [&>ol]:text-muted-foreground [&>ol]:leading-relaxed [&>ol]:mb-4 [&>ol]:list-decimal [&>ol]:pl-6">

          <p>
            Germany offers some of the most generous scholarship programmes in the world, no tuition fees at public universities, and a post-study work visa that is genuinely welcoming. But navigating the German bureaucratic system from Lagos, Nairobi, or Accra is not simple. This guide covers what to do, when to do it, and what most guides miss.
          </p>

          <h2>Before You Leave Home</h2>

          <p><strong>1. The Student Visa (National Visa, Type D)</strong></p>
          <p>
            Most African countries require a national visa (Type D) to study in Germany. Apply at the German embassy in your country — book the appointment the moment you receive your university admission letter, as slots in Lagos, Nairobi, and Cairo are typically booked 8–12 weeks out.
          </p>
          <p>
            You will need: admission letter, proof of financial means (the blocked account, or your scholarship letter), health insurance, CV, motivation letter (sometimes), language certificate if your programme is in German.
          </p>

          <p><strong>2. The Blocked Account (Sperrkonto)</strong></p>
          <p>
            If you are self-funded or your scholarship does not fully cover living costs, you must open a blocked account (Sperrkonto) with a minimum of €11,208 (as of 2024). Monthly, €934 is released to you.
          </p>
          <p>
            If you hold a DAAD scholarship, the scholarship letter typically substitutes for the blocked account — confirm this with your embassy before opening one unnecessarily.
          </p>
          <p>
            Providers used by African students: Deutsche Bank, Fintiba, Expatrio, Coracle.
          </p>

          <p><strong>3. Health Insurance</strong></p>
          <p>
            Germany requires public statutory health insurance (gesetzliche Krankenversicherung) for university enrolment. Students under 30 pay approximately €120–130/month. Major providers include TK, AOK, and Barmer.
          </p>
          <p>
            You cannot enrol at your university without proof of health insurance. Set this up before or within days of arriving.
          </p>

          <h2>The First 14 Days in Germany</h2>
          <p>
            These steps must happen quickly, in roughly this order:
          </p>
          <ol>
            <li><strong>Find temporary accommodation</strong> before arriving — student dormitories (Studentenwerk) often have waiting lists. Book a hostel or short-term Airbnb as a bridge.</li>
            <li><strong>Register your address (Anmeldung)</strong> at the local Bürgeramt (residents&apos; registration office). This is a legal requirement within 14 days of arrival and is needed for almost everything else.</li>
            <li><strong>Enrol at your university</strong> — bring your admission letter, health insurance confirmation, and proof of address (the Anmeldungsbestätigung from step 2).</li>
            <li><strong>Open a German bank account</strong> — Deutsche Bank, Commerzbank, or N26 (fully online) are popular with students. You will need your passport, Anmeldung, and enrolment certificate.</li>
            <li><strong>Apply for a residence permit (Aufenthaltstitel)</strong> if staying more than 90 days. Book the appointment at the Ausländerbehörde (immigration office) immediately — wait times in Berlin, Munich, and Frankfurt can be 6–10 weeks.</li>
          </ol>

          <h2>Finding Housing</h2>
          <p>
            Housing is the hardest part of moving to Germany. The rental market in major university cities is extremely competitive.
          </p>
          <ul>
            <li><strong>Student dormitories (Wohnheim):</strong> Cheapest option (€250–400/month), but waitlists can be 1–2 semesters long. Apply the moment you accept your offer.</li>
            <li><strong>WG (shared flat, Wohngemeinschaft):</strong> The most common option for international students. Use WG-Gesucht.de and ImmobilienScout24. Most listings are posted 4–6 weeks before availability.</li>
            <li><strong>Private rent:</strong> €600–1,200/month for a one-room flat in larger cities. Cheaper in smaller university towns (Göttingen, Jena, Chemnitz).</li>
          </ul>

          <h2>What Nobody Tells You</h2>
          <ul>
            <li>Most German landlords require a Schufa credit check — as a new arrival, you have no German credit history. Some are flexible for students; bring your scholarship letter or bank statements from home.</li>
            <li>Germany runs largely on cash and bank transfers. Carry cash in the first week — not all shops, pharmacies, or public transport accept card.</li>
            <li>The semester ticket (Semesterticket) included in your student fees gives you unlimited local public transport. Worth knowing which cities include it and which do not.</li>
            <li>Germany has strict recycling rules. Your landlord will notice. There are typically 4–5 bins: glass (by colour), paper, plastic/metal, bio-waste, and residual waste.</li>
          </ul>

          <h2>Post-Study Work Visa</h2>
          <p>
            After graduation, you are entitled to an 18-month job-seeking visa (Aufenthaltserlaubnis zur Arbeitssuche). If you find a job in your field, you can apply for an EU Blue Card, which is a path to permanent residency. Germany has one of the most accessible post-study immigration pathways of any scholarship destination.
          </p>
        </div>

        <div className="mt-12 rounded-2xl border border-border/50 bg-muted/20 p-6">
          <p className="font-bold text-foreground">Find DAAD and other German scholarships</p>
          <p className="mt-1 text-sm text-muted-foreground">Filter by destination country to see all verified opportunities for Germany.</p>
          <Link href="/scholarships/country/germany/" className="btn-primary mt-4 inline-block">Scholarships in Germany</Link>
        </div>
      </div>
    </article>
  );
}
