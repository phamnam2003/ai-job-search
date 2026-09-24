'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { BankQuestion, Likelihood, QuestionCategory } from '@/content/types';
import { k } from '@/lib/keys';
import { useProgress } from '@/lib/progress';
import { LikelihoodChip } from './Chips';
import { QA, Answer } from './QA';
import s from './BankBoard.module.css';

export const CAT_LABEL: Record<QuestionCategory, string> = {
  gap: 'Chỗ chưa có',
  tough: 'Câu khó',
  hr: 'HR & đãi ngộ',
  behavioral: 'Hành vi',
  role: 'Về vị trí',
  closing: 'Kết thúc',
};

const LIK_LABEL: Record<Likelihood, string> = {
  'near-certain': 'Gần như chắc hỏi',
  likely: 'Nhiều khả năng',
  possible: 'Có thể',
};

const LIK_ORDER: Likelihood[] = ['near-certain', 'likely', 'possible'];

/** Ordered levels -> one hue, dark = most likely. Never three separate hues. */
const LIK_COLOR: Record<Likelihood, string> = {
  'near-certain': 'var(--ord-3)',
  likely: 'var(--ord-2)',
  possible: 'var(--ord-1)',
};

/* The ink that goes ON each fill, keyed by the level rather than by the
   segment's position — a row with no 'possible' questions would otherwise hand
   the lightest step's ink to a mid-blue segment. */
const LIK_INK: Record<Likelihood, string> = {
  'near-certain': 'var(--ord-3-ink)',
  likely: 'var(--ord-2-ink)',
  possible: 'var(--ord-1-ink)',
};

type StateFilter = 'all' | 'todo' | 'done';

