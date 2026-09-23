'use client';

import { tally } from '@/lib/keys';
import { useProgress } from '@/lib/progress';
import s from './KeyProgress.module.css';

/**
 * "7/19 đã xong" plus a hairline meter, for any set of progress keys.
 *
 * The meter is a magnitude, so it uses the sequential ramp's mid step and never
 * changes hue with the value — a bar that turns from red to green as it fills
 * encodes the same number twice and makes low progress look like an error.
 */
export function KeyProgress({
  keys,
  label = 'đã xong',
  field = 'done',
}: {
  keys: string[];
  label?: string;
  field?: 'done' | 'spoken';
}) {
  const { items, ready } = useProgress();
  const t = tally(items, keys);
  const n = field === 'spoken' ? t.spoken : t.done;
  const pct = t.total ? Math.round((n / t.total) * 100) : 0;

  return (
    <span className={s.wrap}>
      <span className={s.num} suppressHydrationWarning>
        {ready ? `${n}/${t.total}` : `—/${t.total}`}
      </span>
      <span className={s.label}>{label}</span>
      <span className={s.track} aria-hidden="true">
        <span
          className={s.fill}
          style={{ width: `${ready ? Math.max(pct, n ? 3 : 0) : 0}%` }}
        />
      </span>
    </span>
  );
}
