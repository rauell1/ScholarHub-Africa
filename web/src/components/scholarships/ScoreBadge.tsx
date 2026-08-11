import { scoreLabel } from '@/lib/dates';

/**
 * Score badge (port of components/score_badge.html, System Design v1.0 §11):
 *   90+ forest-dark · 85+ forest-deep · 80+ forest · 74+ amber · 60+ sky · <60 crimson
 */
export function ScoreBadge({ score }: { score: number }) {
  const tone =
    score >= 90
      ? 'bg-forest-dark'
      : score >= 85
        ? 'bg-forest-deep'
        : score >= 80
          ? 'bg-forest'
          : score >= 74
            ? 'bg-amber'
            : score >= 60
              ? 'bg-sky'
              : 'bg-crimson';
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg ${tone} px-2 py-1 text-xs font-bold text-white`}
      title={`Profile fit: ${scoreLabel(score)}`}
    >
      {score}
      <span className="font-medium opacity-80">/100</span>
    </span>
  );
}
