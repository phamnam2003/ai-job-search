/**
 * Content model for the interview prep app.
 *
 * Everything the app renders is data. One interview = one folder under
 * `src/content/<slug>/`, exporting a `PrepSet`. Adding a future interview means
 * adding a folder, not touching a component.
 *
 * Grounding rule carried over from the repo: nothing in here may claim
 * experience the candidate does not have, and no salary figure appears anywhere
 * (this repository is public).
 */

/* ---------------------------------------------------------------- technical */

export type Priority = 'must' | 'should' | 'nice';

/** Where the candidate actually stands on a topic — an ORDERED level. */
export type Stance = 'strong' | 'partial' | 'gap';

export type Difficulty = 'warmup' | 'core' | 'stretch';

export interface Concept {
  term: string;
  body: string;
  /** Optional illustrative snippet. Empty string when there is none. */
  code: string;
  /** Highlight hint: go | ts | sql | cypher | bash | json | yaml | '' */
  lang: string;
}

export interface TopicQuestion {
  q: string;
  a: string;
  /** The mistake to avoid. Empty string when there is none. */
  trap: string;
  difficulty: Difficulty;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface Topic {
  id: string;
  title: string;
  tagline: string;
  /** The JD line this topic maps to, quoted. */
  jdHook: string;
  priority: Priority;
  stance: Stance;
  stanceNote: string;
  estMinutes: number;
  concepts: Concept[];
  questions: TopicQuestion[];
  flashcards: Flashcard[];
  /** The honest sentence for when he does not know. Empty when stance is strong. */
  bridgeIfUnknown: string;
  traps: string[];
}

/* -------------------------------------------------------------------- stars */

export type StarStatus = 'rehearsed' | 'written-not-rehearsed' | 'new';

export interface StarFollowUp {
  q: string;
  a: string;
}

export interface Star {
  id: string;
  title: string;
  company: string;
  period: string;
  /** 1 = reach for this first in this room. */
  priority: number;
  oneLiner: string;
  useFor: string[];
  openWith: string;
  situation: string;
  task: string;
  action: string;
  result: string;
  landingLine: string;
  /** What the story is NOT — stated unprompted so it cannot be over-read. */
  boundaries: string[];
  /** What to say if the interviewer inflates the scope. Empty when N/A. */
  scopeGuard: string;
  followUps: StarFollowUp[];
  status: StarStatus;
}

/* ---------------------------------------------------------- question bank */

export type QuestionCategory =
  | 'gap'
  | 'tough'
  | 'hr'
  | 'behavioral'
  | 'role'
  | 'closing';

export type Likelihood = 'near-certain' | 'likely' | 'possible';

export interface BankQuestion {
  id: string;
  category: QuestionCategory;
  q: string;
  a: string;
  why: string;
  trap: string;
  likelihood: Likelihood;
  /** Star id to reach for, or empty string. */
  relatedStar: string;
}

/* ------------------------------------------------------------------ company */

export type Confidence = 'verified' | 'reported' | 'unknown';

export interface CompanyFact {
  id: string;
  title: string;
  body: string;
  /** The precise phrasing to use. Empty when N/A. */
  sayThis: string;
  /** The phrasing that would be wrong. Empty when N/A. */
  neverSay: string;
  confidence: Confidence;
  source: string;
}

export interface AskQuestion {
  id: string;
  q: string;
  why: string;
  priority: number;
  /** One of the four to keep when time is short. */
  keepIfOnlyFour: boolean;
}

export interface CompanyBrief {
  facts: CompanyFact[];
  questionsToAsk: AskQuestion[];
  unknowns: string[];
}

/* -------------------------------------------------------------- consistency */

export type Risk = 'high' | 'medium' | 'low';

export interface ConsistencyClaim {
  id: string;
  claim: string;
  where: string;
  mustDefend: string;
  risk: Risk;
  drillQ: string;
  drillA: string;
}

/* ----------------------------------------------------------------- roadmap */

export type ActivityKind = 'speak' | 'write' | 'read' | 'admin';

export interface RoadmapBlock {
  /** Clock start, "HH:MM". */
  s: string;
  /** Clock end, "HH:MM". */
  e: string;
  /** Duration in minutes. */
  m: number;
  kind: ActivityKind;
  title: string;
  info: string;
  /** Deep links into the app for this block, e.g. ['/star/stm-performance']. */
  links?: { label: string; href: string }[];
}

export interface RoadmapBreak {
  /** Human label for an elided gap, e.g. "nghỉ 7h15". */
  brk: string;
}

export type RoadmapItem = RoadmapBlock | RoadmapBreak;

export function isBreak(i: RoadmapItem): i is RoadmapBreak {
  return 'brk' in i;
}

export interface RoadmapDay {
  id: string;
  /** "Thứ 4" */
  label: string;
  /** "23/09" */
  date: string;
  /** "Tối nay" */
  tag: string;
  items: RoadmapItem[];
  /** Optional end marker, e.g. the interview itself. */
  cap?: { t: string; n: string };
  /** Extra checklist rows that are not timed blocks. */
  extras?: { when: string; what: string; note: string }[];
}

export interface CutListEntry {
  rank: number;
  title: string;
  why: string;
}

/* -------------------------------------------------------------------- meta */

export interface PrepMeta {
  slug: string;
  company: string;
  role: string;
  round: string;
  /** ISO local datetime of the interview, e.g. "2026-09-25T10:00". */
  startsAt: string;
  /** Display date, e.g. "Thứ 6, 25/09/2026". */
  dateLabel: string;
  location: string;
  format: string;
  language: string;
  /** Source files in the repo this content was built from. */
  sources: string[];
  /** Open warnings carried from the prep doc. */
  warnings: string[];
}

export interface PrepSet {
  meta: PrepMeta;
  topics: Topic[];
  stars: Star[];
  bank: BankQuestion[];
  company: CompanyBrief;
  consistency: ConsistencyClaim[];
  roadmap: RoadmapDay[];
  cutList: CutListEntry[];
}
