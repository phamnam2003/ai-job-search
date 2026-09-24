import type { ReactNode } from 'react';
import { Check, ConfidenceRating } from './Check';
import { RichText, Rich } from './Rich';
import s from './QA.module.css';

/**
 * A question with the answer hidden until asked for.
 *
 * `<details>` on purpose, not a state hook: it works before hydration, it is
 * keyboard- and screen-reader-native, and Ctrl+F finds text inside a closed one
 * in Chromium. The whole point of this page is that he tries to answer BEFORE
 * he reads — a disclosure that only opens on click enforces that, and one that
 * needs JS to open would sometimes spoil it during load.
 */
export function QA({
  id,
  question,
  chips,
  trap,
  why,
  children,
}: {
  /** Progress key. Omit for a question that is not tracked. */
  id?: string;
  question: string;
  chips?: ReactNode;
  trap?: string;
  why?: string;
  /** The answer body. */
  children: ReactNode;
}) {
  return (
    <details className={s.qa}>
      <summary className={s.q}>
        <span className={s.caret} aria-hidden="true">
          <svg viewBox="0 0 12 12">
            <path d="M4 2.5 8 6l-4 3.5" />
          </svg>
        </span>
        <span className={s.qText}>
          <Rich>{question}</Rich>
        </span>
        {chips ? <span className={s.qChips}>{chips}</span> : null}
      </summary>

      <div className={s.body}>
        <div className={s.answer}>{children}</div>

        {why ? (
          <p className={s.why}>
            <span className={s.whyTag}>Vì sao họ hỏi</span>
            <Rich>{why}</Rich>
          </p>
        ) : null}

        {trap ? (
          <div className={s.trap}>
            <span className={s.trapTag} aria-hidden="true">
              <svg viewBox="0 0 16 16">
                <path d="M8 2.2 14.6 13H1.4L8 2.2Z" />
                <path d="M8 6.4v3.1" />
                <path d="M8 11.3h.01" />
              </svg>
            </span>
            <p>
              <strong className={s.trapLabel}>Bẫy:</strong>{' '}
              <Rich>{trap}</Rich>
            </p>
          </div>
        ) : null}

        {id ? (
          <div className={s.foot}>
            <Check k={id} field="spoken" label="Đã nói thành tiếng" />
            <ConfidenceRating k={id} compact />
          </div>
        ) : null}
      </div>
    </details>
  );
}

/** Plain rich-text answer body — the common case. */
export function Answer({ children }: { children: string }) {
  return <RichText className={s.p}>{children}</RichText>;
}
