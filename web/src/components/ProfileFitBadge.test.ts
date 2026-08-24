import { describe, expect, it } from 'vitest';

import { computeFit } from './ProfileFitBadge';

/** DAAD EPOS - Renewable Energy Management (CSV ID 2): Elig. CE, English required. */
const daadEpos = {
  gpa_minimum: null,
  experience_years_min: null,
  english_requirement: 'English taught; Medium of Instruction letter accepted',
  eligibility_label: 'CE',
};

describe('computeFit', () => {
  it('reports unknown, not 0%, when no criterion can be evaluated', () => {
    // The regression: CE eligibility and no recorded test score meant both
    // criteria were unknown, yet each still added to the denominator -- so the
    // badge rendered a red 0% beside an editorial score of 93.
    const { score, criteria } = computeFit({}, daadEpos);

    expect(score).toBeNull();
    expect(criteria).toHaveLength(2);
    expect(criteria.every((c) => c.met === null)).toBe(true);
  });

  it('does not let an unknown criterion drag down a known one', () => {
    // Eligibility unknown (CE), English proven: the only *known* criterion is
    // met, so the score is 100 rather than 20/55 = 36%.
    const { score } = computeFit({ has_ielts: true }, daadEpos);
    expect(score).toBe(100);
  });

  it('scores a fully known profile on the met criteria', () => {
    const scholarship = {
      gpa_minimum: '3.0',
      experience_years_min: '2',
      english_requirement: 'IELTS 6.5',
      eligibility_label: 'PE',
    };
    // 35 eligibility + 25 gpa + 20 english earned; experience known-unmet.
    const { score } = computeFit(
      { gpa: '3.4', experience_years: '1', has_toefl: true },
      scholarship,
    );
    expect(score).toBe(80);
  });

  it('still reports a genuine 0% when criteria are known and unmet', () => {
    const scholarship = {
      gpa_minimum: '3.5',
      experience_years_min: '5',
      english_requirement: '',
      eligibility_label: 'CE',
    };
    const { score } = computeFit({ gpa: '2.0', experience_years: '0' }, scholarship);
    expect(score).toBe(0);
  });

  it('counts an unmet criterion as failed rather than unknown', () => {
    const scholarship = {
      gpa_minimum: '3.5',
      experience_years_min: null,
      english_requirement: '',
      eligibility_label: 'PE',
    };
    const { score, criteria } = computeFit({ gpa: '2.0' }, scholarship);
    // 35 of 60 earned: eligibility met, GPA known and missed.
    expect(score).toBe(58);
    expect(criteria.find((c) => c.label.startsWith('GPA'))?.met).toBe(false);
  });
});
