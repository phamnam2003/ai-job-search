---
framework_version: 1.0.0
---

# Interview Preparation Guide

<!-- SETUP: STAR examples are personalized by running /setup based on your actual experience -->

## Live prep material — read these first when an interview is scheduled

<!-- Registered by /setup on 2026-08-24. These are working documents written for specific
     interviews, not framework files. This file holds the reusable answers; those hold the
     dated plan and drill schedule for one particular round.
     Deliberately kept out of the table below: figures, referrer identities, and anything
     naming what is on the table. This repository is public — read the plan itself for those. -->

Interview-specific plans live in `documents/interview/`, not in this file. Check there before
building anything new — the material is usually already written. The table says only what each
file *is*, not what is in it:

| File | What it holds |
|------|---------------|
| `2026-10-01_ke-hoach-on-luyen_cong-ty-truy-xuat-nguon-goc.md` | The active plan — a dated drill schedule running to the 01/10/2026 interview. Format that round tests for: project deep-dive, live Go coding, system design. Read it in full when preparing; it also carries that round's compensation approach, which is not repeated here. |
| `2026-10-01_ngan-hang-cau-hoi.md` | The question bank that plan drills against — one exercise per evening, spoken aloud and timed at 60–90s, self-scored. Not a document to read through. |
| `2026-08_ke-hoach-phong-van_cong-ty-anh-ho.md` | Earlier plan (10/08) for the same company, **not executed**. The speaking script and the compensation half are still usable. Also the source for the "concedes value pre-emptively" trait in `02-behavioral-profile.md`. |

**One standing instruction carried out of those plans:** fix an overstated CV line *on paper,
before the room*. Correcting yourself in front of an interviewer who was vouched for you costs
the person who vouched, not just you. See the "Architected the system" issue logged under
Key Projects in `01-candidate-profile.md`.

> **Status of that specific line, checked 2026-09-03.** All four `cv/*.tex` files are clean — the
> word does not appear in any of them. It survives only in the f8.edu.vn-built PDF under
> `documents/cv/`, which is a source document for building CVs rather than one he submits. So
> there is nothing in circulation to retract. The prepared script for "what if the referrer
> remembers the old wording" (§4.1 of the 01/10 plan) is still worth rehearsing, but it is now a
> courtesy rather than a repair.

## STAR Format

Structure answers as: **Situation** (context), **Task** (your responsibility), **Action** (what you did), **Result** (outcome).

Keep answers to 1-2 minutes. Be specific. End with what you learned or would do differently.

## Ready-Made STAR Examples

<!-- Seeded by /setup on 2026-07-15 from CV projects + behavioral answers. Results filled in on
     2026-08-05 from Pham Hai Nam's own account of each project. Every figure below came from him;
     none are estimated or inferred. Do not add numbers here without asking him first. -->

**Interview order — lead with the strongest:**

1. **Sacombank STM** — the only story with hard numbers. Use it for performance, debugging, and distributed-systems questions.
2. **SkyReality** — design ownership. Use it for system-design and "you will own the backend" questions.
3. **Leeon Group** — taking over a codebase with no handover. Use it for ambiguity and onboarding questions, and for Go concurrency (race conditions in live services).
4. **gRPC / challenges** — this is a *learning* answer, not an achievement answer. Never present it as work experience.

