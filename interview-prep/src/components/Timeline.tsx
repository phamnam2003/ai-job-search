'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import { isBreak, type RoadmapDay, type ActivityKind } from '@/content/types';
import { formatMinutes } from '@/lib/time';
import { k } from '@/lib/keys';
import { useProgress } from '@/lib/progress';
import s from './Timeline.module.css';

/**
 * Three lanes, one per day, drawn to scale.
 *
 * The x-axis is REVISION MINUTES, not clock time. That is the honest choice:
 * the three days start at wildly different hours and the long gaps between
 * blocks are elided, so a clock axis would be a lie drawn to scale. Elapsed
 * minutes from the first block of that day is what the bar widths actually
 * encode, and the caption says so.
 *
 * Labels appear inside a segment only when the segment is wide enough to hold
 * one. Everything else is reachable by hover, by the day cards below, and by the
 * table view — never a title clipped by its own bar.
 */

const PPM = 5.4; // px per minute
// 22 rather than 30: at 5.4 px/min a 25-minute block is 135px wide, which holds
// a short title comfortably. The old floor silently hid the titles of both
// Friday morning blocks — the two that matter most on the day.
const LABEL_MIN = 22; // minutes; below this a segment shows only its duration
const BREAK_W = 26; // px — deliberately NOT to scale

const KIND_LABEL: Record<ActivityKind, string> = {
  speak: 'Luyện nói',
  write: 'Viết mới',
  read: 'Đọc & tự kiểm',
  admin: 'Hậu cần & di chuyển',
};

const KINDS: ActivityKind[] = ['speak', 'read', 'write', 'admin'];

interface Hover {
  x: number;
  y: number;
  title: string;
  time: string;
  kind: ActivityKind;
  info: string;
}

function dayMinutes(day: RoadmapDay): number {
  return day.items.reduce((n, i) => (isBreak(i) ? n : n + i.m), 0);
}

