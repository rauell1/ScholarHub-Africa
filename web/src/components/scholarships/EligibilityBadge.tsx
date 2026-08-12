import { eligibilityLabel } from '@/lib/labels';

const TONES: Record<string, string> = {
  CE: 'border-accent bg-accent/10 text-accent',
  LE: 'border-accent bg-accent/10 text-accent',
  PE: 'border-amber bg-amber/10 text-amber',
  NE: 'border-crimson bg-crimson/10 text-crimson',
};

/** Eligibility badge (port of components/eligibility_badge.html). */
export function EligibilityBadge({ code }: { code: string }) {
  const tone = TONES[code] ?? 'bg-border text-foreground';
  return (
    <span className={`badge ${tone}`} title={eligibilityLabel(code)}>
      {code}
    </span>
  );
}