### Design ownership on SkyReality (system design & DB modeling)
**Source:** CV — SkyReality, backend developer, team of 7 (03/2026–present)
**What happened:** Given a new real-estate lead-management platform, you proposed the lead and campaign data model plus the backend stack for the modules you owned — the design was reviewed and approved by the team before build — then built the core modules and webhook-based event ingestion from Zalo/Slack/Telegram.
**Scope guard (corrected 2026-08-08):** this is design ownership of *your modules*, reviewed and approved by others. Never say "architected the system", "owned the architecture end to end" or "sole architect" — not on paper, not in the room. If an interviewer restates it that way, correct them immediately: *"Để em nói chính xác hơn: em đề xuất, team review và duyệt trước khi build."*
**Why it matters:** Best evidence for "you will own the backend" / system-design / data-modeling questions, and for how you make architectural decisions (your stated "research deeply, then commit" style).
**S/T/A/R:**
- Situation: New real-estate lead platform, greenfield backend, team of 7. The product had to reach a partner demo, and the business requirements were not fully specified up front.
- Task: Decide the data model and backend architecture, and deliver something that met the demo's business requirements rather than just compiled.
- Action: Researched competitors' platforms first to work out what the product actually had to do, then derived the system design from that. Modeled the schema in PostgreSQL; chose Gin + Kafka + Redis + uber-go/dig; built webhook event processing, OAuth2 Google Sign-In, and multipart upload with checksum verification.
- Result: The demo succeeded, and the product is still being presented to further partners. Getting the design right up front is what let the team ship features fast enough to finish the product on time. The webhook layer became the foundation the team is now building AI bots on, collecting messages from Slack, Zalo and Telegram groups.

> **Honesty note — no production metrics exist.** The platform is at demo stage, so there is no lead volume, throughput or latency figure to give. If asked, say so plainly: *"It hasn't gone to production yet, so I don't have traffic numbers. What I can tell you is the design decisions and why I made them."* Do not reach for a number here; the design reasoning is the substance of this answer anyway.

### Async pipelines & bottleneck removal on Sacombank STM (performance / distributed)
**Source:** CV — Sacombank Smart Teller Machine, backend developer, team of 8 (11/2025–01/2026)
**What happened:** On a live self-service banking system, you rebuilt data import/export as async pipelines, added step-level transaction logging, and resolved duplicate-data issues that were causing performance bottlenecks.
**Why it matters:** **Your strongest story, by a wide margin.** It is the only one with hard before/after numbers, it has a real root-cause diagnosis, and it happened on a live banking system. Use it for "tell me about a time you fixed a performance problem", for debugging questions, and for anything about working under production constraints.
**S/T/A/R:**
- Situation: STM data export was failing outright, not just running slowly. The export job either timed out or was OOM-killed, so there were times when no file could be produced at all. When it did complete, the output contained heavy duplication.
- Task: Make export actually finish reliably, and make the output usable for reconciliation.
- Action: Diagnosed the root cause as memory pressure — the query path was holding far too much data in memory across successive query rounds. Split the queries into pages so memory stayed bounded, and filtered duplicate records out of the export path. Also built asynchronous import/export pipelines, added step-level transaction logging across STM workflows, and applied dependency injection to decouple the components.
- Result: On the same dataset, the export went from **167.8 MB to 16 MB** — roughly a 90% reduction, almost all of it duplicate records that should never have been there. **OOM kills were eliminated** by the query pagination, and timeouts essentially stopped occurring.

> **Delivering this one:** lead with the failure, not the fix — "the export was getting OOM-killed, so sometimes there was simply no file" is a much stronger opening than "I optimized an export". The 167.8 MB → 16 MB figure is your single most quotable number; state it once, clearly, and let them ask the follow-up. Be ready for "how did you find it?" — the answer is that the symptom was memory, and the two causes (unbounded query result sets, and duplicate rows) were separate problems that both showed up as the same crash.

### Taking over an inherited Go codebase (ownership of ambiguous work)
**Source:** CV — Leeon Group, frontend & backend developer (06/2024–10/2025)
**What happened:** Team members left with no handover. You took over an unfamiliar production Go codebase, learned it from the code itself, and kept it running — maintaining, debugging and fixing defects in live services, including race conditions.
**Why it matters:** Answers "tell me about a time you had to own something unfamiliar" and "how do you get up to speed". The race-condition work is a genuine Go concurrency credential on its own — it is a hard class of bug to find, and interviewers who write Go know that.
**S/T/A/R:**
- Situation: The original authors left. Production Go services wired into CI/CD had to keep running, and there was no documentation and no handover — the code was the only source of truth.
- Task: Take over the codebase and keep the products depending on it working, safely, without the people who wrote it.
- Action: Read into the code to learn its conventions and structure rather than rewriting to your own style, then maintained and debugged it in production — including race conditions in the concurrent paths. Over the same period you built out the observability stack (Prometheus, Grafana, Loki, OpenTelemetry) and worked with RabbitMQ, Redis/Ristretto, the Worker Pool pattern and gRPC with mTLS.
- Result: The services stayed running under your ownership with no handover from the original team, and the race conditions you found and fixed were real concurrency defects in code that was already live.

