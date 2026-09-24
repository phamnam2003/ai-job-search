/**
 * Where the clock is, against the plan.
 *
 * The roadmap used to carry its own answer to that question, in the tags: one
 * day was labelled "Tối nay". It was right for one evening and wrong for every
 * hour after it, and a plan that is wrong about today is worse than no plan —
 * you stop trusting the parts that are still true. So the content now says only
 * what a session is FOR, and everything time-relative is computed here, from
 * `day.iso` plus the block's clock time.
 *
 * Pure functions on purpose: `now` is always an argument, never `new Date()`
 * read inside. That keeps this file importable from a server component and
 * leaves exactly one place — `useNow` — that has to care about hydration.
 */

import { isBreak, type RoadmapBlock, type RoadmapDay } from '@/content/types';
import { parseLocal } from '@/lib/time';

export type Phase = 'past' | 'live' | 'future';

export const PHASE_LABEL: Record<Phase, string> = {
  past: 'Đã qua',
  live: 'Đang diễn ra',
  future: 'Sắp tới',
};

export function blockStart(day: RoadmapDay, block: RoadmapBlock): Date {
  return parseLocal(`${day.iso}T${block.s}`);
}

/**
 * Start plus duration — deliberately not a parse of `e`. `m === e - s` is the
 * invariant the whole chart is drawn from, so the end used here is the same end
 * the bar widths encode; if the two ever disagreed, a silent drift between the
 * picture and the clock would be the worst possible way to find out.
 */
export function blockEnd(day: RoadmapDay, block: RoadmapBlock): Date {
  return new Date(blockStart(day, block).getTime() + block.m * 60_000);
}

function phaseBetween(start: Date, end: Date, now: Date): Phase {
  if (now.getTime() >= end.getTime()) return 'past';
  if (now.getTime() >= start.getTime()) return 'live';
  return 'future';
}

export function blockPhase(day: RoadmapDay, block: RoadmapBlock, now: Date): Phase {
  return phaseBetween(blockStart(day, block), blockEnd(day, block), now);
}

function blocksOf(day: RoadmapDay): RoadmapBlock[] {
  return day.items.filter((i): i is RoadmapBlock => !isBreak(i));
}

/**
 * A day runs from its first block to its last, gaps included: Thursday has a
 * seven-hour hole in the middle for the working day, and calling that hole
 * "finished" would flip the card to Đã qua at lunchtime.
 */
export function dayPhase(day: RoadmapDay, now: Date): Phase {
  const blocks = blocksOf(day);
  if (blocks.length === 0) return 'future';
  return phaseBetween(
    blockStart(day, blocks[0]),
    blockEnd(day, blocks[blocks.length - 1]),
    now,
  );
}

export interface NextUp {
  day: RoadmapDay;
  /** Index into `day.items` — the positional key space, breaks counted. */
  index: number;
  block: RoadmapBlock;
  start: Date;
  /** `live` if it has already started, `future` if it has not. */
  phase: Exclude<Phase, 'past'>;
}

/** The first block that has not finished yet — what to actually do now. */
export function nextUp(days: RoadmapDay[], now: Date): NextUp | null {
  for (const day of days) {
    for (let i = 0; i < day.items.length; i += 1) {
      const item = day.items[i];
      if (isBreak(item)) continue;
      if (blockEnd(day, item).getTime() <= now.getTime()) continue;
      const start = blockStart(day, item);
      return {
        day,
        index: i,
        block: item,
        start,
        phase: now.getTime() >= start.getTime() ? 'live' : 'future',
      };
    }
  }
  return null;
}

/** Scheduled minutes still ahead of the clock. Counts a running block in full. */
export function minutesLeft(days: RoadmapDay[], now: Date): number {
  let n = 0;
  for (const day of days) {
    for (const item of day.items) {
      if (isBreak(item)) continue;
      if (blockEnd(day, item).getTime() > now.getTime()) n += item.m;
    }
  }
  return n;
}

/** Local "YYYY-MM-DD" — same shape as `RoadmapDay.iso`, so the two compare. */
export function isoOf(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Local "HH:MM". */
export function clockOf(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** Local "24/09". */
export function dateOf(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}`;
}

const WEEKDAY = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

export function weekdayOf(d: Date): string {
  return WEEKDAY[d.getDay()];
}
