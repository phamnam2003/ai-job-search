import type { Metadata } from 'next';
import Link from 'next/link';
import { StatusChip } from '@/components/Chips';
import { KeyProgress } from '@/components/KeyProgress';
import { PageHeader } from '@/components/PageHeader';
import { Rich } from '@/components/Rich';
import { stars } from '@/content/nanyang-r1';
import type { Star } from '@/content/types';
import { k } from '@/lib/keys';
import s from './page.module.css';

export const metadata: Metadata = { title: 'Chuyện STAR' };

function keysOf(st: Star): string[] {
  return [k.star(st.id), ...st.followUps.map((_, i) => k.starFollow(st.id, i))];
}

export default function StarsPage() {
  const sorted = [...stars].sort((a, b) => a.priority - b.priority);
  const notRehearsed = stars.filter((x) => x.status !== 'rehearsed');

  return (
    <div className={s.page}>
      <PageHeader
        eyebrow="Chuyện STAR"
        title={`${stars.length} câu chuyện, xếp theo thứ tự cần thuộc`}
        lede="Mỗi chuyện có một câu mở, bốn đoạn S–T–A–R, một câu chốt, và — phần quan trọng nhất — danh sách ranh giới: những điều chuyện này KHÔNG chứng minh. Kể vượt ranh giới là cách nhanh nhất để mất tín nhiệm trong phòng phỏng vấn."
        aside={
          notRehearsed.length ? (
            <p className={s.warn}>
              <strong>{notRehearsed.length}</strong> chuyện chưa luyện nói:{' '}
              {notRehearsed.map((x) => x.title.split('—')[0].trim()).join(' · ')}
            </p>
          ) : null
        }
      />

      <ol className={s.list}>
        {sorted.map((st) => (
          <li key={st.id} className={s.item}>
            <span className={s.rank} aria-hidden="true">
              {st.priority}
            </span>
            <article className={s.card}>
              <Link href={`/star/${st.id}`} className={s.cardLink}>
                <div className={s.head}>
                  <h2 className={s.title}>{st.title}</h2>
                  <StatusChip status={st.status} />
                </div>
                <p className={s.meta}>
                  {st.company} · {st.period}
                </p>
                <p className={s.oneLiner}>
                  <Rich>{st.oneLiner}</Rich>
                </p>
              </Link>

              <details className={s.useFor}>
                <summary className={s.useForSummary}>
                  Dùng cho {st.useFor.length} tình huống
                </summary>
                <ul className={s.useForList}>
                  {st.useFor.map((u, i) => (
                    <li key={i}>
                      <Rich>{u}</Rich>
                    </li>
                  ))}
                </ul>
              </details>

              <div className={s.foot}>
                <span className={s.counts}>
                  {st.followUps.length} câu hỏi đào sâu · {st.boundaries.length}{' '}
                  ranh giới
                </span>
                <KeyProgress keys={keysOf(st)} label="đã nói" field="spoken" />
              </div>
            </article>
          </li>
        ))}
      </ol>
    </div>
  );
}
