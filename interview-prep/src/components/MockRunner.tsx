'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { BankQuestion, Star, Topic } from '@/content/types';
import { k, type Conf } from '@/lib/keys';
import { useProgress } from '@/lib/progress';
import { Rich, RichText } from './Rich';
import s from './MockRunner.module.css';

/**
 * A timed run at the real thing.
 *
 * The rest of the app is reading; this is the only page where he has to produce
 * an answer with a clock running and no text in front of him. That is the whole
 * design constraint: the question shows, the answer does not, and the timer is
 * visible — because the failure mode in the room is a 4-minute answer, not a
 * wrong one.
 */

interface Prompt {
  key: string;
  q: string;
  a: string;
  trap: string;
  source: string;
  href: string;
  /** Spoken length to aim for, in seconds. */
  target: number;
}

type ModeId = 'full' | 'certain' | 'weak' | 'random';

const MODES: { id: ModeId; title: string; blurb: string }[] = [
  {
    id: 'full',
    title: 'Vòng 1 đầy đủ',
    blurb: 'Mở đầu bằng chuyện kể, rồi kỹ thuật, rồi HR — đúng thứ tự một buổi thật.',
  },
  {
    id: 'certain',
    title: 'Gần như chắc hỏi',
    blurb: 'Chỉ những câu khả năng cao nhất. Ngắn, dùng khi còn ít thời gian.',
  },
  {
    id: 'weak',
    title: 'Chỗ còn yếu',
    blurb: 'Những câu chưa nói thành tiếng hoặc tự chấm dưới mức trôi.',
  },
  {
    id: 'random',
    title: 'Ngẫu nhiên 10 câu',
    blurb: 'Xáo hết lên. Không đoán được câu tiếp theo — giống thật nhất.',
  },
];

/** How many questions the "ngẫu nhiên" run pulls out of the full pool. */
const RANDOM_N = 10;

function mmss(sec: number) {
  const m = Math.floor(sec / 60);
  const r = sec % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}

