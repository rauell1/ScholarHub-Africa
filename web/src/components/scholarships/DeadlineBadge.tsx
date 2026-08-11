import { deadlineDisplay } from '@/lib/dates';

/**
 * Server-rendered deadline badge (port of components/deadline_badge.html +
 * the deadline_class filter + countdown.js initial state). Text renders
 * server-side so bots see real content without JavaScript; the detail page
 * additionally mounts the live Countdown client component.
 */
export function DeadlineBadge({
  deadline,
  title,
}: {
  deadline: string | null;
  title?: string;
}) {
  const { text, className } = deadlineDisplay(deadline);
  return (
    <span className={className} title={title || undefined}>
      {text}
    </span>
  );
}