export function Timeline({ days }: { days: RoadmapDay[] }) {
  const [hover, setHover] = useState<Hover | null>(null);
  const [table, setTable] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const { get, toggle, ready } = useProgress();

  const widest = Math.max(...days.map(dayMinutes));
  const ticks: number[] = [];
  for (let t = 0; t <= widest; t += 30) ticks.push(t);

  const show = (e: React.MouseEvent | React.FocusEvent, h: Omit<Hover, 'x' | 'y'>) => {
    const box = wrap.current?.getBoundingClientRect();
    const mark = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (!box) return;
    setHover({
      ...h,
      x: mark.left - box.left + mark.width / 2,
      y: mark.top - box.top,
    });
  };

  return (
    <figure className={s.fig}>
      <figcaption className={s.cap}>
        <span className={s.capTitle}>Ba buổi, vẽ đúng tỉ lệ</span>
        <span className={s.capSub}>
          Trục ngang là <strong>số phút ôn</strong>, không phải giờ đồng hồ — các
          khoảng nghỉ dài giữa các block đã được rút gọn và đánh dấu bằng vạch
          đứt. Mỗi ô rộng đúng theo thời lượng của nó.
        </span>
      </figcaption>

      <div className={s.legend}>
        {KINDS.map((kind) => (
          <span key={kind} className={s.legendItem}>
            <span className={s.swatch} data-kind={kind} aria-hidden="true" />
            {KIND_LABEL[kind]}
          </span>
        ))}
        <button
          type="button"
          className={s.tableBtn}
          aria-pressed={table}
          onClick={() => setTable((v) => !v)}
        >
          {table ? 'Xem biểu đồ' : 'Xem dạng bảng'}
        </button>
      </div>

      {table ? (
        <TimelineTable days={days} />
      ) : (
        <div className={s.wrap} ref={wrap}>
          <div className={s.scroll}>
            <div className={s.lanes} style={{ minWidth: widest * PPM + 8 }}>
              {days.map((day) => {
                const total = dayMinutes(day);
                return (
                  <div key={day.id} className={s.laneRow}>
                    <div className={s.laneHead}>
                      <span className={s.laneDay}>{day.label}</span>
                      <span className={s.laneDate}>{day.date}</span>
                      <span className={s.laneTag} data-tag={day.id}>
                        {day.tag}
                      </span>
                      <span className={s.laneTotal}>{formatMinutes(total)}</span>
                    </div>
                    <div className={s.lane}>
                      {day.items.map((item, i) => {
                        if (isBreak(item)) {
                          return (
                            <span
                              key={`b${i}`}
                              className={s.brk}
                              style={{ width: BREAK_W }}
                              title={item.brk}
                            >
                              <span className={s.srOnly}>{item.brk}</span>
                            </span>
                          );
                        }
                        const key = k.block(day.id, i);
                        const done = ready && Boolean(get(key).done);
                        return (
                          <button
                            key={`i${i}`}
                            type="button"
                            className={`${s.blk} ${done ? s.blkDone : ''}`}
                            data-kind={item.kind}
                            style={{ width: item.m * PPM }}
                            onMouseEnter={(e) =>
                              show(e, {
                                title: item.title,
                                time: `${item.s}–${item.e} · ${formatMinutes(item.m)}`,
                                kind: item.kind,
                                info: item.info,
                              })
                            }
                            onFocus={(e) =>
                              show(e, {
                                title: item.title,
                                time: `${item.s}–${item.e} · ${formatMinutes(item.m)}`,
                                kind: item.kind,
                                info: item.info,
                              })
                            }
                            onMouseLeave={() => setHover(null)}
                            onBlur={() => setHover(null)}
                            onClick={() => toggle(key, 'done')}
                            aria-pressed={done}
                          >
                            <span className={s.blkTime}>{item.s}</span>
                            {item.m >= LABEL_MIN ? (
                              <span className={s.blkTitle}>{item.title}</span>
                            ) : (
                              <span className={s.srOnly}>{item.title}</span>
                            )}
                            <span className={s.blkMin}>{item.m}′</span>
                          </button>
                        );
                      })}
                      {day.cap ? (
                        <span className={s.cap2} title={`${day.cap.t} ${day.cap.n}`}>
                          <span className={s.capFlag}>{day.cap.t}</span>
                          <span className={s.capName}>{day.cap.n}</span>
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className={s.axis} style={{ minWidth: widest * PPM + 8 }}>
              <span className={s.axisPad} />
              <span className={s.axisTrack}>
                {ticks.map((t) => (
                  <span key={t} className={s.tick} style={{ left: t * PPM }}>
                    <span className={s.tickLab}>{t}</span>
                  </span>
                ))}
              </span>
            </div>
            <p className={s.axisUnit}>phút ôn tính từ block đầu tiên của ngày</p>
          </div>

          {hover ? (
            <div
              className={s.tip}
              role="status"
              style={{ left: hover.x, top: hover.y }}
            >
              <span className={s.tipHead}>
                <span className={s.swatch} data-kind={hover.kind} aria-hidden="true" />
                {KIND_LABEL[hover.kind]}
              </span>
              <strong className={s.tipTitle}>{hover.title}</strong>
              <span className={s.tipTime}>{hover.time}</span>
              <span className={s.tipInfo}>{hover.info}</span>
              <span className={s.tipHint}>Bấm vào ô để đánh dấu đã xong</span>
            </div>
          ) : null}
        </div>
      )}
    </figure>
  );
}

function TimelineTable({ days }: { days: RoadmapDay[] }) {
  return (
    <div className={s.tableWrap}>
      <table className={s.table}>
        <caption className={s.srOnly}>
          Lịch ôn tập theo ngày, giờ bắt đầu, giờ kết thúc và thời lượng
        </caption>
        <thead>
          <tr>
            <th scope="col">Ngày</th>
            <th scope="col">Giờ</th>
            <th scope="col">Phút</th>
            <th scope="col">Loại</th>
            <th scope="col">Việc</th>
            <th scope="col">Mở</th>
          </tr>
        </thead>
        <tbody>
          {days.flatMap((day) =>
            day.items.map((item, i) =>
              isBreak(item) ? (
                <tr key={`${day.id}-b${i}`} className={s.tableBreak}>
                  <td>{day.label}</td>
                  <td colSpan={5}>— {item.brk} —</td>
                </tr>
              ) : (
                <tr key={`${day.id}-i${i}`}>
                  <td>
                    {day.label} {day.date}
                  </td>
                  <td className={s.num}>
                    {item.s}–{item.e}
                  </td>
                  <td className={s.num}>{item.m}</td>
                  <td>
                    <span className={s.swatch} data-kind={item.kind} aria-hidden="true" />{' '}
                    {KIND_LABEL[item.kind]}
                  </td>
                  <td>{item.title}</td>
                  <td>
                    {(item.links ?? []).map((l) => (
                      <Link key={l.href} href={l.href} className={s.tableLink}>
                        {l.label}
                      </Link>
                    ))}
                  </td>
                </tr>
              ),
            ),
          )}
        </tbody>
      </table>
    </div>
  );
}