> **One boundary to hold: this was maintenance, not new feature development.** If asked "what did you build there?", the honest answer is that the build work at Leeon was the observability stack and the messaging/caching layer, not new features in the inherited codebase — the inherited work was keeping it correct and running.
>
> **Turn that into your advantage.** Maintenance with no new build is a stated drain for you, and this role is exactly where that came from. It is a clean, non-negative link to the "why are you looking?" answer: you have done the keep-it-alive work, you did it properly, and now you want to be building. That reads as self-knowledge rather than complaint.

### Depth-first self-study: gRPC and the challenges repo (how you learn)

**Source:** GitHub — go-http-server/grpc, phamnam2003/challenges
**What happened:** You built gRPC from the protocol up (all four method types, interceptors, three TLS modes, underlying crypto) and authored a structured Go curriculum (20 GoF patterns, 18+ algorithm solutions, Kafka/ScyllaDB/OTel deep dives).
**Why it matters:** This is your answer to *"how do you learn something new?"* and your ammunition for design-pattern and DSA rounds. It is **not** an achievement story and must never be presented as work experience.
**S/T/A/R:**
- Situation: You wanted to understand gRPC and the distributed-systems building blocks properly, not just call the client API.
- Task: Learn them well enough to build them and explain them from first principles.
- Action: Implemented gRPC down to TLS/AEAD/Diffie-Hellman; worked through mTLS configuration, retry configuration, telemetry and interceptors; wrote all 20 Gang-of-Four patterns in Go; documented the architecture in Mermaid.
- Result: Working knowledge of how gRPC actually behaves on the wire — the configuration surface for mTLS, retries and telemetry — plus a solid grasp of the design patterns. **These repositories are self-study**, done alongside the applied gRPC/mTLS work in the Leeon Group role. They are public, so the claim is verifiable, which is what gives it weight.

> **Say "these repos were self-study" out loud.** Volunteering the boundary is what makes the rest of your answers credible — an interviewer who catches you blurring study and production work will discount everything else you said. Delivered honestly it is a genuine strength: very few mid-level candidates can explain gRPC below the API surface, and the repo proves you can.

> 🎯 **Rehearse the gRPC/mTLS bullet specifically.** You have said you are not 100% confident on it, and it is the single most likely bullet on your CV to be drilled — a backend interviewer sees "mutual TLS, metadata, interceptors, streaming" and goes straight at it. Three questions to have solid answers for before any interview:
> 1. *"Walk me through what mTLS actually does that TLS doesn't."* — client presents a certificate too, so the server authenticates the caller rather than just the caller authenticating the server. You have the crypto background for this from the repo; make sure you can say it in two sentences.
> 2. *"What did you use interceptors for?"* — answer from the real work at Leeon, not from the repo. If the honest answer is logging and auth, say logging and auth.
> 3. *"Why gRPC instead of REST here?"* — the standard answer is typed contracts, streaming, and lower overhead on internal service-to-service calls. Be ready to say where it would have been the wrong choice too; that reads as judgement rather than enthusiasm.
>
> If a question goes past what you did, the safe move is the boundary sentence: *"That part I know from building it myself rather than from production — here's what I understand about it."* That answer never loses you a role. A bluff that collapses does.

### Event-ticketing thesis: designing for the sales-open spike (system design)

*(Added by /setup 2026-09-03.)*

