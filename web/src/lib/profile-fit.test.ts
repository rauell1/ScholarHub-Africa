/**
 * Unit tests for the profile-fit scoring algorithm.
 *
 * This file used to inline its own copy of `computeFit` "to avoid importing a
 * client component". The copy drifted: it kept scoring unknown criteria as
 * failures after the component stopped doing so, so it passed regardless of
 * what the real code did. One test was even named "returns 100% when the only
 * criteria is eligibility and it is unknown" while asserting 0 -- the bug
 * ratified as the spec.
 *
 * It now imports the exported function, so these are a real regression guard.
 */
import { describe, it, expect } from 'vitest';

import { computeFit } from '@/components/ProfileFitBadge';

// ── Fixtures ────────────────────────────────────────────────────────────────

const strongProfile = {
  gpa: '3.8',
  experience_years: '4',
  has_ielts: true,
  ielts_score: '7.5',
  has_toefl: false,
};

const weakProfile = {
  gpa: '2.0',
  experience_years: '0',
  has_ielts: false,
  has_toefl: false,
};

const emptyProfile = {};

/** PE = open to all African students. */
const openScholarship = {
  gpa_minimum: '3.0',
  experience_years_min: '2',
  english_requirement: 'IELTS 6.5',
  eligibility_label: 'PE',
};

/** CE = country-restricted, so eligibility cannot be decided from the profile. */
const restrictedScholarship = {
  gpa_minimum: null,
  experience_years_min: null,
  english_requirement: '',
  eligibility_label: 'CE',
};

describe('computeFit — all criteria met', () => {
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

describe('computeFit — criteria known and unmet', () => {
  it('scores low for a profile that meets no criteria', () => {
    // Eligibility is met (PE), GPA and experience known-unmet, English unknown.
    // 35 of 80 known points = 44%.
    const { score } = computeFit(weakProfile, openScholarship);
    expect(score).toBe(44);
  });

  it('marks GPA criterion as not met', () => {
    const { criteria } = computeFit(weakProfile, openScholarship);
    expect(criteria.find((c) => c.label.startsWith('GPA'))?.met).toBe(false);
  });

  it('marks experience criterion as not met', () => {
    const { criteria } = computeFit(weakProfile, openScholarship);
    expect(criteria.find((c) => c.label.includes('years experience'))?.met).toBe(false);
  });
});

describe('computeFit — unknown criteria', () => {
  it('marks criteria as null (unknown) when the profile has no data', () => {
    const { criteria } = computeFit(emptyProfile, openScholarship);
    expect(criteria.find((c) => c.label.startsWith('GPA'))?.met).toBeNull();
  });

  it('keeps eligibility true for open scholarships regardless of profile', () => {
    const { criteria } = computeFit(emptyProfile, openScholarship);
    expect(criteria.find((c) => c.label === 'Eligible nationality')?.met).toBe(true);
  });

  it('marks eligibility unknown for country-restricted scholarships', () => {
    const { criteria } = computeFit(strongProfile, restrictedScholarship);
    expect(criteria.find((c) => c.label === 'Eligible nationality')?.met).toBeNull();
  });

  it('excludes unknown criteria from the score instead of scoring them 0', () => {
    // Eligibility is the only criterion and it is unknown, so there is nothing
    // to score. This previously returned 0 -- a red "you do not qualify".
    const { score } = computeFit(strongProfile, restrictedScholarship);
    expect(score).toBeNull();
  });

  it('does not let an unknown criterion dilute a met one', () => {
    // Only eligibility is decidable and it is met: 100%, not 35/55.
    const { score } = computeFit(emptyProfile, {
      gpa_minimum: null,
      experience_years_min: null,
      english_requirement: 'IELTS 6.5',
      eligibility_label: 'PE',
    });
    expect(score).toBe(100);
  });
});

describe('computeFit — no requirements', () => {
  it('returns null rather than 100% when the scholarship states no criteria', () => {
    // Eligibility is still pushed as unknown for a CE scholarship, and nothing
    // else applies, so no fit can be computed. Claiming 100% asserted a perfect
    // match from no data.
    const { score } = computeFit(emptyProfile, {
      gpa_minimum: null,
      experience_years_min: null,
      english_requirement: '',
      eligibility_label: 'CE',
    });
    expect(score).toBeNull();
  });

  it('returns 100% for an open scholarship with no other requirements', () => {
    const { score } = computeFit(emptyProfile, {
      gpa_minimum: null,
      experience_years_min: null,
      english_requirement: '',
      eligibility_label: 'PE',
    });
    expect(score).toBe(100);
  });
});

describe('computeFit — partial match weighting', () => {
  it('weights a partial match on the known criteria only', () => {
    // GPA met (25), experience unmet (20), eligibility met (35), English
    // unknown and therefore excluded: 60 of 80 = 75%.
    const partialProfile = { gpa: '3.5', experience_years: '1', has_ielts: false, has_toefl: false };
    const { score } = computeFit(partialProfile, openScholarship);
    expect(score).toBe(75);
  });
});

describe('computeFit — English-medium education, no IELTS/TOEFL', () => {
  // This block previously documented a gap: only has_ielts/has_toefl counted,
  // so an applicant taught entirely in English had nowhere to record proof and
  // the criterion stayed unknown permanently. has_english_medium_instruction
  // closes it.
  const englishMediumProfile = {
    gpa: '2.65',
    experience_years: '3.0',
    has_ielts: false,
    has_toefl: false,
    has_english_medium_instruction: true,
  };

  it('credits English proficiency from a Medium of Instruction record', () => {
    const { criteria } = computeFit(englishMediumProfile, openScholarship);
    expect(criteria.find((c) => c.label === 'English proficiency')?.met).toBe(true);
  });

  it('still reports unknown when no proof of any kind is recorded', () => {
    const { criteria } = computeFit(
      { ...englishMediumProfile, has_english_medium_instruction: false },
      openScholarship,
    );
    expect(criteria.find((c) => c.label === 'English proficiency')?.met).toBeNull();
  });

  it('lifts the score for an otherwise unscoreable scholarship', () => {
    // CE eligibility with an English requirement and no test score was the
    // DAAD EPOS case that rendered "Not enough info": nothing was evaluable.
    // An English-medium record now makes the one decidable criterion pass.
    const daadEpos = {
      gpa_minimum: null,
      experience_years_min: null,
      english_requirement: 'English taught; Medium of Instruction letter accepted',
      eligibility_label: 'CE',
    };
    expect(computeFit({ has_english_medium_instruction: false }, daadEpos).score).toBeNull();
    expect(computeFit({ has_english_medium_instruction: true }, daadEpos).score).toBe(100);
  });
});
