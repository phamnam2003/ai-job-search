'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Topic } from '@/content/types';
import { k, type Conf } from '@/lib/keys';
import { useProgress } from '@/lib/progress';
import { Rich } from './Rich';
import s from './Deck.module.css';

interface Card {
  key: string;
  topicId: string;
  topicTitle: string;
  front: string;
  back: string;
}

const RATINGS: { v: Conf; label: string; hint: string }[] = [
  { v: 1, label: 'Chưa thuộc', hint: 'gặp lại sớm' },
  { v: 2, label: 'Tạm được', hint: 'còn ngập ngừng' },
  { v: 3, label: 'Nói trôi', hint: 'khỏi gặp lại' },
];

/**
 * One card at a time, answer hidden until asked for.
 *
 * A grid of 140 cards with both sides showing is a reading exercise, not a
 * recall exercise — the value is entirely in the half-second where he tries to
 * produce the answer and fails. So: one card, flip on demand, rate, next.
 */
export function Deck({
  topics,
  initialTopic,
}: {
  topics: Topic[];
  initialTopic?: string;
}) {
  const { items, rate, ready } = useProgress();
  const [topicId, setTopicId] = useState<string>(
    initialTopic && topics.some((t) => t.id === initialTopic) ? initialTopic : 'all',
  );
  const [onlyWeak, setOnlyWeak] = useState(false);
  const [shuffled, setShuffled] = useState<string[] | null>(null);
  const [at, setAt] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const all = useMemo<Card[]>(
    () =>
      topics.flatMap((t) =>
        t.flashcards.map((c, i) => ({
          key: k.card(t.id, i),
          topicId: t.id,
          topicTitle: t.title,
          front: c.front,
          back: c.back,
        })),
      ),
    [topics],
  );

  const confOf = useCallback(
    (key: string) => (ready ? (items[key]?.conf ?? 0) : 0),
    [items, ready],
  );

  // `onlyWeak` is applied on ENTRY to the deck, not continuously: if it filtered
  // live, rating a card 3 would yank it out from under the hand that just rated
  // it and shift the whole deck by one.
  const [weakSet, setWeakSet] = useState<Set<string> | null>(null);

  const deck = useMemo(() => {
    let list = all;
    if (topicId !== 'all') list = list.filter((c) => c.topicId === topicId);
    if (onlyWeak && weakSet) list = list.filter((c) => weakSet.has(c.key));
    if (shuffled) {
      const order = new Map(shuffled.map((key, i) => [key, i]));
      list = [...list].sort(
        (a, b) => (order.get(a.key) ?? 0) - (order.get(b.key) ?? 0),
      );
    }
    return list;
  }, [all, topicId, onlyWeak, weakSet, shuffled]);

  const card = deck[Math.min(at, Math.max(deck.length - 1, 0))];

  const go = useCallback(
    (d: number) => {
      setFlipped(false);
      setAt((i) => {
        if (deck.length === 0) return 0;
        return (i + d + deck.length) % deck.length;
      });
    },
    [deck.length],
  );

  const score = useCallback(
    (v: Conf) => {
      if (!card) return;
      rate(card.key, v);
      go(1);
    },
    [card, rate, go],
  );

  function toggleWeak() {
    if (onlyWeak) {
      setOnlyWeak(false);
      setWeakSet(null);
    } else {
      setWeakSet(new Set(all.filter((c) => confOf(c.key) < 3).map((c) => c.key)));
      setOnlyWeak(true);
    }
    setAt(0);
    setFlipped(false);
  }

  function shuffle() {
    if (shuffled) {
      setShuffled(null);
    } else {
      const keys = all.map((c) => c.key);
      for (let i = keys.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [keys[i], keys[j]] = [keys[j], keys[i]];
      }
      setShuffled(keys);
    }
    setAt(0);
    setFlipped(false);
  }

  // Keyboard: the whole point is speed. Space flips, 1–3 rate, arrows move.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        setFlipped((v) => !v);
      } else if (e.key === 'ArrowRight') {
        go(1);
      } else if (e.key === 'ArrowLeft') {
        go(-1);
      } else if (e.key === '1' || e.key === '2' || e.key === '3') {
        score(Number(e.key) as Conf);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, score]);

  const rated = deck.filter((c) => confOf(c.key) > 0).length;
  const fluent = deck.filter((c) => confOf(c.key) === 3).length;

  return (
    <div className={s.wrap}>
      <div className={s.controls}>
        <label className={s.selectWrap}>
          <span className={s.selectLabel}>Chủ đề</span>
          <select
            className={s.select}
            value={topicId}
            onChange={(e) => {
              setTopicId(e.target.value);
              setAt(0);
              setFlipped(false);
            }}
          >
            <option value="all">Tất cả ({all.length} thẻ)</option>
            {topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.flashcards.length})
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className={`${s.toggle} ${onlyWeak ? s.toggleOn : ''}`}
          onClick={toggleWeak}
          aria-pressed={onlyWeak}
        >
          Chỉ thẻ chưa thuộc
        </button>
        <button
          type="button"
          className={`${s.toggle} ${shuffled ? s.toggleOn : ''}`}
          onClick={shuffle}
          aria-pressed={Boolean(shuffled)}
        >
          Xáo thẻ
        </button>

        <p className={s.tally} suppressHydrationWarning>
          {ready ? `${fluent} nói trôi · ${rated - fluent} đang luyện · ${deck.length - rated} chưa chấm` : `${deck.length} thẻ`}
        </p>
      </div>

      {!card ? (
        <p className={s.empty}>
          Không còn thẻ nào khớp. Bỏ bộ lọc &ldquo;chỉ thẻ chưa thuộc&rdquo; để
          xem lại toàn bộ.
        </p>
      ) : (
        <>
          <div className={s.progress} aria-hidden="true">
            <span
              className={s.progressFill}
              style={{ width: `${((at % deck.length) + 1) / deck.length * 100}%` }}
            />
          </div>

          <button
            type="button"
            className={`${s.card} ${flipped ? s.cardFlipped : ''}`}
            onClick={() => setFlipped((v) => !v)}
            aria-expanded={flipped}
          >
            <span className={s.cardMeta}>
              <span className={s.cardTopic}>{card.topicTitle}</span>
              <span className={s.cardPos}>
                {(at % deck.length) + 1} / {deck.length}
              </span>
            </span>

            <span className={s.front}>
              <Rich>{card.front}</Rich>
            </span>

            {flipped ? (
              <span className={s.back}>
                <Rich>{card.back}</Rich>
              </span>
            ) : (
              <span className={s.prompt}>
                Trả lời thành tiếng trước — rồi bấm (hoặc Space) để lật
              </span>
            )}
          </button>

          <div className={s.actions}>
            <button type="button" className={s.nav} onClick={() => go(-1)}>
              ← Trước
            </button>

            <div className={s.rate} role="group" aria-label="Tự chấm">
              {RATINGS.map((r) => (
                <button
                  key={r.v}
                  type="button"
                  className={`${s.rateBtn} ${confOf(card.key) === r.v ? s.rateOn : ''}`}
                  data-level={r.v}
                  onClick={() => score(r.v)}
                >
                  <span className={s.rateNum}>{r.v}</span>
                  <span className={s.rateLabel}>{r.label}</span>
                  <span className={s.rateHint}>{r.hint}</span>
                </button>
              ))}
            </div>

            <button type="button" className={s.nav} onClick={() => go(1)}>
              Sau →
            </button>
          </div>

          <p className={s.keys}>
            <kbd>Space</kbd> lật · <kbd>1</kbd> <kbd>2</kbd> <kbd>3</kbd> chấm ·{' '}
            <kbd>←</kbd> <kbd>→</kbd> chuyển thẻ
          </p>
        </>
      )}
    </div>
  );
}