**Source:** Final-year thesis, Hanoi Open University — university work, not employment.
**What happened:** You built an event-ticket sales platform, and made the *engineering* subject of
the thesis surviving the traffic spike at the moment tickets go on sale rather than the CRUD
around it.
**Why it matters:** This is the one item on your record where high-concurrency design is the stated
subject, and "ticket sales spike" is a system-design scenario an interviewer recognises instantly —
it is a standard whiteboard problem you have actually built. Use it for *"design a system that
handles a traffic burst"*, *"how do you prevent double-booking?"*, and *"tell me about a technical
decision you made"*. Pair it with the STM export fix as evidence the interest in load is not
theoretical.
**S/T/A/R:**
- Situation: Ticket sales for an event open at a fixed moment, so essentially all of the day's
  traffic arrives in the first minutes — and the same seat can be requested by many people at once.
- Task: Keep the system correct (no seat sold twice) and available (no collapse) through that
  window.
- Action: Put a queue / virtual waiting room in front of the booking path so the burst is flattened
  before it reaches the database; used distributed locking with a TTL-based temporary hold on seat
  reservation so a seat under consideration cannot be taken by a second buyer, and is released
  automatically if checkout is abandoned; cached the seat and inventory map in Redis so the read
  path did not touch the database, and rate-limited the purchase endpoint with bot/spam protection
  to stop scripted buying consuming the capacity.
- Result: A design that holds correctness under concurrency and degrades by making people wait
  rather than by failing. **State it as a design, not as a measurement.**

> ⚠️ **Two boundaries to say out loud.**
> **This is university work** — name it as the thesis before describing it, the same way you name
> the GitHub repos as self-study. The credibility comes from volunteering the boundary.
> **It was not load-tested.** You have no throughput numbers, so never say "handled N concurrent
> users" or quote a latency figure. If asked how you'd verify it, that is a good question to answer
> rather than dodge: load-generate against the booking endpoint, watch queue depth and lock
> contention, and find where it breaks. Saying "I designed for it but didn't measure it, and here's
> how I'd measure it" is a stronger answer than an invented number, and an interviewer who has
> built this kind of system will know the difference immediately.

## STAR Candidates (Complete Manually)

<!-- Added by /setup Path A on 2026-09-03. Stubs only — Path A does not draft STAR answers.
     Fill in situation/task/action/result in your own words before using this in a room. -->

### Standing up a Kubernetes cluster from scratch on VMware
**Source:** His own infrastructure work — recorded in `01-candidate-profile.md` under
Infrastructure & Observability, and named as a lead story in the 01/10 interview plan.
**What happened:** He built a Kubernetes cluster himself on VMware — control plane, both CNIs
(Calico on iptables and Cilium on eBPF), Envoy Gateway and Nginx Ingress — then deployed real
workloads onto it through ArgoCD with OpenTelemetry, Prometheus, Grafana and Loki on top.
**Why it matters:** Every ready-made example above is application-layer. This is the only
infrastructure story, and it is the strongest available answer to *"you haven't used
AWS/GCP/Azure"* — assembling a cluster is a harder thing than consuming a managed one. At a small
company where nobody owns this layer it is also the clearest differentiator he has.
**Two boundaries to hold:** it is self-built infrastructure, not production operations at scale —
say so unprompted, the same way the GitHub repos are named as self-study. And do not let it turn
the conversation into a DevOps interview: infra is a capability he brings, not the role he wants
(see `02-behavioral-profile.md` → Mapping to Job Posting Language).
**S/T/A/R stub:**
- Situation:
- Task:
- Action:
- Result:

## Common Tough Questions

<!-- Drafted by /setup on 2026-08-05. Written in English to match this file; the interviews these
     target are Vietnamese-language (see the Languages table in 01-candidate-profile.md), so
     rehearse your own Vietnamese phrasing from these points rather than translating live. -->

### "Giới thiệu về bản thân" / "Tell me about yourself" — the opening answer

