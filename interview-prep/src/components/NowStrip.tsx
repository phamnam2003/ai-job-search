'use client';

import Link from 'next/link';
import type { RoadmapDay } from '@/content/types';
import { useNow } from '@/lib/now';
import {
  blockEnd,
  clockOf,
  dateOf,
  isoOf,
  minutesLeft,
  nextUp,
  weekdayOf,
} from '@/lib/schedule';
import { formatMinutes, humanise, parseLocal, remaining } from '@/lib/time';
import s from './NowStrip.module.css';

/**
 * Where he actually is on the plan, right now.
 *
 * The roadmap below this reads the same at every hour of the week, which is
 * correct for a plan and useless for the twenty seconds after he opens the page.
 * This answers the only question he has at that moment — what am I supposed to
 * be doing — by reading the clock instead of asking him to find himself on a
 * chart of three days, two of which may already be over.
 *
 * Everything here is derived. Nothing is authored, so nothing can go stale.
 */
export function NowStrip({
  days,
  startsAt,
}: {
  days: RoadmapDay[];
  startsAt: string;
}) {
  const now = useNow();

  if (!now) {
    // First frame and SSR: the server does not know what time it is in his
    // browser. Hold the shape, fill nothing.
    return (
      <section className={s.strip} aria-label="Bạn đang ở đâu trên lịch">
        <div className={s.cells}>
          <div className={s.cell}>
            <span className={s.label}>Bây giờ</span>
            <span className={s.big}>––:––</span>
          </div>
          <div className={s.cell}>
            <span className={s.label}>Tiếp theo</span>
            <span className={s.big}>—</span>
          </div>
          <div className={s.cell}>
            <span className={s.label}>Đến giờ phỏng vấn</span>
            <span className={s.big}>—</span>
          </div>
        </div>
      </section>
    );
  }

  const next = nextUp(days, now);
  const left = minutesLeft(days, now);
  const toGo = remaining(parseLocal(startsAt), now);
  const link = next?.block.links?.[0];
  // Nothing left on the clock today, but the plan continues tomorrow. Worth
  // saying out loud: the failure mode at this hour is one more run-through
  // instead of sleep.
  const tomorrow = next !== null && next.day.iso !== isoOf(now);

  return (
    <section className={s.strip} aria-label="Bạn đang ở đâu trên lịch">
      <div className={s.cells}>
        <div className={s.cell}>
          <span className={s.label}>Bây giờ</span>
          <span className={s.big} suppressHydrationWarning>
            {clockOf(now)}
          </span>
          <span className={s.sub} suppressHydrationWarning>
            {weekdayOf(now)} · {dateOf(now)}
          </span>
        </div>

        <div className={s.cell} data-live={next?.phase === 'live' ? '' : undefined}>
          <span className={s.label}>
            {next?.phase === 'live' ? 'Đang trong khối' : 'Tiếp theo'}
          </span>
          {next ? (
            <>
              <span className={s.big} suppressHydrationWarning>
                <span className={s.clock}>
                  {next.block.s}–{next.block.e}
                </span>{' '}
                <span className={s.what}>{next.block.title}</span>
              </span>
              <span className={s.sub} suppressHydrationWarning>
                {next.day.label} {next.day.date} ·{' '}
                {next.phase === 'live'
                  ? `còn ${humanise(remaining(blockEnd(next.day, next.block), now))}`
                  : `bắt đầu sau ${humanise(remaining(next.start, now))}`}
                {link ? (
                  <>
                    {' · '}
                    <Link href={link.href} className={s.link}>
                      {link.label} →
                    </Link>
                  </>
                ) : null}
              </span>
            </>
          ) : (
            <>
              <span className={s.big}>Hết lịch ôn</span>
              <span className={s.sub}>
                Không còn khối nào trên lịch. Thứ còn lại không nằm trong app này.
              </span>
            </>
          )}
        </div>

        <div className={s.cell}>
          <span className={s.label}>Đến giờ phỏng vấn</span>
          <span className={s.big} suppressHydrationWarning>
            {toGo.past ? 'Đã đến giờ' : humanise(toGo)}
          </span>
          <span className={s.sub} suppressHydrationWarning>
            {toGo.past
              ? 'Chúc bạn thật tốt.'
              : `còn ${formatMinutes(left)} ôn theo lịch`}
          </span>
        </div>
      </div>

      {next && tomorrow ? (
        <p className={s.hint} suppressHydrationWarning>
          Lịch của hôm nay đã hết — khối tiếp theo là {next.block.s}{' '}
          {next.day.label} {next.day.date}. Lúc này ngủ đúng giờ đáng giá hơn một
          lượt luyện nữa.
        </p>
      ) : null}
    </section>
  );
}
