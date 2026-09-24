'use client';

import type { RoadmapDay } from '@/content/types';
import { useNow } from '@/lib/now';
import { dayPhase, PHASE_LABEL } from '@/lib/schedule';
import s from './DayPhase.module.css';

/**
 * The live half of a day card's heading.
 *
 * The tag beside it says what the session is for and never changes; this says
 * where the clock is, and is rendered nowhere on the server — a day card that
 * flashed "Sắp tới" before correcting itself to "Đã qua" would be worse than
 * one that takes a frame to say anything.
 */
export function DayPhase({ day }: { day: RoadmapDay }) {
  const now = useNow();
  if (!now) return null;

  const phase = dayPhase(day, now);
  return (
    <span className={s.chip} data-phase={phase} suppressHydrationWarning>
      {PHASE_LABEL[phase]}
    </span>
  );
}
