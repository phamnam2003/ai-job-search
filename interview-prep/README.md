# interview-prep

A local revision app for one specific interview: **Nanyang Biologics Vietnam — Junior Full Stack Engineer (Patient 360), Round 1, Fri 25/09/2026, 10:00 Hanoi time, over Google Meet, conducted in Vietnamese.** The interviewer is Mr. Thanh, Senior Software Developer — an engineer, not a recruiter, which is why the answers are pitched at a technical listener. Only the interview is remote; the job itself is onsite.

It is not a roadmap page. The revision material itself lives in here — 11 technical topics, 7 STAR stories, 54 likely questions with model answers, 140 flashcards, 25 CV/cover-letter lines that have to survive a drill, and 19 verified facts about the company. 521 trackable items in total.

The app UI is in Vietnamese because the interview is. Code, comments and this file are in English.

## Run it

```bash
npm install          # once
npm run dev          # http://localhost:3000
```

For the real thing (faster, and what was verified):

```bash
npm run build
npm start
```

## Checks

```bash
npx tsc --noEmit     # types
npx eslint src       # lint — `next lint` was removed in Next 16
npx next build       # 31 routes, mostly static
```

## Routes

| Route | What it is |
|---|---|
| `/` | Countdown, where you stand, how the revision minutes split, what to do first if time runs short |
| `/lo-trinh` | The three study sessions drawn to scale, with where the clock has got to — what is finished, what is running, what is next |
| `/ky-thuat`, `/ky-thuat/[id]` | The 11 topics the JD asks for, weakest first — concepts, drill questions, flashcards |
| `/star`, `/star/[id]` | 7 STAR stories, each with the scope line it must not overstate |
| `/cau-hoi` | The 54-question bank, filterable by group, likelihood and spoken/not |
| `/the-ghi-nho` | Flashcards, self-rated 1–3 |
| `/mo-phong` | Timed mock: a question, a clock, and no answer until you have said yours |
| `/ho-so` | Every claim the CV and cover letter made, by how likely it is to be drilled |
| `/cong-ty` | What could actually be verified about NYB, with the source and the sentence to say |
| `/hau-can` | Remote pre-flight — audio, network, light, what is on screen, and what to do if the line drops |

## How it is built

- **Next.js 16 App Router, React 19, TypeScript. No Tailwind** — CSS Modules over design tokens in `src/styles/tokens.css`.
- **Content is data, not markup.** Everything authored lives in `src/content/nanyang-r1/*.ts` against the types in `src/content/types.ts`. Pages render it; they do not contain it. To change a question, edit `bank.ts`.
- **Progress is local only.** `src/lib/progress.tsx` keeps every tick, rating and "said out loud" flag in `localStorage` under `nyb-prep-v1`, via `useSyncExternalStore` so SSR and hydration agree and two tabs stay in sync. There is no server and nothing is sent anywhere. Clearing site data resets it.
- **Nothing is written relative to now.** The content says "tối 24/09", never "tối nay", and a roadmap day's tag says what the session is *for*. Past / running / upcoming is derived from `day.iso` and the browser clock in `src/lib/schedule.ts` — the first draft labelled a day "Tối nay" and it was lying within a day.
- **Charts follow one rule set.** Ordered levels (gap/partial/strong, risk high/medium/low, likelihood) are always one hue darkening — never three separate hues — with a legend, direct labels and a table twin. The lightest step carries its own `-ink` token because white is not legible on it.
- **Dark mode is selected, not flipped** — its own steps against the dark surface, chosen in `tokens.css`.

`scripts/gen-content.mjs` and `scripts/apply-patches.mjs` were authoring aids for the initial content pass; the generated output is committed, so they are not needed to run the app.

## Notes

- `AGENTS.md` is written by `next dev` itself, not by hand. Leave it in place.
- This repository is public. No salary figure — actual or expected — belongs in here.
