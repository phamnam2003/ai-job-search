import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/PageHeader';
import { Timeline } from '@/components/Timeline';
import { Check } from '@/components/Check';
import { cutList, meta, roadmap } from '@/content/nanyang-r1';
import { isBreak } from '@/content/types';
import { k } from '@/lib/keys';
import { formatMinutes } from '@/lib/time';
import s from './page.module.css';

export const metadata: Metadata = { title: 'Lộ trình' };

const total = roadmap
  .flatMap((d) => d.items)
  .reduce((n, i) => (isBreak(i) ? n : n + i.m), 0);

export default function Page() {
  return (
    <div className={s.page}>
      <PageHeader
        eyebrow="Lịch ôn tập"
        // Derived, not typed in. It was left at a stale 325 when the Friday
        // schedule was rebuilt for the confirmed 10:00 slot.
        title={`Ba buổi, ${total} phút`}
        lede={`Kế hoạch này không dạy bạn thêm thứ gì mới. Nó chỉ quyết định thứ tự — và ưu tiên việc NÓI THÀNH TIẾNG hơn việc đọc, vì buổi phỏng vấn kiểm tra cái thứ nhất. Tổng ${formatMinutes(total)}, trong đó phần lớn là luyện nói.`}
      />

      <div className={s.warn}>
        <span className={s.warnMark} aria-hidden="true">
          !
        </span>
        <div>
          <strong className={s.warnTitle}>Trước khi bám lịch này</strong>
          <ul className={s.warnList}>
            {meta.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      </div>

      <Timeline days={roadmap} />

      <section className={s.section} aria-labelledby="cut">
        <h2 className={s.h2} id="cut">
          Nếu chỉ còn một nửa thời gian
        </h2>
        <p className={s.sub}>
          Thứ tự cắt bỏ, đã xếp sẵn. Làm từ trên xuống; cái nào chưa tới thì bỏ,
          đừng cố nhồi.
        </p>
        <ol className={s.cuts}>
          {cutList.map((c) => (
            <li key={c.rank} className={s.cut}>
              <span className={s.cutRank}>{c.rank}</span>
              <div>
                <strong className={s.cutTitle}>{c.title}</strong>
                <p className={s.cutWhy}>{c.why}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={s.section} aria-labelledby="days">
        <h2 className={s.h2} id="days">
          Chi tiết từng buổi
        </h2>
        <p className={s.sub}>
          Tick khi xong. Tiến độ lưu ngay trên máy bạn, không gửi đi đâu cả.
        </p>

        <div className={s.days}>
          {roadmap.map((day) => (
            <article key={day.id} className={s.day}>
              <header className={s.dayHead}>
                <h3 className={s.dayTitle}>
                  {day.label} <span className={s.dayDate}>{day.date}</span>
                </h3>
                <span className={s.dayTag} data-tag={day.id}>
                  {day.tag}
                </span>
              </header>

              <ol className={s.blocks}>
                {day.items.map((item, i) =>
                  isBreak(item) ? (
                    <li key={`b${i}`} className={s.brk}>
                      {item.brk}
                    </li>
                  ) : (
                    <li key={`i${i}`} className={s.block} data-kind={item.kind}>
                      <div className={s.blockHead}>
                        <span className={s.blockTime}>
                          {item.s}–{item.e}
                        </span>
                        <span className={s.blockMin}>{formatMinutes(item.m)}</span>
                      </div>
                      <Check k={k.block(day.id, i)} label={item.title} />
                      <p className={s.blockInfo}>{item.info}</p>
                      {item.links?.length ? (
                        <p className={s.blockLinks}>
                          {item.links.map((l) => (
                            <Link key={l.href} href={l.href} className={s.link}>
                              {l.label} →
                            </Link>
                          ))}
                        </p>
                      ) : null}
                    </li>
                  ),
                )}
              </ol>

              {day.cap ? (
                <p className={s.dayCap}>
                  <span className={s.dayCapTime}>{day.cap.t}</span>
                  {day.cap.n}
                </p>
              ) : null}

              {day.extras?.length ? (
                <div className={s.extras}>
                  <h4 className={s.extrasTitle}>Ngoài lề nhưng đừng quên</h4>
                  {day.extras.map((x, i) => (
                    <Check
                      key={x.what}
                      k={k.extra(day.id, i)}
                      label={`${x.when} — ${x.what}`}
                      hint={x.note}
                    />
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
