'use client';

import { useEffect, useState } from 'react';

/**
 * Live deadline countdown (port of static/js/countdown.js).
 * Server-renders `initialText` (SEO-visible), then ticks client-side.
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
  const [text, setText] = useState(initialText);

  useEffect(() => {
    if (!deadline) return;
    const target = new Date(`${deadline}T00:00:00`); // local midnight (countdown.js parity)

    const tick = () => {
      const diff = target.getTime() - Date.now();
      if (diff <= 0) {
        setText('CLOSED');
        return;
      }
      const days = Math.floor(diff / 86_400_000);
      const hours = Math.floor((diff % 86_400_000) / 3_600_000);
      if (days <= 7) setText(`${days}d ${hours}h left`);
      else if (days <= 30) setText(`${days} days`);
      else setText(`${days} days`);
    };

    tick();
    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, [deadline]);

  return (
    <span className={className} data-deadline={deadline ?? undefined}>
      {text}
    </span>
  );
}
