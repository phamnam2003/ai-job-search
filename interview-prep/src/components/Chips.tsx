import type {
  Confidence,
  Difficulty,
  Likelihood,
  Priority,
  Risk,
  Stance,
  StarStatus,
} from '@/content/types';
import s from './Chips.module.css';

/**
 * Small labelled marks.
 *
 * Two different colour jobs live here and they are kept apart on purpose:
 *
 *   Stance and risk are ORDERED levels, so they take the ordinal blue ramp —
 *   one hue, light to dark. Painting "gap / partial / strong" in three different
 *   hues would encode an order as an identity, which is the classic mistake.
 *
 *   Confidence in a company fact is a STATE, so it takes the reserved status
 *   palette, and always ships with its text label — never colour alone.
 */

export function StanceChip({ stance }: { stance: Stance }) {
  const label =
    stance === 'strong'
      ? 'Đã làm thật'
      : stance === 'partial'
        ? 'Biết một phần'
        : 'Chưa từng làm';
  return (
    <span className={s.chip} data-ord={stance}>
      {label}
    </span>
  );
}

export function PriorityChip({ priority }: { priority: Priority }) {
  const label =
    priority === 'must'
      ? 'JD bắt buộc'
      : priority === 'should'
        ? 'Nên có'
        : 'Điểm cộng';
  return (
    <span className={s.chip} data-prio={priority}>
      {label}
    </span>
  );
}

export function DifficultyChip({ difficulty }: { difficulty: Difficulty }) {
  const label =
    difficulty === 'warmup'
      ? 'Khởi động'
      : difficulty === 'core'
        ? 'Câu chính'
        : 'Câu sâu';
  return (
    <span className={s.chipQuiet} data-diff={difficulty}>
      {label}
    </span>
  );
}

export function LikelihoodChip({ likelihood }: { likelihood: Likelihood }) {
  const label =
    likelihood === 'near-certain'
      ? 'Gần như chắc hỏi'
      : likelihood === 'likely'
        ? 'Nhiều khả năng'
        : 'Có thể';
  return (
    <span className={s.chip} data-ord={ordOfLikelihood(likelihood)}>
      {label}
    </span>
  );
}

function ordOfLikelihood(l: Likelihood): Stance {
  if (l === 'near-certain') return 'strong';
  if (l === 'likely') return 'partial';
  return 'gap';
}

export function RiskChip({ risk }: { risk: Risk }) {
  const label = risk === 'high' ? 'Rủi ro cao' : risk === 'medium' ? 'Rủi ro vừa' : 'Rủi ro thấp';
  return (
    <span className={s.chipStatus} data-risk={risk}>
      <span className={s.dot} aria-hidden="true" />
      {label}
    </span>
  );
}

export function ConfidenceChip({ confidence }: { confidence: Confidence }) {
  const label =
    confidence === 'verified'
      ? 'Đã kiểm chứng'
      : confidence === 'reported'
        ? 'Một nguồn nói'
        : 'Chưa rõ';
  return (
    <span className={s.chipStatus} data-conf={confidence}>
      <span className={s.dot} aria-hidden="true" />
      {label}
    </span>
  );
}

export function StatusChip({ status }: { status: StarStatus }) {
  const label =
    status === 'rehearsed'
      ? 'Đã luyện'
      : status === 'written-not-rehearsed'
        ? 'Đã viết, chưa luyện'
        : 'Mới, chưa luyện';
  return (
    <span className={s.chipStatus} data-star={status}>
      <span className={s.dot} aria-hidden="true" />
      {label}
    </span>
  );
}
