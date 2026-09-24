import type { Metadata } from 'next';
import Link from 'next/link';
import { PriorityChip, StanceChip } from '@/components/Chips';
import { KeyProgress } from '@/components/KeyProgress';
import { PageHeader } from '@/components/PageHeader';
import { Rich } from '@/components/Rich';
import { SplitBar } from '@/components/SplitBar';
import { topics } from '@/content/nanyang-r1';
import type { Stance, Topic } from '@/content/types';
import { k } from '@/lib/keys';
import { formatMinutes } from '@/lib/time';
import s from './page.module.css';

export const metadata: Metadata = { title: 'Kiến thức' };

/** Weakest first. A revision index sorted alphabetically hides the risk. */
const ORDER: Record<Stance, number> = { gap: 0, partial: 1, strong: 2 };

function keysOf(t: Topic): string[] {
  return [
    k.topic(t.id),
    ...t.concepts.map((_, i) => k.concept(t.id, i)),
    ...t.questions.map((_, i) => k.topicQ(t.id, i)),
  ];
}

export default function TopicsPage() {
  const sorted = [...topics].sort(
    (a, b) => ORDER[a.stance] - ORDER[b.stance] || b.estMinutes - a.estMinutes,
  );

  const byStance = (st: Stance) => topics.filter((t) => t.stance === st);
  const minutes = (st: Stance) =>
    byStance(st).reduce((n, t) => n + t.estMinutes, 0);
  const total = topics.reduce((n, t) => n + t.estMinutes, 0);

  return (
    <div className={s.page}>
      <PageHeader
        eyebrow="Kiến thức"
        title={`${topics.length} chủ đề JD yêu cầu`}
        lede="Xếp theo chỗ yếu nhất trước. Mỗi chủ đề ghi thẳng vị trí thật của bạn — đã làm, biết một phần, hay chưa từng làm — và chủ đề 'chưa từng làm' vẫn có đủ khái niệm, câu hỏi và thẻ, vì hiểu được vấn đề không giống với nhận là đã làm."
        aside={
          <div className={s.headStat}>
            <span className={s.headNum}>{formatMinutes(total)}</span>
            <span className={s.headLabel}>tổng thời lượng nếu học hết</span>
          </div>
        }
      />

      <section className={s.chart} aria-labelledby="split-h">
        <h2 id="split-h" className={s.chartTitle}>
          Thời lượng nằm ở đâu
        </h2>
        <SplitBar
          unit="phút"
          caption="Thời lượng ôn tập chia theo vị trí thật của ứng viên với từng chủ đề"
          slices={[
            {
              id: 'gap',
              label: 'Chưa từng làm',
              value: minutes('gap'),
              color: 'var(--ord-1)',
              ink: 'var(--ord-1-ink)',
              note: `${byStance('gap').length} chủ đề — phải có câu bắc cầu trung thực`,
            },
            {
              id: 'partial',
              label: 'Biết một phần',
              value: minutes('partial'),
              color: 'var(--ord-2)',
              ink: 'var(--ord-2-ink)',
              note: `${byStance('partial').length} chủ đề — có kinh nghiệm liền kề`,
            },
            {
              id: 'strong',
              label: 'Đã làm thật',
              value: minutes('strong'),
              color: 'var(--ord-3)',
              ink: 'var(--ord-3-ink)',
              note: `${byStance('strong').length} chủ đề — chịu được hỏi sâu`,
            },
          ]}
        />
        <p className={s.chartNote}>
          Một sắc lam, đậm dần theo mức vững — đây là ba mức của cùng một thang,
          không phải ba loại khác nhau.
        </p>
      </section>

      <ul className={s.grid}>
        {sorted.map((t) => (
          <li key={t.id} className={s.cell}>
            <article className={s.card} data-stance={t.stance}>
              <Link href={`/ky-thuat/${t.id}`} className={s.cardLink}>
                <span className={s.cardHead}>
                  <StanceChip stance={t.stance} />
                  <PriorityChip priority={t.priority} />
                  <span className={s.mins}>{formatMinutes(t.estMinutes)}</span>
                </span>
                <h3 className={s.cardTitle}>{t.title}</h3>
                <p className={s.tagline}>
                  <Rich>{t.tagline}</Rich>
                </p>
              </Link>

              <div className={s.cardFoot}>
                <span className={s.counts}>
                  {t.concepts.length} khái niệm · {t.questions.length} câu hỏi ·{' '}
                  {t.flashcards.length} thẻ
                </span>
                <KeyProgress keys={keysOf(t)} />
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
