import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check } from '@/components/Check';
import { StatusChip } from '@/components/Chips';
import { KeyProgress } from '@/components/KeyProgress';
import { PageHeader } from '@/components/PageHeader';
import { QA, Answer } from '@/components/QA';
import { Rich, RichText } from '@/components/Rich';
import { stars } from '@/content/nanyang-r1';
import { k } from '@/lib/keys';
import s from './page.module.css';

export function generateStaticParams() {
  return stars.map((st) => ({ id: st.id }));
}

export async function generateMetadata({
  params,
}: PageProps<'/star/[id]'>): Promise<Metadata> {
  const { id } = await params;
  return { title: stars.find((st) => st.id === id)?.title ?? 'Không tìm thấy' };
}

/** The four beats, in the order he says them. */
const BEATS = [
  { key: 'situation', letter: 'S', label: 'Bối cảnh' },
  { key: 'task', letter: 'T', label: 'Việc của em' },
  { key: 'action', letter: 'A', label: 'Em đã làm gì' },
  { key: 'result', letter: 'R', label: 'Kết quả' },
] as const;

export default async function StarPage({ params }: PageProps<'/star/[id]'>) {
  const { id } = await params;
  const i = stars.findIndex((st) => st.id === id);
  if (i === -1) notFound();

  const st = stars[i];
  const allKeys = [
    k.star(st.id),
    ...st.followUps.map((_, n) => k.starFollow(st.id, n)),
  ];

  return (
    <article className={s.page}>
      <nav className={s.crumbs} aria-label="Đường dẫn">
        <Link href="/star" className={s.crumb}>
          ← Chuyện STAR
        </Link>
      </nav>

      <PageHeader
        eyebrow={`${st.company} · ${st.period}`}
        title={st.title}
        lede={st.oneLiner}
        aside={
          <div className={s.headChips}>
            <StatusChip status={st.status} />
            <KeyProgress keys={allKeys} label="đã nói" field="spoken" />
          </div>
        }
      />

      {/* --- the opening line --------------------------------------------- */}
      <section className={s.open} aria-labelledby="open-h">
        <h2 id="open-h" className={s.kicker}>
          Câu mở — nói đúng câu này
        </h2>
        <blockquote className={s.openQuote}>
          <Rich>{st.openWith}</Rich>
        </blockquote>
        <p className={s.openNote}>
          Một câu, rồi dừng. Câu mở là cái móc — nếu họ quan tâm họ sẽ hỏi tiếp,
          và lúc đó bạn mới vào S–T–A–R.
        </p>
      </section>

      {/* --- the arc ------------------------------------------------------- */}
      <section aria-labelledby="arc-h" className={s.block}>
        <h2 id="arc-h" className={s.sectionTitle}>
          Bốn đoạn
        </h2>
        <ol className={s.arc}>
          {BEATS.map((b) => (
            <li key={b.key} className={s.beat}>
              <div className={s.beatMark} aria-hidden="true">
                <span className={s.beatLetter}>{b.letter}</span>
              </div>
              <div className={s.beatBody}>
                <h3 className={s.beatLabel}>{b.label}</h3>
                <RichText className={s.p}>{st[b.key]}</RichText>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* --- the landing --------------------------------------------------- */}
      <section className={s.landing} aria-labelledby="land-h">
        <h2 id="land-h" className={s.kicker}>
          Câu chốt — kết thúc ở đây, đừng nói thêm
        </h2>
        <blockquote className={s.landQuote}>
          <Rich>{st.landingLine}</Rich>
        </blockquote>
        <div className={s.landFoot}>
          <Check
            k={k.star(st.id)}
            field="spoken"
            label="Đã kể trọn chuyện này thành tiếng, có bấm giờ"
            hint="Mục tiêu 90–120 giây từ câu mở đến câu chốt"
          />
        </div>
      </section>

      {/* --- boundaries ---------------------------------------------------- */}
      <section aria-labelledby="bound-h" className={s.block}>
        <h2 id="bound-h" className={s.sectionTitle}>
          Chuyện này KHÔNG chứng minh điều gì
        </h2>
        <p className={s.hint}>
          Nói ra trước khi bị hỏi. Người phỏng vấn tin một ứng viên tự vạch ranh
          giới hơn hẳn một ứng viên để họ tự phát hiện.
        </p>
        <ul className={s.bounds}>
          {st.boundaries.map((b, n) => (
            <li key={n} className={s.bound}>
              <span className={s.boundMark} aria-hidden="true">
                <svg viewBox="0 0 16 16">
                  <path d="M2.5 8h11" />
                </svg>
              </span>
              <span>
                <Rich>{b}</Rich>
              </span>
            </li>
          ))}
        </ul>

        <div className={s.guard}>
          <p className={s.guardTag}>Nếu họ hiểu quá phạm vi — đính chính ngay</p>
          <blockquote className={s.guardQuote}>
            <Rich>{st.scopeGuard}</Rich>
          </blockquote>
        </div>
      </section>

      {/* --- follow-ups ---------------------------------------------------- */}
      <section aria-labelledby="fu-h" className={s.block}>
        <div className={s.blockHead}>
          <h2 id="fu-h" className={s.sectionTitle}>
            Họ sẽ đào sâu chỗ nào
          </h2>
          <KeyProgress
            keys={st.followUps.map((_, n) => k.starFollow(st.id, n))}
            label="đã nói"
            field="spoken"
          />
        </div>
        <div className={s.qs}>
          {st.followUps.map((f, n) => (
            <QA key={n} id={k.starFollow(st.id, n)} question={f.q}>
              <Answer>{f.a}</Answer>
            </QA>
          ))}
        </div>
      </section>

      {/* --- routing ------------------------------------------------------- */}
      <section aria-labelledby="use-h" className={s.block}>
        <h2 id="use-h" className={s.sectionTitle}>
          Lôi chuyện này ra khi nào
        </h2>
        <ul className={s.useFor}>
          {st.useFor.map((u, n) => (
            <li key={n}>
              <Rich>{u}</Rich>
            </li>
          ))}
        </ul>
      </section>
    </article>
  );
}
