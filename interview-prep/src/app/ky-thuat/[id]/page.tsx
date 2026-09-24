import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Check } from '@/components/Check';
import { DifficultyChip, PriorityChip, StanceChip } from '@/components/Chips';
import { CodeBlock } from '@/components/CodeBlock';
import { KeyProgress } from '@/components/KeyProgress';
import { PageHeader } from '@/components/PageHeader';
import { QA, Answer } from '@/components/QA';
import { Rich, RichText } from '@/components/Rich';
import { topics } from '@/content/nanyang-r1';
import { k } from '@/lib/keys';
import { formatMinutes } from '@/lib/time';
import s from './page.module.css';

export function generateStaticParams() {
  return topics.map((t) => ({ id: t.id }));
}

export async function generateMetadata({
  params,
}: PageProps<'/ky-thuat/[id]'>): Promise<Metadata> {
  const { id } = await params;
  const topic = topics.find((t) => t.id === id);
  return { title: topic?.title ?? 'Không tìm thấy' };
}

export default async function TopicPage({ params }: PageProps<'/ky-thuat/[id]'>) {
  const { id } = await params;
  const i = topics.findIndex((t) => t.id === id);
  if (i === -1) notFound();

  const topic = topics[i];
  const prev = topics[i - 1];
  const next = topics[i + 1];

  const allKeys = [
    k.topic(topic.id),
    ...topic.concepts.map((_, n) => k.concept(topic.id, n)),
    ...topic.questions.map((_, n) => k.topicQ(topic.id, n)),
  ];

  return (
    <article className={s.page}>
      <nav className={s.crumbs} aria-label="Đường dẫn">
        <Link href="/ky-thuat" className={s.crumb}>
          ← Kiến thức
        </Link>
        <span className={s.crumbSep} aria-hidden="true">
          /
        </span>
        <span className={s.crumbNow}>{topic.title}</span>
      </nav>

      <PageHeader
        eyebrow={`${formatMinutes(topic.estMinutes)} · ${topic.concepts.length} khái niệm · ${topic.questions.length} câu hỏi`}
        title={topic.title}
        lede={topic.tagline}
        aside={
          <div className={s.headChips}>
            <StanceChip stance={topic.stance} />
            <PriorityChip priority={topic.priority} />
            <KeyProgress keys={allKeys} />
          </div>
        }
      />

      {/* --- where he actually stands ------------------------------------- */}
      <section className={s.stance} data-stance={topic.stance} aria-labelledby="stance-h">
        <h2 id="stance-h" className={s.sectionTitle}>
          Vị trí thật của bạn
        </h2>
        <RichText className={s.p}>{topic.stanceNote}</RichText>

        <div className={s.bridge}>
          <p className={s.bridgeTag}>
            {topic.stance === 'gap'
              ? 'Nói đúng câu này khi bị hỏi thẳng'
              : 'Câu bắc cầu nếu bị đẩy quá chỗ bạn nắm'}
          </p>
          <blockquote className={s.bridgeQuote}>
            <Rich>{topic.bridgeIfUnknown}</Rich>
          </blockquote>
          <div className={s.bridgeFoot}>
            <Check
              k={k.topic(topic.id)}
              field="spoken"
              label="Đã đọc to câu này một lần"
              hint="Đọc thầm không tính — câu bắc cầu phải nghe tự nhiên khi nói"
            />
          </div>
        </div>

        <p className={s.jd}>
          <span className={s.jdTag}>JD</span>
          <Rich>{topic.jdHook}</Rich>
        </p>
      </section>

      {/* --- concepts ------------------------------------------------------ */}
      <section aria-labelledby="concepts-h" className={s.block}>
        <div className={s.blockHead}>
          <h2 id="concepts-h" className={s.sectionTitle}>
            Khái niệm
          </h2>
          <KeyProgress
            keys={topic.concepts.map((_, n) => k.concept(topic.id, n))}
            label="đã đọc"
          />
        </div>

        <ol className={s.concepts}>
          {topic.concepts.map((c, n) => (
            <li key={n} className={s.concept} id={`kn-${n + 1}`}>
              <div className={s.conceptHead}>
                <span className={s.conceptNum} aria-hidden="true">
                  {String(n + 1).padStart(2, '0')}
                </span>
                <h3 className={s.conceptTerm}>
                  <Rich>{c.term}</Rich>
                </h3>
              </div>
              <div className={s.conceptBody}>
                <RichText className={s.p}>{c.body}</RichText>
                {c.code ? <CodeBlock code={c.code} lang={c.lang} /> : null}
                <div className={s.conceptFoot}>
                  <Check k={k.concept(topic.id, n)} label="Đã hiểu, không cần đọc lại" />
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* --- questions ----------------------------------------------------- */}
      <section aria-labelledby="q-h" className={s.block}>
        <div className={s.blockHead}>
          <h2 id="q-h" className={s.sectionTitle}>
            Câu hỏi có thể bị hỏi
          </h2>
          <KeyProgress
            keys={topic.questions.map((_, n) => k.topicQ(topic.id, n))}
            label="đã nói"
            field="spoken"
          />
        </div>
        <p className={s.hint}>
          Tự trả lời trước khi mở đáp án. Mở ra mà chưa thử nói thì chỉ là đọc
          lại, không phải luyện.
        </p>

        <div className={s.qs}>
          {topic.questions.map((q, n) => (
            <QA
              key={n}
              id={k.topicQ(topic.id, n)}
              question={q.q}
              trap={q.trap}
              chips={<DifficultyChip difficulty={q.difficulty} />}
            >
              <Answer>{q.a}</Answer>
            </QA>
          ))}
        </div>
      </section>

      {/* --- traps --------------------------------------------------------- */}
      <section aria-labelledby="traps-h" className={s.block}>
        <h2 id="traps-h" className={s.sectionTitle}>
          Đừng nói những điều này
        </h2>
        <ul className={s.traps}>
          {topic.traps.map((t, n) => (
            <li key={n} className={s.trap}>
              <span className={s.trapMark} aria-hidden="true">
                <svg viewBox="0 0 16 16">
                  <path d="M4.5 4.5 11.5 11.5M11.5 4.5 4.5 11.5" />
                </svg>
              </span>
              <span>
                <Rich>{t}</Rich>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <p className={s.cardsLink}>
        {topic.flashcards.length} thẻ ghi nhớ của chủ đề này nằm ở{' '}
        <Link href={`/the-ghi-nho?topic=${topic.id}`}>Thẻ ghi nhớ</Link> — dùng
        khi chỉ còn vài phút, không dùng thay cho phần trên.
      </p>

      <nav className={s.pager} aria-label="Chủ đề khác">
        {prev ? (
          <Link href={`/ky-thuat/${prev.id}`} className={s.pagerLink}>
            <span className={s.pagerDir}>← Trước</span>
            <span className={s.pagerTitle}>{prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/ky-thuat/${next.id}`} className={`${s.pagerLink} ${s.pagerNext}`}>
            <span className={s.pagerDir}>Sau →</span>
            <span className={s.pagerTitle}>{next.title}</span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}
