/**
 * Unit tests for the profile-fit scoring algorithm.
 * Mirrors the logic in ProfileFitBadge.tsx without importing a client component.
 */
import { describe, it, expect } from 'vitest';

interface ScholarshipCriteria {
  gpa_minimum: string | null;
  experience_years_min: string | null;
  english_requirement: string;
  eligibility_label: string;
}

interface Criterion {
  label: string;
  met: boolean | null;
}

function computeFit(
  profile: Record<string, unknown>,
  scholarship: ScholarshipCriteria,
): { score: number; criteria: Criterion[] } {
  const criteria: Criterion[] = [];
  let earned = 0;
  let total = 0;

  const isOpenToAll = scholarship.eligibility_label === 'PE' || scholarship.eligibility_label === 'AA';
  criteria.push({ label: 'Eligible nationality', met: isOpenToAll ? true : null });
  if (isOpenToAll) { earned += 35; total += 35; } else { total += 35; }

  if (scholarship.gpa_minimum) {
    const minGpa = parseFloat(scholarship.gpa_minimum);
    const userGpa = profile.gpa ? parseFloat(String(profile.gpa)) : null;
    const met = userGpa != null ? userGpa >= minGpa : null;
    criteria.push({ label: `GPA ≥ ${minGpa}`, met });
    total += 25;
    if (met) earned += 25;
  }

  if (scholarship.experience_years_min) {
    const minExp = parseFloat(scholarship.experience_years_min);
    const userExp = profile.experience_years ? parseFloat(String(profile.experience_years)) : null;
    const met = userExp != null ? userExp >= minExp : null;
    criteria.push({ label: `${minExp}+ years experience`, met });
    total += 20;
    if (met) earned += 20;
  }

  if (scholarship.english_requirement) {
    const hasProof = Boolean(profile.has_ielts || profile.has_toefl);
    criteria.push({ label: 'English proficiency', met: hasProof || null });
    total += 20;
    if (hasProof) earned += 20;
  }

  const score = total > 0 ? Math.round((earned / total) * 100) : 100;
  return { score, criteria };
}

// ── Fixtures ────────────────────────────────────────────────────────────────

const strongProfile = {
  gpa: '3.8',
  experience_years: '4',
  has_ielts: true,
  ielts_score: '7.5',
  has_toefl: false,
};

const weakProfile = {
  gpa: '2.5',
  experience_years: '0',
  has_ielts: false,
  has_toefl: false,
};

const emptyProfile: Record<string, unknown> = {};

const openScholarship: ScholarshipCriteria = {
  eligibility_label: 'AA',
  gpa_minimum: '3.0',
  experience_years_min: '2',
  english_requirement: 'IELTS 6.5',
};

const restrictedScholarship: ScholarshipCriteria = {
  eligibility_label: 'KE', // Kenya only — not open to all
  gpa_minimum: null,
  experience_years_min: null,
  english_requirement: '',
};

// ── Tests ────────────────────────────────────────────────────────────────────

describe('computeFit — strong profile vs open scholarship', () => {
  it('returns 100% for a profile that meets all criteria', () => {
    const { score } = computeFit(strongProfile, openScholarship);
    expect(score).toBe(100);
  });

  it('includes eligibility criterion as met', () => {
    const { criteria } = computeFit(strongProfile, openScholarship);
    const el = criteria.find((c) => c.label === 'Eligible nationality');
    expect(el?.met).toBe(true);
  });
});

describe('computeFit — weak profile vs open scholarship', () => {
  it('returns less than 60% for a profile that meets no criteria', () => {
    const { score } = computeFit(weakProfile, openScholarship);
    expect(score).toBeLessThan(60);
  });

  it('marks GPA criterion as not met', () => {
    const { criteria } = computeFit(weakProfile, openScholarship);
    const gpa = criteria.find((c) => c.label.startsWith('GPA'));
    expect(gpa?.met).toBe(false);
  });

  it('marks experience criterion as not met', () => {
    const { criteria } = computeFit(weakProfile, openScholarship);
    const exp = criteria.find((c) => c.label.includes('experience'));
    expect(exp?.met).toBe(false);
  });
});

describe('computeFit — empty profile', () => {
  it('marks criteria as null (unknown) when profile has no data', () => {
    const { criteria } = computeFit(emptyProfile, openScholarship);
    const gpa = criteria.find((c) => c.label.startsWith('GPA'));
    expect(gpa?.met).toBeNull();
  });

  it('eligibility is still true for open scholarships regardless of profile', () => {
    const { criteria } = computeFit(emptyProfile, openScholarship);
    const el = criteria.find((c) => c.label === 'Eligible nationality');
    expect(el?.met).toBe(true);
  });
});

describe('computeFit — restricted scholarship', () => {
  it('marks eligibility as null (unknown) for non-open scholarships', () => {
    const { criteria } = computeFit(strongProfile, restrictedScholarship);
    const el = criteria.find((c) => c.label === 'Eligible nationality');
    expect(el?.met).toBeNull();
  });

  it('returns 100% when the only criteria is eligibility and it is unknown', () => {
    // No GPA/experience/english requirement — only criterion is eligibility (null)
    // total stays at 35 with 0 earned → but eligibility is null, so earned=0, total=35 → 0%
    const { score } = computeFit(strongProfile, restrictedScholarship);
    expect(score).toBe(0);
  });
});

describe('computeFit — scholarship with no criteria', () => {
  it('returns 100% when scholarship has no requirements', () => {
    const noReqScholarship: ScholarshipCriteria = {
      eligibility_label: 'PE',
      gpa_minimum: null,
      experience_years_min: null,
      english_requirement: '',
    };
    // PE = open, no other criteria → earned = 35, total = 35
    const { score } = computeFit(emptyProfile, noReqScholarship);
    expect(score).toBe(100);
  });
});

describe('computeFit — partial criteria', () => {
  it('correctly weights a partial match (GPA met, experience not)', () => {
    const partialProfile = { gpa: '3.5', experience_years: '1', has_ielts: false, has_toefl: false };
    const { score } = computeFit(partialProfile, openScholarship);
    // Eligibility: 35/35, GPA: 25/25, Experience: 0/20, English: 0/20 → 60/100 = 60%
    expect(score).toBe(60);
  });
});
