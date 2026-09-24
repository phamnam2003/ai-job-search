'use client';

import Link from 'next/link';
import { tally } from '@/lib/keys';
import { useProgress } from '@/lib/progress';
import { ALL_KEYS, SECTIONS, SECTION_KEYS, SPOKEN_KEYS } from '@/lib/sections';
import s from './Readiness.module.css';

/**
 * Where he actually stands, by section.
 *
 * Bars are a magnitude, so they take the sequential ramp — one hue, light to
 * dark, never a categorical colour per row. A row at 0% keeps a visible track so
 * "nothing done yet" still reads as a row rather than as missing data.
 */
export function Readiness() {
  const { items, ready } = useProgress();
  const rows = SECTIONS.filter((sec) => SECTION_KEYS[sec.id].length > 0).map(
    (sec) => ({ sec, t: tally(items, SECTION_KEYS[sec.id]) }),
  );

  const overall = tally(items, ALL_KEYS);
  const spoken = tally(items, SPOKEN_KEYS);

  return (
    <div className={s.wrap}>
      <div className={s.stats}>
        <Stat
          label="Đã xem qua"
          value={ready ? `${overall.pct}%` : '—'}
          sub={ready ? `${overall.done}/${overall.total} mục` : 'đang tải'}
        />
        <Stat
          label="Đã nói thành tiếng"
          value={ready ? `${spoken.total ? Math.round((spoken.spoken / spoken.total) * 100) : 0}%` : '—'}
          sub={ready ? `${spoken.spoken}/${spoken.total} câu` : 'đang tải'}
          accent
        />
        <Stat
          label="Tự chấm 'nói trôi'"
          value={ready ? String(overall.fluent) : '—'}
          sub={ready && overall.weak ? `còn ${overall.weak} mục chưa thuộc` : 'chưa chấm'}
        />
      </div>

      <ul className={s.rows}>
        {rows.map(({ sec, t }) => (
          <li key={sec.id} className={s.row}>
            <Link href={sec.href} className={s.rowLink}>
              <span className={s.rowLabel}>{sec.label}</span>
              <span className={s.track} aria-hidden="true">
                <span
                  className={s.fill}
                  data-level={level(t.pct)}
                  style={{ width: `${ready ? Math.max(t.pct, t.done ? 2 : 0) : 0}%` }}
                />
              </span>
              <span className={s.rowVal}>
                {ready ? `${t.done}/${t.total}` : '—'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className={s.foot}>
        Tiến độ nằm trong trình duyệt trên máy bạn (localStorage). Không có máy
        chủ, không gửi đi đâu.
      </p>
    </div>
  );
}

/** Five steps of one hue — magnitude, not identity. */
function level(pct: number): 1 | 2 | 3 | 4 | 5 {
  if (pct >= 90) return 5;
  if (pct >= 65) return 4;
  if (pct >= 40) return 3;
  if (pct >= 15) return 2;
  return 1;
}

function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className={`${s.stat} ${accent ? s.statAccent : ''}`}>
      <span className={s.statLabel}>{label}</span>
      <span className={s.statValue} suppressHydrationWarning>
        {value}
      </span>
      <span className={s.statSub} suppressHydrationWarning>
        {sub}
      </span>
    </div>
  );
}