export function BankBoard({
  questions,
  starTitles,
}: {
  questions: BankQuestion[];
  /** id -> title, so a question can link to the story that answers it. */
  starTitles: Record<string, string>;
}) {
  const { items, ready } = useProgress();
  const [cat, setCat] = useState<QuestionCategory | 'all'>('all');
  const [lik, setLik] = useState<Likelihood | 'all'>('all');
  const [state, setState] = useState<StateFilter>('all');
  const [table, setTable] = useState(false);

  const cats = useMemo(() => {
    const seen: QuestionCategory[] = [];
    for (const q of questions) if (!seen.includes(q.category)) seen.push(q.category);
    return seen;
  }, [questions]);

  const spokenOf = (q: BankQuestion) =>
    ready ? Boolean(items[k.bank(q.id)]?.spoken) : false;

  /** Not-yet-spoken counts by likelihood — the number that actually matters. */
  const risk = LIK_ORDER.map((l) => {
    const all = questions.filter((q) => q.likelihood === l);
    return { l, total: all.length, todo: all.filter((q) => !spokenOf(q)).length };
  });

  const shown = questions.filter((q) => {
    if (cat !== 'all' && q.category !== cat) return false;
    if (lik !== 'all' && q.likelihood !== lik) return false;
    if (state === 'todo' && spokenOf(q)) return false;
    if (state === 'done' && !spokenOf(q)) return false;
    return true;
  });

  const maxRow = Math.max(
    1,
    ...cats.map((c) => questions.filter((q) => q.category === c).length),
  );

  return (
    <div className={s.wrap}>
      {/* --- the actionable number ---------------------------------------- */}
      <div className={s.risk}>
        {risk.map((r) => (
          <button
            key={r.l}
            type="button"
            className={`${s.riskTile} ${lik === r.l ? s.riskTileOn : ''}`}
            onClick={() => setLik(lik === r.l ? 'all' : r.l)}
            aria-pressed={lik === r.l}
          >
            <span className={s.riskSwatch} style={{ background: LIK_COLOR[r.l] }} aria-hidden="true" />
            <span className={s.riskLabel}>{LIK_LABEL[r.l]}</span>
            <span className={s.riskNum} suppressHydrationWarning>
              {ready ? r.todo : r.total}
            </span>
            <span className={s.riskSub} suppressHydrationWarning>
              {ready ? `chưa nói / ${r.total} câu` : `${r.total} câu`}
            </span>
          </button>
        ))}
      </div>

      {/* --- structure: where the questions sit --------------------------- */}
      <figure className={s.chart}>
        <figcaption className={s.chartHead}>
          <span className={s.chartTitle}>Câu hỏi nằm ở đâu</span>
          <button
            type="button"
            className={s.tableBtn}
            onClick={() => setTable((v) => !v)}
            aria-pressed={table}
          >
            {table ? 'Xem biểu đồ' : 'Xem bảng'}
          </button>
        </figcaption>

        {table ? (
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">Nhóm</th>
                {LIK_ORDER.map((l) => (
                  <th key={l} scope="col">
                    {LIK_LABEL[l]}
                  </th>
                ))}
                <th scope="col">Tổng</th>
              </tr>
            </thead>
            <tbody>
              {cats.map((c) => {
                const row = questions.filter((q) => q.category === c);
                return (
                  <tr key={c}>
                    <th scope="row">{CAT_LABEL[c]}</th>
                    {LIK_ORDER.map((l) => (
                      <td key={l}>{row.filter((q) => q.likelihood === l).length}</td>
                    ))}
                    <td>{row.length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <ul className={s.rows}>
            {cats.map((c) => {
              const row = questions.filter((q) => q.category === c);
              return (
                <li key={c} className={s.row}>
                  <span className={s.rowLabel}>{CAT_LABEL[c]}</span>
                  <span
                    className={s.rowBar}
                    style={{ width: `${(row.length / maxRow) * 100}%` }}
                  >
                    {LIK_ORDER.map((l) => {
                      const n = row.filter((q) => q.likelihood === l).length;
                      if (!n) return null;
                      const pct = (n / row.length) * 100;
                      return (
                        <span
                          key={l}
                          className={s.seg}
                          style={{
                            width: `${pct}%`,
                            background: LIK_COLOR[l],
                            color: LIK_INK[l],
                          }}
                          title={`${CAT_LABEL[c]} · ${LIK_LABEL[l]}: ${n} câu`}
                        >
                          {pct >= 22 ? <span className={s.segNum}>{n}</span> : null}
                        </span>
                      );
                    })}
                  </span>
                  <span className={s.rowTotal}>{row.length}</span>
                </li>
              );
            })}
          </ul>
        )}

        <ul className={s.legend}>
          {LIK_ORDER.map((l) => (
            <li key={l} className={s.legendItem}>
              <span
                className={s.legendChip}
                style={{ background: LIK_COLOR[l] }}
                aria-hidden="true"
              />
              {LIK_LABEL[l]}
            </li>
          ))}
        </ul>
        <p className={s.chartNote}>
          Một sắc lam đậm dần theo khả năng bị hỏi — ba mức của cùng một thang.
          Bấm vào ô phía trên để lọc theo mức.
        </p>
      </figure>

      {/* --- filters ------------------------------------------------------- */}
      <div className={s.filters} role="group" aria-label="Lọc câu hỏi">
        <div className={s.filterSet}>
          <span className={s.filterLabel}>Nhóm</span>
          <button
            type="button"
            className={`${s.pill} ${cat === 'all' ? s.pillOn : ''}`}
            onClick={() => setCat('all')}
            aria-pressed={cat === 'all'}
          >
            Tất cả
          </button>
          {cats.map((c) => (
            <button
              key={c}
              type="button"
              className={`${s.pill} ${cat === c ? s.pillOn : ''}`}
              onClick={() => setCat(c)}
              aria-pressed={cat === c}
            >
              {CAT_LABEL[c]}
            </button>
          ))}
        </div>

        <div className={s.filterSet}>
          <span className={s.filterLabel}>Trạng thái</span>
          {(
            [
              ['all', 'Tất cả'],
              ['todo', 'Chưa nói'],
              ['done', 'Đã nói'],
            ] as [StateFilter, string][]
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              className={`${s.pill} ${state === v ? s.pillOn : ''}`}
              onClick={() => setState(v)}
              aria-pressed={state === v}
            >
              {label}
            </button>
          ))}
        </div>

        <p className={s.count} suppressHydrationWarning>
          {shown.length}/{questions.length} câu
        </p>
      </div>

      {/* --- the questions ------------------------------------------------- */}
      {shown.length === 0 ? (
        <p className={s.empty}>
          Không còn câu nào khớp bộ lọc. Nếu bạn đang lọc &ldquo;Chưa nói&rdquo;
          thì đó là tin tốt.
        </p>
      ) : (
        <div className={s.list}>
          {shown.map((q) => (
            <QA
              key={q.id}
              id={k.bank(q.id)}
              question={q.q}
              why={q.why}
              trap={q.trap}
              chips={<LikelihoodChip likelihood={q.likelihood} />}
            >
              <Answer>{q.a}</Answer>
              {q.relatedStar && starTitles[q.relatedStar] ? (
                <p className={s.related}>
                  Chuyện kể kèm:{' '}
                  <Link href={`/star/${q.relatedStar}`}>
                    {starTitles[q.relatedStar]}
                  </Link>
                </p>
              ) : null}
            </QA>
          ))}
        </div>
      )}
    </div>
  );
}
