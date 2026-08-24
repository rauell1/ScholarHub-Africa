import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { addDays, daysUntilDeadline, deadlineDisplay, eatToday } from '@/lib/dates';

import { Countdown } from './Countdown';

/**
 * The scholarship sidebar renders the badge and, directly beneath it, a
 * server-computed "N days remaining" line from `daysUntilDeadline`. The badge
 * used to floor elapsed milliseconds against the viewer's local midnight, so
 * the two disagreed by one for all but an instant each day.
 */
describe('Countdown', () => {
  it('agrees with the days-remaining line after hydration', () => {
    const deadline = addDays(eatToday(), 68); // the DAAD EPOS case: 31 Oct
    const initial = deadlineDisplay(deadline);

    render(<Countdown deadline={deadline} initialText={initial.text} className={initial.className} />);

    // The effect has already run, so this is the post-hydration value -- the
    // one that previously dropped to 67 while the line below still said 68.
    expect(screen.getByText(`${daysUntilDeadline(deadline)} days`)).toBeInTheDocument();
  });

  it.each([1, 3, 7, 30, 68, 200])('matches daysUntilDeadline at %i days out', (offset) => {
    const deadline = addDays(eatToday(), offset);
    const initial = deadlineDisplay(deadline);

    const { unmount } = render(
      <Countdown deadline={deadline} initialText={initial.text} className={initial.className} />,
    );

    const days = daysUntilDeadline(deadline);
    // Urgent deadlines render "Nd left", the rest "N days"; either way the
    // number must be the one the sidebar line shows.
    expect(screen.getByText(new RegExp(`\\b${days}d? (days|left)`))).toBeInTheDocument();
    unmount();
  });

  it('renders CLOSED for a past deadline', () => {
    const deadline = addDays(eatToday(), -1);
    const initial = deadlineDisplay(deadline);

    render(<Countdown deadline={deadline} initialText={initial.text} className={initial.className} />);
    expect(screen.getByText('CLOSED')).toBeInTheDocument();
  });

  it('keeps the server text when there is no deadline', () => {
    render(<Countdown deadline={null} initialText="No deadline set" />);
    expect(screen.getByText('No deadline set')).toBeInTheDocument();
  });
});
