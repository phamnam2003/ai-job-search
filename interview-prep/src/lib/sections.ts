import { prep } from '@/content/nanyang-r1';
import { isBreak } from '@/content/types';
import { k } from './keys';

/**
 * The nav, and — in the same place — which progress keys each section owns.
 *
 * Keeping them together is deliberate: the rail shows a fill per section, and a
 * section whose keys drift away from its page would quietly show the wrong fill
 * forever. One definition, no drift.
 */

export type SectionId =
  | 'tong-quan'
  | 'lo-trinh'
  | 'hau-can'
  | 'ky-thuat'
  | 'star'
  | 'cau-hoi'
  | 'the-ghi-nho'
  | 'mo-phong'
  | 'ho-so'
  | 'cong-ty';

export interface Section {
  id: SectionId;
  href: string;
  label: string;
  /** Shown under the label in the rail. */
  blurb: string;
  /** Rail glyph — a 24×24 viewBox path. */
  icon: string;
  /** Sections with no tickable items (dashboards) report no fill. */
  tracked: boolean;
}

export const SECTIONS: Section[] = [
  {
    id: 'tong-quan',
    href: '/',
    label: 'Tổng quan',
    blurb: 'Còn bao lâu, đang hụt ở đâu',
    icon: 'M3 17.5 8.5 11l4 4L21 6.5M21 6.5h-5m5 0v5',
    tracked: false,
  },
  {
    id: 'lo-trinh',
    href: '/lo-trinh',
    label: 'Lộ trình',
    blurb: 'Lịch theo giờ, tick từng việc',
    icon: 'M4 6h16M4 12h10M4 18h13M4 3v18',
    tracked: true,
  },
  /* Second, directly under the schedule and above every revision section. This
     is the only part of the app whose deadline is tonight: the round moved to
     Google Meet, and a checklist read on Friday morning is a checklist read too
     late. Everything below this is revision, and revision can slip an hour and
     survive — a headset he does not own by tonight cannot. */
  {
    id: 'hau-can',
    href: '/hau-can',
    label: 'Hậu cần',
    blurb: 'Buổi này chạy trên Google Meet',
    // A video camera: rounded body + the lens wedge. Chosen because it is the
    // one glyph in the rail that cannot be mistaken for "more reading" — and it
    // reads at 16px, which a signal-bars or a plug icon does not.
    icon: 'M4.5 6.5h9a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-9a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2ZM15.5 11l5-3v8l-5-3Z',
    tracked: true,
  },
  {
    id: 'ky-thuat',
    href: '/ky-thuat',
    label: 'Kiến thức',
    blurb: 'Từng chủ đề JD yêu cầu',
    icon: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 0-3 3V4ZM19 20a3 3 0 0 0-3 3',
    tracked: true,
  },
  {
    id: 'star',
    href: '/star',
    label: 'Chuyện STAR',
    blurb: 'Kể chuyện, có ranh giới rõ',
    icon: 'M12 3.5 14.6 9l6 .9-4.3 4.2 1 6-5.3-2.8L6.7 20l1-6L3.4 9.9 9.4 9 12 3.5Z',
    tracked: true,
  },
  {
    id: 'cau-hoi',
    href: '/cau-hoi',
    label: 'Ngân hàng câu hỏi',
    blurb: 'Gap · khó · HR · hành vi',
    icon: 'M9.2 9a2.8 2.8 0 1 1 3.8 2.6c-.8.4-1 1-1 1.9M12 17.2h.01M4 5h16v14H4z',
    tracked: true,
  },
  {
    id: 'the-ghi-nho',
    href: '/the-ghi-nho',
    label: 'Thẻ ghi nhớ',
    blurb: 'Lật thẻ, tự chấm 1–3',
    icon: 'M7 4h13v13H7zM4 7v13h13',
    tracked: true,
  },
  {
    id: 'mo-phong',
    href: '/mo-phong',
    label: 'Mô phỏng',
    blurb: 'Bấm giờ, nói thành tiếng',
    icon: 'M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3ZM5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3',
    tracked: false,
  },
  {
    id: 'ho-so',
    href: '/ho-so',
    label: 'Hồ sơ nhất quán',
    blurb: 'Bảo vệ từng dòng trên giấy',
    icon: 'M12 3.2 20 6v6c0 4.6-3.3 7.6-8 8.8-4.7-1.2-8-4.2-8-8.8V6l8-2.8ZM9 12l2.2 2.2L15.5 10',
    tracked: true,
  },
  {
    id: 'cong-ty',
    href: '/cong-ty',
    label: 'Về công ty',
    blurb: 'Sự thật + câu hỏi ngược',
    icon: 'M4 20V7l7-3 7 3v13M4 20h16M9 20v-4.5h4V20M8 10h.01M12 10h.01M16 10h.01',
    tracked: true,
  },
];

