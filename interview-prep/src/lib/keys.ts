/**
 * Progress key shapes and the pure functions over them.
 *
 * Deliberately NOT inside `progress.tsx`. That file is `'use client'`, and every
 * value exported across a `'use client'` boundary reaches a Server Component as
 * an opaque client reference — calling `k.block(...)` from a server-rendered
 * page would blow up at prerender time. Keeping the pure parts in their own
 * module lets both sides import them for real.
 */

/** 0 = not rated yet, 1 = chưa thuộc, 2 = tạm được, 3 = nói trôi. */
export type Conf = 0 | 1 | 2 | 3;

export interface ItemState {
  /** Read / reviewed. */
  done?: boolean;
  /** Said out loud — the governing rule of his prep plan. */
  spoken?: boolean;
  /** Self-rated recall. */
  conf?: Conf;
  /** Last touched, epoch ms. */
  ts?: number;
}

/* One place that decides what a progress key looks like, so a rename does not
   silently orphan somebody's saved progress. */
export const k = {
  topic: (id: string) => `topic:${id}`,
  concept: (topicId: string, i: number) => `topic:${topicId}:concept:${i}`,
  topicQ: (topicId: string, i: number) => `topic:${topicId}:q:${i}`,
  card: (topicId: string, i: number) => `card:${topicId}:${i}`,
  star: (id: string) => `star:${id}`,
  starFollow: (id: string, i: number) => `star:${id}:follow:${i}`,
  bank: (id: string) => `bank:${id}`,
  claim: (id: string) => `claim:${id}`,
  ask: (id: string) => `ask:${id}`,
  fact: (id: string) => `fact:${id}`,
  block: (dayId: string, i: number) => `block:${dayId}:${i}`,
  extra: (dayId: string, i: number) => `extra:${dayId}:${i}`,
};

export interface Tally {
  total: number;
  done: number;
  spoken: number;
  /** Items rated 3 — he can say it without construction. */
  fluent: number;
  /** Items rated 1 — explicitly not known yet. */
  weak: number;
  pct: number;
}

export function tally(items: Record<string, ItemState>, keys: string[]): Tally {
  let done = 0;
  let spoken = 0;
  let fluent = 0;
  let weak = 0;
  for (const key of keys) {
    const state = items[key];
    if (!state) continue;
    if (state.done) done += 1;
    if (state.spoken) spoken += 1;
    if (state.conf === 3) fluent += 1;
    if (state.conf === 1) weak += 1;
  }
  const total = keys.length;
  return {
    total,
    done,
    spoken,
    fluent,
    weak,
    pct: total ? Math.round((done / total) * 100) : 0,
  };
}
