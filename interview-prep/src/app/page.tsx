import Link from 'next/link';
import { CountdownBig } from '@/components/Countdown';
import { Readiness } from '@/components/Readiness';
import { SplitBar, type Slice } from '@/components/SplitBar';
import { cutList, meta, roadmap } from '@/content/nanyang-r1';
import { isBreak, type ActivityKind } from '@/content/types';
import s from './page.module.css';

const KIND_META: Record<ActivityKind, { label: string; color: string; note: string }> = {
  speak: {
    label: 'Luyện nói',
    color: 'var(--act-speak)',
    note: 'Nói thành tiếng, không đọc thầm',
  },
  read: {
    label: 'Đọc & tự kiểm',
    color: 'var(--act-read)',
    note: 'Đọc một lượt rồi che đáp án',
  },
  write: {
    label: 'Viết mới',
    color: 'var(--act-write)',
    note: 'STAR Kubernetes còn trống',
  },
  admin: {
    label: 'Hậu cần & di chuyển',
    color: 'var(--act-admin)',
    note: 'Mail HR, in CV, đi lại',
  },
};

const ORDER: ActivityKind[] = ['speak', 'read', 'write', 'admin'];

function split(): { slices: Slice[]; total: number; revision: number } {
  const by: Record<ActivityKind, number> = { speak: 0, read: 0, write: 0, admin: 0 };
  for (const day of roadmap) {
    for (const item of day.items) {
      if (!isBreak(item)) by[item.kind] += item.m;
    }
  }
  const total = ORDER.reduce((n, kd) => n + by[kd], 0);
  return {
    slices: ORDER.map((kd) => ({ id: kd, value: by[kd], ...KIND_META[kd] })),
    total,
    // Admin is real work but it is not revision — the spoken-share number is
    // only honest if the denominator excludes it.
    revision: total - by.admin,
  };
}

export default function Page() {
  const { slices, total, revision } = split();
  const speaking = slices.find((x) => x.id === 'speak')?.value ?? 0;
  const spokenShare = Math.round((speaking / revision) * 100);

  return (
    <div className={s.page}>
      <section className={s.hero}>
        <div className={s.heroMain}>
          <p className={s.kicker}>{meta.round} · {meta.language}</p>
          <h1 className={s.h1}>{meta.role}</h1>
          <p className={s.company}>{meta.company}</p>
          <p className={s.where}>{meta.location}</p>
          <p className={s.format}>{meta.format}</p>
        </div>
        <div className={s.heroClock}>
          <CountdownBig startsAt={meta.startsAt} dateLabel={meta.dateLabel} />
          <Link href="/lo-trinh" className={s.cta}>
            Mở lộ trình →
          </Link>
        </div>
      </section>

      <div className={s.grid}>
        <section className={s.card} aria-labelledby="readiness">
          <h2 className={s.h2} id="readiness">
            Bạn đang ở đâu
          </h2>
          <p className={s.sub}>
            Hai con số khác nhau, và con số thứ hai mới là con số quyết định:
            đọc xong một câu trả lời không giống với nói được nó.
          </p>
          <Readiness />
        </section>

        <section className={s.card} aria-labelledby="split">
          <h2 className={s.h2} id="split">
            {total} phút được chia thế nào
          </h2>
          <p className={s.sub}>
            Bỏ {total - revision} phút hậu cần ra, còn {revision} phút ôn thật —{' '}
            <strong>{spokenShare}%</strong> trong số đó là luyện nói. Đó là chủ ý,
            không phải ngẫu nhiên.
          </p>
          <SplitBar
            slices={slices}
            unit="phút"
            caption={`Phân bổ ${total} phút ôn tập theo loại hoạt động`}
          />
        </section>

        <section className={s.card} aria-labelledby="first">
          <h2 className={s.h2} id="first">
            Làm trước, nếu chỉ còn ít thời gian
          </h2>
          <ol className={s.top}>
            {cutList.slice(0, 3).map((c) => (
              <li key={c.rank} className={s.topItem}>
                <span className={s.topRank}>{c.rank}</span>
                <div>
                  <strong className={s.topTitle}>{c.title}</strong>
                  <p className={s.topWhy}>{c.why}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link href="/lo-trinh#cut" className={s.more}>
            Xem đủ 6 mục theo thứ tự cắt →
          </Link>
        </section>

        <section className={`${s.card} ${s.cardWarn}`} aria-labelledby="open">
          <h2 className={s.h2} id="open">
            Còn bỏ ngỏ
          </h2>
          <p className={s.sub}>
            Những điều chưa xác nhận được. Đừng đoán — hỏi HR.
          </p>
          <ul className={s.warns}>
            {meta.warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
