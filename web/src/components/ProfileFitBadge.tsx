'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface ScholarshipCriteria {
  gpa_minimum: string | null;
  experience_years_min: string | null;
  english_requirement: string;
  eligibility_label: string;
}

interface Criterion {
  label: string;
  met: boolean | null; // null = not applicable / unknown
}

export function computeFit(
  profile: Record<string, unknown>,
  scholarship: ScholarshipCriteria,
): { score: number | null; criteria: Criterion[] } {
  const criteria: Criterion[] = [];
  let earned = 0;
  let total = 0;

  /**
   * Unknown criteria are recorded for display but kept out of the score
   * entirely. They used to count toward the denominator while earning
   * nothing, so a scholarship whose eligibility is not PE/AA, viewed by
   * someone who has not entered a test score, rendered a confident red 0%
   * with every row showing "?" -- scoring the absence of information as
   * failure.
   */
  const add = (label: string, met: boolean | null, weight: number) => {
    criteria.push({ label, met });
    if (met === null) return;
    total += weight;
    if (met) earned += weight;
  };

  // Eligibility — PE/AA = open to all African students
  const isOpenToAll = scholarship.eligibility_label === 'PE' || scholarship.eligibility_label === 'AA';
  add('Eligible nationality', isOpenToAll ? true : null, 35);

  // GPA
  if (scholarship.gpa_minimum) {
    const minGpa = parseFloat(scholarship.gpa_minimum);
    const userGpa = profile.gpa ? parseFloat(String(profile.gpa)) : null;
    add(`GPA ≥ ${minGpa}`, userGpa != null ? userGpa >= minGpa : null, 25);
  }

  // Experience
  if (scholarship.experience_years_min) {
    const minExp = parseFloat(scholarship.experience_years_min);
    const userExp = profile.experience_years ? parseFloat(String(profile.experience_years)) : null;
    add(`${minExp}+ years experience`, userExp != null ? userExp >= minExp : null, 20);
  }

  // English proficiency — absence of any recorded proof is unknown, not a fail.
  // A degree taught in English counts: many funders in this dataset accept a
  // Medium of Instruction letter in place of a test (Commonwealth records
  // "no IELTS required" for Kenyan English-medium education, DAAD EPOS accepts
  // an MOI letter), and without it an English-medium applicant with no test
  // score could never satisfy this criterion.
  if (scholarship.english_requirement) {
    const hasProof = Boolean(
      profile.has_ielts || profile.has_toefl || profile.has_english_medium_instruction,
    );
    add('English proficiency', hasProof ? true : null, 20);
  }

  // Null rather than 0 or 100 when nothing is known: the badge shows a
  // neutral prompt instead of asserting a fit it cannot compute.
  return { score: total > 0 ? Math.round((earned / total) * 100) : null, criteria };
}

interface Props {
  scholarship: ScholarshipCriteria;
}

export function ProfileFitBadge({ scholarship }: Props) {
  const { status } = useSession();
  const [fit, setFit] = useState<ReturnType<typeof computeFit> | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated') return;
    setLoading(true);
    fetch('/api/v1/tracker/profile/')
      .then((r) => r.json())
      .then((profile: Record<string, unknown>) => {
        setFit(computeFit(profile, scholarship));
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [status, scholarship]);

  if (status !== 'authenticated') return null;
  if (loading) return (
    <div className="rounded-2xl border border-border/50 bg-muted/30 px-4 py-3 animate-pulse">
      <p className="text-xs text-muted-foreground">Computing your fit…</p>
    </div>
  );
  if (!fit) return null;

  // A null score means no criterion could be evaluated. Render it neutrally
  // rather than as a red 0%, which reads as "you do not qualify".
  // Held in a local so the null check narrows the number below.
  const { score } = fit;
  const color =
    score === null ? 'text-muted-foreground' :
    score >= 80 ? 'text-teal' :
    score >= 50 ? 'text-amber-500' :
    'text-crimson';
  const bg =
    score === null ? 'bg-muted/30 ring-border/50' :
    score >= 80 ? 'bg-teal/10 ring-teal/20' :
    score >= 50 ? 'bg-amber/10 ring-amber/20' :
    'bg-crimson/10 ring-crimson/20';

  return (
    <div className={`overflow-hidden rounded-3xl border border-border/50 p-5 backdrop-blur-xl ring-1 ${bg}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your profile fit</p>
        <span className={`font-black ${score === null ? 'text-sm' : 'text-2xl'} ${color}`}>
          {score === null ? 'Not enough info' : `${score}%`}
        </span>
      </div>
      {score === null && (
        <p className="mt-2 text-xs text-muted-foreground">
          Nothing below could be checked against your profile yet.
        </p>
      )}
      {fit.criteria.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {fit.criteria.map((c) => (
            <li key={c.label} className="flex items-center gap-2 text-xs">
              <span className={
                c.met === true ? 'text-teal' :
                c.met === false ? 'text-crimson' :
                'text-muted-foreground'
              }>
                {c.met === true ? '✓' : c.met === false ? '✗' : '?'}
              </span>
              <span className={c.met === false ? 'text-muted-foreground line-through' : 'text-foreground'}>
                {c.label}
              </span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-[10px] text-muted-foreground">
        Based on your profile · <a href="/accounts/profile/" className="text-teal hover:underline">Edit profile</a>
      </p>
    </div>
  );
}