export function MockRunner({
  topics,
  stars,
  bank,
}: {
  topics: Topic[];
  stars: Star[];
  bank: BankQuestion[];
}) {
  const { items, ready, rate, toggle } = useProgress();

  /* ---- the pool ------------------------------------------------------- */

  const fromStars = useMemo<Prompt[]>(
    () =>
      [...stars]
        .sort((a, b) => a.priority - b.priority)
        .map((st) => ({
          key: k.star(st.id),
          q: st.useFor[0] ?? `Kể cho tôi nghe về ${st.title.toLowerCase()}.`,
          a: `**S —** ${st.situation}\n\n**T —** ${st.task}\n\n**A —** ${st.action}\n\n**R —** ${st.result}\n\n${st.landingLine}`,
          trap: st.scopeGuard,
          source: `Chuyện kể · ${st.company}`,
          href: `/star/${st.id}`,
          target: 120,
        })),
    [stars],
  );

  const fromTopics = useMemo<Prompt[]>(
    () =>
      topics.flatMap((t) =>
        t.questions.map((q, i) => ({
          key: k.topicQ(t.id, i),
          q: q.q,
          a: q.a,
          trap: q.trap,
          source: `Kỹ thuật · ${t.title}`,
          href: `/ky-thuat/${t.id}`,
          target: q.difficulty === 'warmup' ? 45 : q.difficulty === 'core' ? 90 : 120,
        })),
      ),
    [topics],
  );

  const fromBank = useMemo<Prompt[]>(
    () =>
      bank.map((q) => ({
        key: k.bank(q.id),
        q: q.q,
        a: q.a,
        trap: q.trap,
        source: q.category === 'hr' ? 'HR & đãi ngộ' : 'Ngân hàng câu hỏi',
        href: '/cau-hoi',
        target: q.category === 'hr' ? 60 : 90,
      })),
    [bank],
  );

  const build = useCallback(
    (mode: ModeId): Prompt[] => {
      const certainIds = new Set(
        bank.filter((q) => q.likelihood === 'near-certain').map((q) => k.bank(q.id)),
      );

      if (mode === 'certain') {
        return [
          ...fromStars.slice(0, 2),
          ...fromBank.filter((p) => certainIds.has(p.key)),
        ];
      }

      if (mode === 'weak') {
        const weak = (p: Prompt) => {
          const st = items[p.key];
          return !st?.spoken || (st?.conf ?? 0) < 3;
        };
        return [...fromStars, ...fromTopics, ...fromBank].filter(weak).slice(0, 15);
      }

      // The shuffle happens in `start`, not here: `build` is also called during
      // render to size the buttons, and a render must be pure.
      if (mode === 'random') return [...fromStars, ...fromTopics, ...fromBank];

      // full: the shape of a real round 1 — warm up on a story, go technical,
      // land on HR and the closing question.
      const hr = fromBank.filter((p) => p.source === 'HR & đãi ngộ');
      const rest = fromBank.filter((p) => p.source !== 'HR & đãi ngộ');
      const core = fromTopics.filter((p) => p.target >= 90);
      return [
        ...fromStars.slice(0, 2),
        ...rest.filter((p) => certainIds.has(p.key)).slice(0, 5),
        ...core.slice(0, 8),
        ...fromStars.slice(2, 3),
        ...hr.slice(0, 3),
      ];
    },
    [bank, fromBank, fromStars, fromTopics, items],
  );

  const size = useCallback(
    (mode: ModeId) =>
      mode === 'random'
        ? Math.min(RANDOM_N, build('random').length)
        : build(mode).length,
    [build],
  );

  /* ---- run state ------------------------------------------------------- */

  const [mode, setMode] = useState<ModeId>('full');
  const [run, setRun] = useState<Prompt[] | null>(null);
  const [at, setAt] = useState(0);
  const [shown, setShown] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [scores, setScores] = useState<Record<string, Conf>>({});
  const [done, setDone] = useState(false);

  // One interval per question; it reads the wall clock rather than counting
  // ticks, so a backgrounded tab does not under-report the time. `shown` flips
  // to false on every new question, which is what re-arms this — and re-arming
  // is also where the start time is taken, because an effect is the only place
  // a component may read the clock.
  useEffect(() => {
    if (!run || done || shown) return;
    const from = Date.now();
    const id = window.setInterval(() => {
      setElapsed(Math.floor((Date.now() - from) / 1000));
    }, 250);
    return () => window.clearInterval(id);
  }, [run, done, shown]);

  function start(m: ModeId) {
    let list = build(m);
    if (m === 'random') {
      list = [...list];
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
      list = list.slice(0, RANDOM_N);
    }
    if (list.length === 0) return;
    setMode(m);
    setRun(list);
    setAt(0);
    setShown(false);
    setElapsed(0);
    setTimes([]);
    setScores({});
    setDone(false);
  }

  function reveal() {
    setTimes((t) => [...t, elapsed]);
    setShown(true);
  }

  function next(score?: Conf) {
    if (!run) return;
    const cur = run[at];
    if (score) {
      rate(cur.key, score);
      setScores((s) => ({ ...s, [cur.key]: score }));
    }
    // Reaching the answer means he spoke it — that is the flag the whole plan
    // is scored on, so the run sets it rather than asking for another click.
    if (!items[cur.key]?.spoken) toggle(cur.key, 'spoken');

    if (at + 1 >= run.length) {
      setDone(true);
      return;
    }
    setAt(at + 1);
    setShown(false);
    setElapsed(0);
  }

  function quit() {
    setDone(true);
  }

  /* ---- setup screen ---------------------------------------------------- */

  if (!run) {
    // Sizes only — `build` is not called here, because the random mode shuffles
    // and a render must not depend on a fresh Math.random().
    const counts = MODES.map((m) => ({ ...m, n: size(m.id) }));
    const chosen = counts.find((m) => m.id === mode)?.n ?? 0;
    return (
      <div className={s.setup}>
        <ul className={s.modes}>
          {counts.map((m) => (
            <li key={m.id}>
              <button
                type="button"
                className={`${s.mode} ${mode === m.id ? s.modeOn : ''}`}
                onClick={() => setMode(m.id)}
                aria-pressed={mode === m.id}
                disabled={m.n === 0}
              >
                <span className={s.modeTitle}>{m.title}</span>
                <span className={s.modeCount} suppressHydrationWarning>
                  {m.n === 0 ? 'chưa có câu nào' : `${m.n} câu`}
                </span>
                <span className={s.modeBlurb}>{m.blurb}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className={s.rules}>
          <h2 className={s.rulesH}>Luật chơi</h2>
          <ol className={s.rulesList}>
            <li>Nói thành tiếng. Nghĩ trong đầu không tính.</li>
            <li>Không bấm xem đáp án trước khi đã nói xong câu trả lời của mình.</li>
            <li>
              Đồng hồ chỉ để biết mình dài hay ngắn, không phải để chạy đua. Mốc
              tốt: 60–120 giây một câu.
            </li>
            <li>Chấm thật tay. Chấm rộng thì buổi thật sẽ chấm lại giúp.</li>
          </ol>
        </div>

        <button
          type="button"
          className={s.start}
          onClick={() => start(mode)}
          disabled={chosen === 0}
          suppressHydrationWarning
        >
          Bắt đầu — {chosen} câu
        </button>
        {!ready ? (
          <p className={s.note}>Đang đọc tiến độ đã lưu…</p>
        ) : null}
      </div>
    );
  }

  /* ---- summary --------------------------------------------------------- */

  if (done) {
    const answered = times.length;
    const total = times.reduce((n, t) => n + t, 0);
    const over = run
      .slice(0, answered)
      .map((p, i) => ({ p, t: times[i] }))
      .filter((r) => r.t > r.p.target);
    const low = run
      .slice(0, answered)
      .filter((p) => (scores[p.key] ?? 3) < 3);

    return (
      <div className={s.summary}>
        <div className={s.statRow}>
          <div className={s.stat}>
            <span className={s.statNum}>{answered}</span>
            <span className={s.statLabel}>câu đã nói</span>
          </div>
          <div className={s.stat}>
            <span className={s.statNum}>{mmss(total)}</span>
            <span className={s.statLabel}>tổng thời gian nói</span>
          </div>
          <div className={s.stat}>
            <span className={s.statNum}>
              {answered ? mmss(Math.round(total / answered)) : '0:00'}
            </span>
            <span className={s.statLabel}>trung bình mỗi câu</span>
          </div>
        </div>

        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th scope="col">Câu</th>
                <th scope="col">Thời gian</th>
                <th scope="col">Mốc</th>
                <th scope="col">Tự chấm</th>
              </tr>
            </thead>
            <tbody>
              {run.slice(0, answered).map((p, i) => (
                <tr key={p.key}>
                  <th scope="row">
                    <Link href={p.href}>{p.q}</Link>
                  </th>
                  <td className={times[i] > p.target ? s.tOver : undefined}>
                    {mmss(times[i])}
                  </td>
                  <td className={s.tTarget}>{mmss(p.target)}</td>
                  <td>{scores[p.key] ? `${scores[p.key]}/3` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {over.length > 0 ? (
          <aside className={s.aside}>
            <h3 className={s.asideH}>{over.length} câu nói quá dài</h3>
            <p className={s.asideP}>
              Dài không phải là sai, nhưng người phỏng vấn sẽ mất mạch. Cắt phần
              bối cảnh, vào thẳng việc mình làm:{' '}
              {over.map((r, i) => (
                <span key={r.p.key}>
                  {i > 0 ? ' · ' : ''}
                  <Link href={r.p.href}>{r.p.q}</Link>
                </span>
              ))}
            </p>
          </aside>
        ) : null}

        {low.length > 0 ? (
          <aside className={s.aside}>
            <h3 className={s.asideH}>{low.length} câu tự chấm chưa trôi</h3>
            <p className={s.asideP}>
              Đọc lại rồi nói lại, đừng để sang hôm sau:{' '}
              {low.map((p, i) => (
                <span key={p.key}>
                  {i > 0 ? ' · ' : ''}
                  <Link href={p.href}>{p.q}</Link>
                </span>
              ))}
            </p>
          </aside>
        ) : null}

        <button type="button" className={s.start} onClick={() => setRun(null)}>
          Chạy lượt khác
        </button>
      </div>
    );
  }

  /* ---- the run --------------------------------------------------------- */

  const cur = run[at];
  const over = elapsed > cur.target;

  return (
    <div className={s.run}>
      <div className={s.runBar}>
        <span className={s.runPos}>
          Câu {at + 1} / {run.length}
        </span>
        <span className={s.runTrack} aria-hidden="true">
          <span
            className={s.runFill}
            style={{ width: `${((at + 1) / run.length) * 100}%` }}
          />
        </span>
        <button type="button" className={s.quit} onClick={quit}>
          Dừng
        </button>
      </div>

      <div className={s.stage}>
        <p className={s.source}>{cur.source}</p>
        <p className={s.question}>
          <Rich>{cur.q}</Rich>
        </p>

        <div className={s.clockRow}>
          <span
            className={`${s.clock} ${over ? s.clockOver : ''}`}
            role="timer"
            aria-live="off"
          >
            {mmss(elapsed)}
          </span>
          <span className={s.clockTarget}>
            mốc {mmss(cur.target)}
            {over ? ' — đang dài hơn mốc' : ''}
          </span>
        </div>

        {!shown ? (
          <button type="button" className={s.reveal} onClick={reveal}>
            Đã nói xong — xem đáp án
          </button>
        ) : (
          <div className={s.answer}>
            <h3 className={s.answerH}>Bản mẫu</h3>
            <RichText className={s.answerP}>{cur.a}</RichText>
            {cur.trap ? (
              <p className={s.trap}>
                <span className={s.trapMark} aria-hidden="true">
                  ▲
                </span>
                <span>
                  <strong>Bẫy: </strong>
                  <Rich>{cur.trap}</Rich>
                </span>
              </p>
            ) : null}

            <div className={s.rate} role="group" aria-label="Tự chấm câu này">
              {([1, 2, 3] as Conf[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  className={s.rateBtn}
                  data-level={v}
                  onClick={() => next(v)}
                >
                  {v === 1 ? '1 · Trả lời chưa được' : v === 2 ? '2 · Tạm được' : '3 · Nói trôi'}
                </button>
              ))}
            </div>
            <button type="button" className={s.skip} onClick={() => next()}>
              Bỏ qua chấm, sang câu sau
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
