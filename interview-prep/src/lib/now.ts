'use client';

import { useEffect, useState } from 'react';

/**
 * The wall clock, as React state.
 *
 * `null` until mounted, on purpose and for the same reason `useCountdown` is:
 * the server has no idea what time it is in his browser, so anything derived
 * from `now` has to render neutral on the first frame or hydration disagrees.
 * Every caller must handle the null — that is the point of returning one rather
 * than seeding with a server timestamp that is already wrong.
 *
 * Default tick is a minute: everything built on this changes state on block
 * boundaries, which are whole minutes, so a second-by-second re-render would
 * buy nothing. Pass a shorter one only where the seconds are on screen.
 */
export function useNow(tickMs = 60_000): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const tick = () => setNow(new Date());
    tick();
    const id = window.setInterval(tick, tickMs);
    return () => window.clearInterval(id);
  }, [tickMs]);

  return now;
}
