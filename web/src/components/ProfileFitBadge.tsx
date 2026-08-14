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

function computeFit(profile: Record<string, unknown>, scholarship: ScholarshipCriteria): { score: number; criteria: Criterion[] } {
  const criteria: Criterion[] = [];
  let earned = 0;
  let total = 0;

  // Eligibility — PE/AA = open to all African students
  const isOpenToAll = scholarship.eligibility_label === 'PE' || scholarship.eligibility_label === 'AA';
  criteria.push({ label: 'Eligible nationality', met: isOpenToAll ? true : null });
  if (isOpenToAll) { earned += 35; total += 35; } else { total += 35; }

  // GPA
  if (scholarship.gpa_minimum) {
    const minGpa = parseFloat(scholarship.gpa_minimum);
    const userGpa = profile.gpa ? parseFloat(String(profile.gpa)) : null;
    const met = userGpa != null ? userGpa >= minGpa : null;
    criteria.push({ label: `GPA ≥ ${minGpa}`, met });
    total += 25;
    if (met) earned += 25;
  }

  // Experience
  if (scholarship.experience_years_min) {
    const minExp = parseFloat(scholarship.experience_years_min);
    const userExp = profile.experience_years ? parseFloat(String(profile.experience_years)) : null;
    const met = userExp != null ? userExp >= minExp : null;
    criteria.push({ label: `${minExp}+ years experience`, met });
    total += 20;
    if (met) earned += 20;
  }

  // English proficiency
  if (scholarship.english_requirement) {
    const hasProof = Boolean(profile.has_ielts || profile.has_toefl);
    criteria.push({ label: 'English proficiency', met: hasProof || null });
    total += 20;
    if (hasProof) earned += 20;
  }

  const score = total > 0 ? Math.round((earned / total) * 100) : 100;
  return { score, criteria };
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

  const color =
    fit.score >= 80 ? 'text-teal' :
    fit.score >= 50 ? 'text-amber-500' :
    'text-crimson';
  const bg =
    fit.score >= 80 ? 'bg-teal/10 ring-teal/20' :
    fit.score >= 50 ? 'bg-amber/10 ring-amber/20' :
    'bg-crimson/10 ring-crimson/20';

  return (
    <div className={`overflow-hidden rounded-3xl border border-border/50 p-5 backdrop-blur-xl ring-1 ${bg}`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your profile fit</p>
        <span className={`text-2xl font-black ${color}`}>{fit.score}%</span>
      </div>
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
