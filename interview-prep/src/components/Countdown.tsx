'use client';

import { useEffect, useMemo, useState } from 'react';
import { humanise, parseLocal, remaining, type Remaining } from '@/lib/time';
import s from './Countdown.module.css';

/**
 * The clock is the one thing on this page that is allowed to be loud.
 *
 * Rendered blank on the server and on the first client frame — "how long until
 * Friday" is a function of `now`, which the server does not share with the
 * browser. Filling it in an effect costs one frame and buys a guaranteed-correct
 * number instead of a hydration mismatch.
 */
export function useCountdown(startsAt: string, tickMs = 1000): Remaining | null {
  const target = useMemo(() => parseLocal(startsAt), [startsAt]);
  const [r, setR] = useState<Remaining | null>(null);

  useEffect(() => {
    const tick = () => setR(remaining(target, new Date()));
    tick();
    const id = window.setInterval(tick, tickMs);
    return () => window.clearInterval(id);
  }, [target, tickMs]);

  return r;
}

export function CountdownCompact({ startsAt }: { startsAt: string }) {
  const r = useCountdown(startsAt, 30_000);
  return (
    <span className={s.compact} suppressHydrationWarning>
      {r ? humanise(r) : '—'}
    </span>
  );
}

const UNITS: { key: keyof Remaining; label: string }[] = [
  { key: 'days', label: 'ngày' },
  { key: 'hours', label: 'giờ' },
  { key: 'minutes', label: 'phút' },
  { key: 'seconds', label: 'giây' },
];

export function CountdownBig({
  startsAt,
  dateLabel,
}: {
  startsAt: string;
  dateLabel: string;
}) {
  const r = useCountdown(startsAt);

  if (r?.past) {
    return (
      <div className={s.big}>
        <p className={s.over}>Đã đến giờ phỏng vấn. Chúc bạn thật tốt.</p>
      </div>
    );
  }

  return (
    <div className={s.big}>
      <p className={s.lede}>Còn lại đến {dateLabel}</p>
      <div className={s.units} suppressHydrationWarning>
        {UNITS.map((u) => (
          <div key={u.key} className={s.unit}>
            <span className={s.num}>
              {r ? String(r[u.key] as number).padStart(2, '0') : '––'}
            </span>
            <span className={s.lab}>{u.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
