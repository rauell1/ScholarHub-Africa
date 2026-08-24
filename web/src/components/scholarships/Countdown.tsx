'use client';

import { useEffect, useState } from 'react';

import { deadlineDisplay } from '@/lib/dates';

/**
 * Live deadline countdown.
 *
 * Delegates to `deadlineDisplay` so the badge and the server-rendered
 * "N days remaining" line can never disagree. This previously floored the
 * elapsed milliseconds into whole 24-hour periods against the *viewer's*
 * local midnight, while the server counted calendar days in EAT -- so for
 * all but the instant of midnight the badge read one day fewer than the
 * line directly beneath it (67 vs 68 on a 31 Oct deadline).
 *
 * Re-running the shared helper on a timer keeps the value rolling over at
 * EAT midnight regardless of where the viewer is.
 */
export function Countdown({
  deadline,
  initialText,
  className,
}: {
  /** YYYY-MM-DD deadline date. */
  deadline: string | null;
  initialText: string;
  className?: string;
}) {
  const [display, setDisplay] = useState<{ text: string; className: string }>({
    text: initialText,
    className: className ?? '',
  });

  useEffect(() => {
    if (!deadline) return;

    const tick = () => setDisplay(deadlineDisplay(deadline));

    tick();
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <span className={display.className} data-deadline={deadline ?? undefined}>
      {display.text}
    </span>
  );
}
