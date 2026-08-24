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

describe('computeFit — Roy: English-medium education, no IELTS/TOEFL', () => {
  it('cannot credit English proficiency, because only IELTS/TOEFL are recognised', () => {
    // Documents a real gap rather than asserting desired behaviour: a candidate
    // taught entirely in English has no field in which to record it, so
    // `has_ielts`/`has_toefl` stay false and the criterion stays unknown
    // forever. See the note in ProfileFitBadge about adding a medium-of-
    // instruction option.
    const royProfile = { gpa: '2.65', experience_years: '3.0', has_ielts: false, has_toefl: false };
    const { criteria } = computeFit(royProfile, openScholarship);
    expect(criteria.find((c) => c.label === 'English proficiency')?.met).toBeNull();
  });
});