*(Drafted 2026-08-07 from his stated direction: drawn to Rust, Linux and distributed systems; short-term wants deeper systems understanding; long-term wants to be a technical leader within 4–5 years.)*

Almost always the first question. **Four sentences, ~40 seconds** — who you are, the proof, short term, long term. Deliberately short: this is an opener, not the interview. Leave the detail for them to pull out with follow-ups; a long intro gets interrupted and buries the ending.

**Vietnamese — the version he will deliver:**

> Em là fullstack developer khoảng ba năm, làm cả frontend và backend nhưng nghiêng nhiều về backend với Go; ở AIONtech em sở hữu thiết kế hệ thống — mô hình dữ liệu và backend stack — cho nền tảng bất động sản SkyReality và hệ thống document-AI cho C06. Trước đó ở dự án Sacombank STM, luồng export bị OOM-kill, em tìm ra nguyên nhân là query không giới hạn kết quả cộng với bản ghi trùng, phân trang lại và lọc trùng, cùng tập dữ liệu giảm từ 167.8 MB xuống 16 MB. Ngắn hạn em muốn đi sâu xuống tầng dưới của Kafka, gRPC, worker pool — hiểu đến mức giải thích được vì sao chúng hỏng và tune được; em cũng đang tự học Rust, ở mức cá nhân, chưa ship trong công việc. Dài hạn bốn đến năm năm, em muốn là người chịu trách nhiệm kiến trúc của một hệ thống lớn hơn — technical lead theo nghĩa chiều sâu kỹ thuật, không phải quản lý con người.

**English — for written forms or an English round:**

> I'm a fullstack developer with about three years of experience, across frontend and backend but leaning backend in Go; at AIONtech I've owned the system design — data model and backend stack — for the SkyReality real-estate platform and a document-AI system for C06. Before that, on Sacombank's Smart Teller Machine, the export path was being OOM-killed; I traced it to unbounded query result sets plus duplicate rows, paginated the queries and de-duplicated the output, and the same dataset went from 167.8 MB to 16 MB. Short term I want to go a layer below the tools I use daily — Kafka, gRPC, worker pools — understanding them well enough to explain why they fail and to tune them; I'm also learning Rust on my own time, nothing shipped professionally. Longer term, in four or five years, I want to be responsible for the architecture of a larger system — technical leadership in the depth sense, not people management.

**Four rules for delivering it:**

- **Say "chưa ship trong công việc" about Rust, in the same sentence.** He has zero Rust on his record. Volunteering it costs nothing and removes the trap; letting the interviewer find it costs the credibility of everything else. Same principle as the self-study boundary on the `challenges` repo.
- **Never say "em thích Linux".** At three years it reads junior, and Linux is already on the CV. It lives inside the systems-depth clause or not at all.
- **Stop after the fourth sentence.** Do not expand into the STM story — one clause is the hook; the diagnosis belongs in the dedicated answer if they ask. Reusing the 167.8 MB → 16 MB figure twice in one interview is fine, but state it the same way both times.
- **The order matters:** depth first, leadership second. Technical depth is what earns architectural authority, and that authority is what a tech lead has. Said in that order the two halves reinforce each other instead of pulling apart.

**Follow-ups to have ready:**

1. *"Em đã làm gì với Rust rồi?"* — **most likely, and there is currently no strong answer.** Say what's true: reading and small exercises, nothing shipped. Bridge to real systems depth — gRPC built from the protocol up through TLS/AEAD/Diffie-Hellman (gap table below). **Best fix: one small public Rust repo before interviewing** — a weekend, and it turns the sentence from aspiration into evidence.
2. *"Tech lead với em nghĩa là gì?"* — architecture ownership and technical direction, versus headcount and performance reviews. He wants the first. This is what keeps the opener consistent with the 5-year answer below.
3. *"Đi sâu hệ thống thì sao lại ứng tuyển vị trí này?"* — tie to the role in front of him; if it has no scale story, drop the depth framing and lead with architecture ownership instead.
4. *"Fullstack thì phần frontend em làm gì?"* — the opener says fullstack, so this follow-up is fair game and he has a real answer: he built the Next.js frontends for SkyReality (Shadcn UI, TanStack Query) and the Sacombank STM admin UI himself, on the same projects where he owned the backend. Say that plainly — the project titles read "Backend Developer", so without this sentence the frontend half of the claim looks unevidenced.

