'use client';

import { useEffect, useRef, useState } from 'react';
import s from './SplitBar.module.css';

export interface Slice {
  id: string;
  label: string;
  value: number;
  /** CSS colour token, e.g. 'var(--act-speak)'. */
  color: string;
  /**
   * Ink for the label sitting ON this fill. White is only legible on the darker
   * steps — the lightest step of the ordinal ramp is 2.06:1 against white, so a
   * slice painted with it must pass its matching `-ink` token here.
   */
  ink?: string;
  note?: string;
}

/**
 * One stacked bar, part-to-whole.
 *
 * Direct labels are SELECTIVE — a slice gets its name inside the bar only if it
 * is wide enough to hold it; everything else is named in the legend below, where
 * the value sits next to a colour chip. Identity is therefore never colour
 * alone, and no label is ever clipped by its own segment.
 *
 * "Wide enough" is measured, not assumed. A flat percentage threshold passed
 * "Hậu cần & di chuyển" at 19% of a 420px card and then ellipsised it to
 * "Hậu cầ…", which is the failure the paragraph above claims cannot happen.
 */

/** px per character at --fs-xs / 600 weight, rounded up so we never clip. */
const CHAR_PX = 7.4;
/** .seg horizontal padding (2 × --sp-3) plus a little slack. */
const SEG_CHROME = 28;
export function SplitBar({
  slices,
  unit,
  caption,
}: {
  slices: Slice[];
  unit: string;
  caption?: string;
}) {
  const [hover, setHover] = useState<string | null>(null);
  const bar = useRef<HTMLDivElement>(null);
  // 0 until the first layout. That keeps the server HTML and the first client
  // paint identical — the width-aware pass only ever takes labels away.
  const [barW, setBarW] = useState(0);
  const total = slices.reduce((n, x) => n + x.value, 0) || 1;

  useEffect(() => {
    const el = bar.current;
    if (!el) return;
    const read = () => setBarW(el.getBoundingClientRect().width);
    // Read once here rather than waiting for the observer's first callback —
    // that callback is delivered on a later frame, and a headless screenshot
    // can be taken before it ever lands.
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fits = (label: string, pct: number) =>
    pct >= 18 &&
    (barW === 0 || label.length * CHAR_PX + SEG_CHROME <= (pct / 100) * barW);

  return (
    <div className={s.wrap}>
      <div className={s.bar} ref={bar} role="img" aria-label={caption}>
        {slices.map((x) => {
          const pct = (x.value / total) * 100;
          return (
            <span
              key={x.id}
              className={`${s.seg} ${hover && hover !== x.id ? s.segDim : ''}`}
              style={{ width: `${pct}%`, background: x.color, color: x.ink }}
              onMouseEnter={() => setHover(x.id)}
              onMouseLeave={() => setHover(null)}
            >
              {fits(x.label, pct) ? (
                <span className={s.segLabel}>
                  {x.label}
                  <span className={s.segVal}>
                    {x.value} {unit}
                  </span>
                </span>
              ) : (
                <span className={s.segLabelSmall}>{x.value}</span>
              )}
            </span>
          );
        })}
      </div>

      <ul className={s.legend}>
        {slices.map((x) => (
          <li
            key={x.id}
            className={`${s.legendItem} ${hover === x.id ? s.legendOn : ''}`}
            onMouseEnter={() => setHover(x.id)}
            onMouseLeave={() => setHover(null)}
          >
            <span
              className={s.chip}
              style={{ background: x.color }}
              aria-hidden="true"
            />
            <span className={s.legendText}>
              <span className={s.legendLabel}>{x.label}</span>
              {x.note ? <span className={s.legendNote}>{x.note}</span> : null}
            </span>
            <span className={s.legendVal}>
              {x.value} {unit}
              <span className={s.legendPct}>
                {Math.round((x.value / total) * 100)}%
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
