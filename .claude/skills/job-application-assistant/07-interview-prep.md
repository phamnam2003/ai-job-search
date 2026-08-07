---
framework_version: 1.0.0
---

# Interview Preparation Guide

<!-- SETUP: STAR examples are personalized by running /setup based on your actual experience -->

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

### Architecture ownership on SkyReality (system design & DB modeling)
**Source:** CV — SkyReality, backend developer, team of 7 (03/2026–present)
**What happened:** Given a new real-estate lead-management platform, you owned the database model and backend stack decisions, then built the core modules and webhook-based event ingestion from Zalo/Slack/Telegram.
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

## Common Tough Questions

<!-- Drafted by /setup on 2026-08-05. Written in English to match this file; the interviews these
     target are Vietnamese-language (see the Languages table in 01-candidate-profile.md), so
     rehearse your own Vietnamese phrasing from these points rather than translating live. -->

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

> I want to be the person who owns the architecture of a system end to end — the data model, the service boundaries, the failure modes — and can defend those decisions to a team that pushes back on them. I have already made those calls on two systems at a small scale; in five years I want to be making them on something considerably larger, and to be the person other engineers bring their designs to. I care more about technical depth and ownership than about a management title.

**Why this works for you:** it matches your stated direction (architecture ownership), it is honest about where you are now (small scale), and the closing line quietly rules out the Lead/Manager track you have excluded — without sounding uninterested in growth.

**Adjust per posting:** if the role explicitly has a tech-lead path, soften the last sentence to "growing into technical leadership" rather than rejecting it outright.

### "What's your biggest weakness?"

**Use this one — it is genuine and it has a real mitigation:**
> My instinct is to research a problem down to its foundations before I commit to a design. On expensive-to-reverse decisions — a data model, a service boundary — that is exactly right, and it is why the designs I have shipped have not needed rewriting. But I have applied it to decisions that did not deserve it, and been slower to start than I should have been. What I do now is timebox the research and ship a thin vertical slice early to validate the shape, then save the deep pass for the decisions that genuinely cannot be undone.

This is a real trait from your behavioral profile, not a disguised strength, and the mitigation is specific rather than "I'm working on it".

**Backup answer if they push for a second one:** most of your visible work has been solo or near-solo, so your code-review and collaboration record is thinner than your technical record. Mitigation: you actively want a team with a strong review culture, and you treat design pushback as the point rather than an obstacle.

> ⚠️ **Do not use English as your weakness answer** in a Vietnamese-language interview. It is a real limitation, but volunteering it invites the interviewer to reconsider the role's language requirements — a scope you have already filtered out at the search stage. Answer honestly if asked directly; do not raise it yourself.

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