### "Why are you leaving AIONtech after only ~9 months?"

This is the version you will actually be asked — you started 11/2025 and are looking in 08/2026. Do not wait for the softer "why did you leave your previous company"; short tenure is visible on the CV and the interviewer will go straight at it.

**Three rules:** answer the tenure question directly instead of dodging into a general career story; frame it as moving *toward* something, never away from a problem; never criticise AIONtech, a manager, or a colleague. Also do not volunteer that you are applying broadly or that an earlier round went badly.

**Recommended framing — system scale. This is your actual reason** *(confirmed 2026-08-07)*: you want to work on systems at a larger scale than your current scope allows.

> At AIONtech I've owned the database model and the backend stack decisions on two systems — the SkyReality real-estate platform and the C06 document-AI system for the Ministry of Public Security. Making those calls is exactly the work I want. What I'm looking for now is to make them on something bigger: SkyReality is still at demo stage, so the designs I've built haven't been tested by real production load yet. I want to be working on distributed, event-driven systems where the scale is the hard part — where the data model and the service boundaries have to hold up under real traffic. That's not something wrong with AIONtech; it's the next thing I want to learn.

**Why this framing is strong for you.** It is the *true* reason, so it survives follow-up questions. It is forward-looking rather than a complaint. And it is honest about the one thing an interviewer would find out anyway — that your production-scale exposure is limited — while turning that into the motivation rather than hiding it.

**Two follow-ups you will get. Have answers ready:**

1. *"What scale have you actually worked at?"* — Answer plainly. Sacombank STM is your production-load story: a live self-service banking system where the export path was being OOM-killed, and you paginated the queries and de-duplicated the output to take the same dataset from 167.8 MB to 16 MB. SkyReality and C06 are architecture-ownership stories, not scale stories. **Do not blur the two.** Saying "STM is where I've met real production constraints; SkyReality is where I've owned the design" is a much better answer than a vague claim to both.
2. *"What does 'bigger' mean to you?"* — Have something concrete: more traffic, more services, harder consistency requirements, real failure modes. Vague ambition reads as restlessness; a specific technical appetite reads as direction. Tie it to what you already reach for — Kafka, gRPC, worker pools, async pipelines.

**Alternative framing if the posting is clearly not a scale story** (a small team, an internal tool, an early-stage product) — use role scope instead, which is equally true and checkable from your CV:
> My title at AIONtech is Frontend and Backend Developer, and the work genuinely spans both. The part I want to build a career on is the backend and the architecture — that's what I owned on SkyReality and the C06 system, and I want it to be the whole job rather than half of it.

*Compensation/stability* is legitimate but weak as the *stated* reason. Use only if asked directly about salary motivation.

**Do not use:** "there was no growth", "the process was chaotic", "I didn't get along with…". All three read as risk, whether or not they are true.

> ⚠️ **One thing to watch with the scale framing.** If the role you are interviewing for is *also* small-scale, this answer invites "so why us?" Check the posting first: if there is no scale story on their side, switch to the role-scope framing above. Do not tell a company you are leaving for scale they cannot offer.

### "You don't have [specific skill/experience]."

**Structure:** name the gap plainly (1 sentence) → the nearest real thing you have done → evidence you close gaps fast → a concrete timeline. Never bluff; the follow-up question is always deeper than the claim.

**Your real gaps, with the bridge for each:**

