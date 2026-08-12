import { scoreLabel } from '@/lib/dates';

/**
 * Score badge (port of components/score_badge.html, System Design v1.0 §11):
 *   90+ forest-dark · 85+ forest-deep · 80+ forest · 74+ amber · 60+ sky · <60 crimson
 */
export function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 80
      ? 'border-accent bg-accent/10 text-accent'
      : score >= 60
        ? 'border-amber bg-amber/10 text-amber'
        : 'border-crimson bg-crimson/10 text-crimson';
  return (
    <span
      className={`badge ${tone}`}
      title={`Profile fit: ${scoreLabel(score)}`}
    >
      {score}/100
    </span>
  );
}