export const sectionByHref = new Map(SECTIONS.map((s) => [s.href, s]));

/** Longest-prefix match, so `/star/stm-performance` lights up `/star`. */
export function activeSection(pathname: string): Section | undefined {
  if (pathname === '/') return SECTIONS[0];
  return SECTIONS.filter((s) => s.href !== '/')
    .filter((s) => pathname === s.href || pathname.startsWith(`${s.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
}

/* --------------------------------------------------------- key derivation */

function roadmapKeys(): string[] {
  const out: string[] = [];
  for (const day of prep.roadmap) {
    day.items.forEach((item, i) => {
      if (!isBreak(item)) out.push(k.block(day.id, i));
    });
    (day.extras ?? []).forEach((_, i) => out.push(k.extra(day.id, i)));
  }
  return out;
}

function topicKeys(): string[] {
  const out: string[] = [];
  for (const t of prep.topics) {
    out.push(k.topic(t.id));
    t.concepts.forEach((_, i) => out.push(k.concept(t.id, i)));
    t.questions.forEach((_, i) => out.push(k.topicQ(t.id, i)));
  }
  return out;
}

function cardKeys(): string[] {
  const out: string[] = [];
  for (const t of prep.topics) {
    t.flashcards.forEach((_, i) => out.push(k.card(t.id, i)));
  }
  return out;
}

function starKeys(): string[] {
  const out: string[] = [];
  for (const s of prep.stars) {
    out.push(k.star(s.id));
    s.followUps.forEach((_, i) => out.push(k.starFollow(s.id, i)));
  }
  return out;
}

/**
 * The progress key for one logistics row.
 *
 * Exported rather than kept private, and deliberately the only key shape that
 * does not live in `k`: the logistics keys are addressed by exactly one page and
 * by the fill for exactly one rail node, both defined from this file. Keeping
 * the shape next to the derivation is the same "one definition, no drift" rule
 * the rest of this module is built on. Kebab-case ids come straight from the
 * content, so a renamed item orphans only its own tick.
 */
export const logisticsKey = (id: string) => `logi:${id}`;

const logisticsKeys = () => prep.logistics.map((x) => logisticsKey(x.id));
const bankKeys = () => prep.bank.map((q) => k.bank(q.id));
const claimKeys = () => prep.consistency.map((c) => k.claim(c.id));
const companyKeys = () => [
  ...prep.company.facts.map((f) => k.fact(f.id)),
  ...prep.company.questionsToAsk.map((q) => k.ask(q.id)),
];

/** Every tracked key, grouped by the section that owns it. */
export const SECTION_KEYS: Record<SectionId, string[]> = {
  'tong-quan': [],
  'lo-trinh': roadmapKeys(),
  'hau-can': logisticsKeys(),
  'ky-thuat': topicKeys(),
  star: starKeys(),
  'cau-hoi': bankKeys(),
  'the-ghi-nho': cardKeys(),
  'mo-phong': [],
  'ho-so': claimKeys(),
  'cong-ty': companyKeys(),
};

/** Every key in the app — the denominator for the overall readiness number. */
export const ALL_KEYS: string[] = Object.values(SECTION_KEYS).flat();

/**
 * The keys that represent something he has to SAY, not merely read. The plan's
 * governing rule is that spoken rehearsal is what moves the needle, so the
 * dashboard reports this separately from "read everything".
 *
 * Logistics keys are NOT here, and that is a decision rather than an omission:
 * plugging in a headset is done or not done, never "said out loud". Folding that
 * many chores into the denominator would halve the one number that measures
 * rehearsal while he rehearses exactly as much as before.
 */
export const SPOKEN_KEYS: string[] = [
  ...starKeys(),
  ...bankKeys(),
  ...prep.company.questionsToAsk.map((q) => k.ask(q.id)),
];