| Gap | Bridge |
|-----|--------|
| Managed cloud (AWS/GCP/Azure) | You have run Kubernetes yourself — Calico and Cilium CNI, Envoy Gateway, Nginx Ingress, ArgoCD GitOps, and a full Prometheus/Grafana/Loki/OpenTelemetry stack. The concepts transfer directly; what you lack is the specific console and the managed-service names, which is days, not months. |
| Rust, C/C++ | Say plainly you have not shipped either. Bridge to the systems-level understanding you *do* have: gRPC built from the protocol up through TLS 1.0–1.3, AEAD, Diffie-Hellman and mutual TLS. |
| Flink / stream processing frameworks | You have production Kafka (offset strategies, admin client, `franz-go`) and have built async import/export pipelines on Sacombank STM. The messaging substrate is familiar; the framework is not. |
| Formal leadership / mentoring | You have owned technical direction — architecture and data modeling on two systems — without a people-management title. Say exactly that, and that you want to grow into mentorship. |

**Your evidence for "I close gaps fast"** — use this once, not in every answer: the `challenges` repository is a self-authored curriculum (20 Gang-of-Four patterns in Go, 18+ algorithm solutions, deep dives into Kafka, ScyllaDB, OpenTelemetry, Kubernetes). It is public and verifiable, which is what makes the claim land.

### "Where do you see yourself in 5 years?"

> I want to be the person who owns the architecture of a system end to end — the data model, the service boundaries, the failure modes — and can defend those decisions to a team that pushes back on them. I have already made those calls on two systems at a small scale; in five years I want to be making them on something considerably larger, and to be the person other engineers bring their designs to. That's the technical-leadership track rather than the management one — I want to be trusted with the technical direction, not to be managing headcount.

**Why this works for you:** it matches your stated direction (architecture ownership), it is honest about where you are now (small scale), and the closing line picks a track — technical leadership, not people management — instead of sounding uninterested in growth.

> **Keep this consistent with the opening answer** *(updated 2026-08-07)*. He has stated he wants to be a technical leader within 4–5 years, and the "tell me about yourself" answer above says so. This answer must therefore name the *tech-lead* track, not decline leadership altogether. The distinction to hold in both: **tech lead = architectural authority, still hands-on; engineering manager = people, reviews, hiring.** He wants the first. An earlier version of this answer closed by rejecting "a management title" outright, which contradicted the opening answer — do not restore that phrasing.
>
> **This does not conflict with the search filter.** CLAUDE.md excludes Lead/Senior/Staff/Principal titles from the *job scrape* because at ~3 years those postings are not realistic and dilute the results. That is about which roles to apply for now, not about ambition. Saying "tech lead in 4–5 years" while applying to mid-level roles is coherent, and interviewers read it as intent to stay.

**Adjust per posting:** if the role has no visible technical-leadership path, keep the emphasis on architecture ownership and let the lead ambition sit implicit — do not press a growth track the company cannot offer.

### "What's your biggest weakness?"

> **Read this first — revised 2026-09-03.** Asked in `/setup` to name his growth areas from four
> options, he picked exactly one: **spoken English**. He explicitly did *not* claim
> over-engineering, poor estimation, or neglecting tests and docs. So there are now two different
> questions here, and conflating them is what went wrong in the previous version of this section:
> **what his real weakness is** (English) and **what he should say out loud in a
> Vietnamese-language interview** (not English — see the warning below). Both answers must be true;
> only one of them is the one to volunteer.

**Primary answer for a Vietnamese-language interview** — the collaboration record, which is real and
verifiable from his GitHub:
> Most of what I've built, I've built alone or nearly alone — my own projects, and modules I owned
> end to end at work. My technical record is stronger than my collaboration record: I haven't spent
> much time in a team with a serious code-review culture, and I want that, because the designs I'm
> most confident about are the ones somebody has argued with. That's specifically what I'm looking
> for in the next role, and it's why I ask about the review process in every interview.

This is honest (the public open-source record is genuinely light — Pull Shark ×2), it is not a
disguised strength, and the mitigation is a thing he actually does rather than "I'm working on it".
It also aligns with the environment he says he wants, so it reads as coherent rather than
rehearsed.

