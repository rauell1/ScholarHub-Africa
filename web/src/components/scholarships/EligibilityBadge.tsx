import { eligibilityLabel } from '@/lib/labels';

const TONES: Record<string, string> = {
  CE: 'bg-forest text-white',
  LE: 'bg-teal text-white',
  PE: 'bg-amber text-white',
  NE: 'bg-crimson text-white',
};

/** Eligibility badge (port of components/eligibility_badge.html). */
export function EligibilityBadge({ code }: { code: string }) {
  const tone = TONES[code] ?? 'bg-crimson text-white';
  return (
    <span className={`badge ${tone}`} title={eligibilityLabel(code)}>
      {code}
    </span>
  );
}
