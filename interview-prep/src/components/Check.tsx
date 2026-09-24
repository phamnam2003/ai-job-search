'use client';

import type { Conf } from '@/lib/keys';
import { useProgress } from '@/lib/progress';
import s from './Check.module.css';

/**
 * A tick bound to a progress key.
 *
 * `field="spoken"` is the one that matters most in this app: his plan's whole
 * premise is that reading an answer and being able to say it are different
 * states, so they are tracked as different fields rather than one "done".
 */
export function Check({
  k: key,
  field = 'done',
  label,
  hint,
}: {
  k: string;
  field?: 'done' | 'spoken';
  label: string;
  hint?: string;
}) {
  const { get, toggle, ready } = useProgress();
  const on = ready ? Boolean(get(key)[field]) : false;

  return (
    <label className={`${s.row} ${on ? s.rowOn : ''}`}>
      <input
        type="checkbox"
        className={s.input}
        checked={on}
        onChange={() => toggle(key, field)}
      />
      <span className={`${s.box} ${field === 'spoken' ? s.boxSpoken : ''}`} aria-hidden="true">
        <svg viewBox="0 0 16 16" className={s.tick}>
          <path d="M3.5 8.4 6.6 11.4 12.5 4.9" />
        </svg>
      </span>
      <span className={s.text}>
        <span className={s.label}>{label}</span>
        {hint ? <span className={s.hint}>{hint}</span> : null}
      </span>
    </label>
  );
}

const CONF: { v: Conf; label: string; short: string }[] = [
  { v: 1, label: 'Chưa thuộc', short: '1' },
  { v: 2, label: 'Tạm được', short: '2' },
  { v: 3, label: 'Nói trôi', short: '3' },
];

/**
 * Self-rating, 1–3.
 *
 * Deliberately an ORDINAL ramp, not three hues: 1/2/3 is an ordered level, and
 * painting an ordered thing with categorical colours is the classic mistake. The
 * number is always visible, because the lightest step does not carry 3:1 against
 * the surface on its own.
 */
export function ConfidenceRating({
  k: key,
  compact = false,
}: {
  k: string;
  compact?: boolean;
}) {
  const { get, rate, ready } = useProgress();
  const conf = ready ? (get(key).conf ?? 0) : 0;

  return (
    <div
      className={`${s.rate} ${compact ? s.rateCompact : ''}`}
      role="group"
      aria-label="Tự chấm mức thuộc"
    >
      {!compact ? <span className={s.rateLabel}>Tự chấm</span> : null}
      {CONF.map((c) => (
        <button
          key={c.v}
          type="button"
          className={`${s.pip} ${conf === c.v ? s.pipOn : ''}`}
          data-level={c.v}
          aria-pressed={conf === c.v}
          onClick={() => rate(key, conf === c.v ? 0 : c.v)}
          title={c.label}
        >
          <span className={s.pipNum}>{c.short}</span>
          {!compact ? <span className={s.pipText}>{c.label}</span> : null}
        </button>
      ))}
    </div>
  );
}