**Second answer if they push** — self-advocacy under pushback, from
`documents/interview/2026-08_ke-hoach-phong-van_cong-ty-anh-ho.md`:
> When someone challenges something I've claimed, my instinct is to soften it before they've even
> made the argument. I'll hedge a result I'm actually sure of. I've learned to notice the hedge
> forming and just stop talking instead — the plain fact is usually stronger than the qualified one.

Use this one sparingly and never in a salary conversation, where naming the trait invites the
behaviour.

**Retired answer — do not use as written.** Earlier versions offered "I research too deeply before
committing." He did not select over-research as a weakness in 2026-09-03, and he described his
decision style as *situational* — depth-first only on expensive-to-reverse choices,
working-version-then-iterate when a demo is due. The old answer's "mitigation" (timebox the
research, ship a thin slice early) is something he **already does by default**, which makes the
whole answer a disguised strength. If a live conversation drifts there anyway, tell the truth about
both modes rather than reciting the old script.

> ⚠️ **Do not volunteer English as your weakness answer** in a Vietnamese-language interview. It is
> the honest answer and it is what he'd say if pressed — but raising it unprompted invites the
> interviewer to reconsider the role's language requirements, a scope already filtered out at the
> search stage. Answer honestly if asked directly; never raise it yourself.
>
> **Exception:** for a posting kept alive by the exceptional-match carve-out in
> `04-job-evaluation.md` (live English required, stack too good to drop), the calculation inverts.
> There, English *is* the live risk, and it is better named early and on his own terms — technical
> reading and writing are solid, speaking is the gap, and a written take-home is the format that
> shows his actual level — than discovered in round three.

### "Why this company specifically?"
> Customize per company. Must reference: specific projects, company values, market position, or team structure. Never give a generic answer.

## Questions You Should Ask Interviewers

### About the Role
- "What does a typical week look like in this role?"
- "What would success look like in the first 6 months?"
- "What's the biggest challenge the team is facing right now?"

### About the Team
- "How big is the team, and how do you divide work?"
- "What does the development/project lifecycle look like, from idea to production?"
- "How do you onboard new team members?"

### About Tech & Growth
- "What's your current tech stack for [relevant area]?"
- "Is there room to grow into more architectural or strategic decisions?"
- "How does the team stay current with new tools and methods?"

### About Culture (use these to prevent disappointment)
- "How would you describe the team culture?"
- "What does professional development look like here?"
- "Is there flexibility for remote/hybrid work?"
- "What's the balance between development/new projects and maintenance work?"
- "How would you describe the leadership style in this team?"
- "What do people who thrive here have in common?"

## Phone/Video Interview Tips
- Have STAR examples written out (use this file)
- Keep a glass of water nearby
- Smile when speaking (it changes your tone)
- Ask for clarification if a question is vague
- It's OK to take 5 seconds to think before answering
- End with: "Is there anything else you'd like to know about my background?"

## After the Application (Best Practice)

### Follow-Up Etiquette
- **Don't call to "stand out"** or to learn more about the role post-submission - this risks a negative impression
- If the employer specified a timeline, respect it and wait
- If no timeline was given and significant time has passed (2+ weeks), a brief call to ask about status is acceptable
- If you have genuinely new, relevant information to share, a short follow-up is fine

### Thank-You Notes
- When you receive any update (interview invitation, rejection, or status update), send a brief thank-you message
- Express appreciation for their time and the process
- Keep it short (2-3 sentences)

## Roleplay Guidelines
When the user asks for interview practice:
1. Ask which role/company to simulate
2. Start with easy warm-up questions ("Tell me about yourself")
3. Progress to role-specific technical questions
4. Include 1-2 behavioral questions using the competencies from the job posting
5. End with a tough question or curveball
6. After each answer, give brief feedback: what worked, what to sharpen
7. Suggest which STAR example would work best for each question
