import type { Metadata } from 'next';
import Link from 'next/link';

import { Breadcrumbs } from '@/components/scholarships/Breadcrumbs';
import { StickyCta } from '@/components/scholarships/StickyCta';

/**
 * About us (port of templates/pages/about.html + apps/pages/views.py team).
 */
export const metadata: Metadata = {
  title: 'About us',
  description:
    "Meet the team behind ScholarHub Africa - the free platform where African students find human-verified, fully-funded international master's scholarships.",
  alternates: { canonical: '/about/' },
};

const TEAM = [
  {
    name: 'Roy Okola Otieno',
    role: 'Founder & CEO',
    bio: 'Started ScholarHub Africa to solve his own search problem - hundreds of spreadsheets, missed deadlines, zero clarity. Now he builds the tool every African student needs.',
    initials: 'RO',
  },
  {
    name: 'Amara Njoroge',
    role: 'Head of Research & Verification',
    bio: 'Leads the human-verification desk. Every deadline, funding figure and eligibility rule on the platform is checked against the official source before it goes live.',
    initials: 'AN',
  },
  {
    name: 'Daniel Ochieng',
    role: 'Partnerships Lead',
    bio: 'Builds relationships with universities and scholarship bodies across Europe and Africa so the directory keeps growing with first-hand data.',
    initials: 'DO',
  },
  {
    name: 'Wanjiru Kamau',
    role: 'Product & Community',
    bio: 'Turns student feedback into shipped features and runs the community programme for applicants across the continent.',
    initials: 'WK',
  },
];

const STATS = [
  { value: '45+', label: 'Verified scholarships', tone: 'text-navy' },
  { value: '23', label: 'Countries', tone: 'text-teal' },
  { value: '24', label: 'Document checklist items', tone: 'text-amber' },
  { value: '100%', label: 'Free for students', tone: 'text-forest' },
];

export default function AboutPage() {
  return (
    <>
      <section className="bg-navy py-10 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Breadcrumbs items={[{ name: 'Home', href: '/' }]} current="About us" />
          <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">About ScholarHub Africa</h1>
          <p className="mt-2 max-w-2xl text-sm text-white/70">
            We exist for one reason: every African student deserves the same shot at a
            fully-funded international master&apos;s - without drowning in spreadsheets.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="section-title">Our story</h2>
            <p className="mt-4 text-sm leading-relaxed text-navy/70">
              ScholarHub Africa started as one student&apos;s frustration: Roy kept a dozen
              spreadsheets of scholarships, missed two deadlines in a single cycle, and
              had no way to know which programmes he actually qualified for.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-navy/70">
              So he built the tool he needed - a directory where every record is
              human-verified against official sources, scored for profile fit, and
              trackable from research to award. Today it&apos;s growing into a platform for
              the whole continent.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/scholarships/" className="btn-primary">Explore scholarships</Link>
              <Link href="/contact/" className="btn-outline">Talk to us</Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {STATS.map((stat) => (
              <div key={stat.label} className="card text-center">
                <p className={`text-3xl font-extrabold ${stat.tone}`}>{stat.value}</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-navy/50">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-16">
          <h2 className="section-title text-center">The team</h2>
          <p className="mt-2 text-center text-sm text-navy/60">
            Small team, big verification queue.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {TEAM.map((member) => (
              <article key={member.name} className="card flex flex-col items-center text-center">
                <span
                  className="avatar avatar--teal text-2xl"
                  aria-hidden="true"
                  style={{ height: '6rem', width: '6rem', fontSize: '1.75rem' }}
                >
                  {member.initials}
                </span>
                <h3 className="mt-4 font-bold text-navy">{member.name}</h3>
                <p className="text-xs font-semibold uppercase tracking-wide text-teal">{member.role}</p>
                <p className="mt-2 text-sm leading-relaxed text-navy/60">{member.bio}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <StickyCta />
    </>
  );
}
