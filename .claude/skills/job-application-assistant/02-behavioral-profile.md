---
framework_version: 1.0.0
---

# Behavioral Profile

<!-- Rewritten from scratch by /setup on 2026-09-03. The previous version (2026-07-15) was
     discarded at the candidate's request and every trait below was re-elicited from his own
     answers in this run. Items marked [Self-reported 2026-09-03] come from that interview.
     Items marked [Carried over] were kept because they rest on a dated source document, not
     on the discarded interview — each names its source inline.
     Items marked [Inferred from GitHub] remain a hypothesis read off public code. -->

## Overview

**Working style, in one line:** a **module owner who matches his method to the clock** — he takes
a bounded piece of a system, owns it from the data model up to the API, and chooses depth or speed
depending on whether the situation is a design decision or a demo deadline.

The single most useful correction against the previous version of this file: he is **not** a
uniformly depth-first builder. Asked directly how he decides, he answered that it is *situational* —
when there is time he researches to the foundations before writing code; when a pilot or a demo is
needed, he builds something that runs and improves it in passes. Treat "researches everything to
the bottom" as a half-truth about him: it is what he does when the decision is expensive to
reverse, not a fixed temperament.

The second correction: he does not want to pick between autonomy, structure, and collaboration.
Asked which environment suits him, he said all three at once — a clear goal and clean spec, room
to decide the *how*, and colleagues close enough to argue a design with.

## Strongest Behaviors

- **Owns a module end to end** *[Self-reported 2026-09-03]* — Given a defined area he takes it
  from database schema through to API and integrates at the boundaries with the rest of the team.
  This is where he says he is most effective — ahead of being the team's debugger-of-last-resort,
  ahead of setting technical direction for others, and ahead of working alone. *In applications:*
  "own a service / own a domain" is the phrasing that fits him, not "own the platform."

- **Method matched to the situation** *[Self-reported 2026-09-03]* — Depth-first on
  expensive-to-reverse choices (schema, public API, stack selection); working-version-then-iterate
  when a pilot or demo has to exist. He named both modes unprompted, which is itself the signal —
  he knows which one he is in.

- **Wants design authority over his own area** *[Self-reported 2026-09-03 + CV]* — The single most
  energising thing he named is being able to propose the data model and choose the stack for the
  part he builds, rather than implementing decisions handed down. Backed on the CV by the
  SkyReality and C06 module designs, which he proposed and had reviewed and approved before build.

- **Draws energy from distributed, event-driven, performance-sensitive work** *[Self-reported
  2026-09-03]* — Large event-driven systems (Kafka, gRPC, worker pools, async pipelines) and
  performance optimisation are two of the three things he named as most attractive in a next role.
  The STM async pipelines and the Leeon worker-pool/RabbitMQ work sit squarely here.

- **Calm and evidence-led under production pressure** *[Self-reported 2026-09-03]* — Asked what he
  does on a tight deadline or a production incident, he chose following logs, metrics and traces to
  the root cause over patching fast, escalating early, or working longer hours. Consistent with
  having stood up the Prometheus/Grafana/Loki/OpenTelemetry stack at Leeon Group — he built the
  instrumentation he now says he reasons from. *Good ammunition for an incident-handling question.*

- **Communicates directly, and in writing by default** *[Self-reported 2026-09-03]* — Writing is
  his primary channel (docs, PR descriptions, comments), speech is short and to the point, and he
  will say so when he thinks a design is wrong, including upward. Note the interaction with the
  English constraint below: his strongest channel is the one that survives a language barrier.

- **Systematic self-directed learning** *[Inferred from GitHub — phamnam2003/challenges]* — The
  `challenges` repo is a self-authored curriculum (18+ algorithm solutions, 20 Gang-of-Four
  patterns in Go, deep dives into Kafka/ScyllaDB/OpenTelemetry/Kubernetes). Learning is structured
  and finished, not started and abandoned. Corroborated in this run: he is teaching himself Rust
  with the stated intent of making it mainstream alongside Go and TypeScript.

- **Builds for reuse** *[Inferred from GitHub — go-http-server/temp + CV]* — The `temp` repo exists
  as a template for later projects (auth, queue, mailer, transactions, layered architecture, CI —
  solved once and lifted).

- **Documents as he goes** *[Inferred from GitHub]* — READMEs written for a reader, architecture
  drawn in Mermaid, a `build-docs` skill committed into the repo. Reinforced by the self-reported
  writing-first communication style.

## How You Work Best

- **A clear goal, then room to decide the how** *[Self-reported 2026-09-03]* — He named
  goal-setting-then-autonomy as the management style he works best under, and separately named
  ticket-only work with no design input as a drain. Both point the same direction.
- **A clean spec at the front, not a moving one** — he wants the ambiguity resolved *before* the
  work starts, and then to be left to it. This is the part most easily mistaken for wanting
  micromanagement; it is the opposite. Define the *what* tightly, leave the *how* open.
- **Colleagues close enough to argue a design with** — collaboration was one of the three
  environments he picked, and he communicates by pushing back. A team with no design discussion
  wastes what he is good at.
- **On systems with real depth** — distributed, event-driven, performance-sensitive.
- **On new development, not pure legacy maintenance** — maintenance with no new build is a stated
  drain. He is comfortable *taking over* an inherited codebase and extending it (Leeon Group); the
  drain is maintenance with no design work in it, not inherited code as such.

## Growth Areas (frame positively in applications)

- **Live English is the one weakness he names himself** *[Self-reported 2026-09-03]* — Asked to
  pick his growth areas from four options he chose exactly one: spoken English. Technical reading
  and writing are solid; live conversation is not. This is the honest ceiling and it is a hard
  filter on client-facing, English-first-interview, and US-hours roles. *In an interview,* this is
  the answer to "what's your weakness" — it is real, specific, unglamorous, and paired with a
  visible mitigation (he works and documents in English in writing every day).
  Note what he did **not** claim as weaknesses: over-engineering, estimation, or skipping
  tests/docs. Do not put those in his mouth in a cover letter or a mock interview.

- **Concedes value pre-emptively under pushback** *[Carried over — source:
  `documents/interview/2026-08_ke-hoach-phong-van_cong-ty-anh-ho.md`]* — Challenged on a claim, he
  discounts it before being asked to, usually through a hedge ("cũng", "chỉ là", "chưa hẳn", "em
  nghĩ chắc"), and will name the bottom of his own range unprompted. *This is not a contradiction
  of the frank-pushback style above:* he initiates technical disagreement readily, but when his own
  worth is what is being questioned he retreats. *Counter-move:* when a hedge is forming, drop it
  and pause instead — the unqualified fact is already strong enough.

- **Formal collaboration signal is thin in public artifacts** *[Inferred]* — most visible work is
  solo; open-source record is light (Pull Shark ×2). *Frame as:* wants a team with a real
  code-review culture, which matches the environment he asked for.

- **No formal leadership or mentoring track yet** *[Inferred + CV]* — he has proposed and defended
  designs for his own modules but holds no lead title, and when asked about his role in a team he
  chose owning a module over setting technical direction for others. *Frame as:* ready to grow
  into it; do not front-load mentoring claims.

> **Drift runs both ways.** Written artifacts drift toward overstatement — CV drafts have had to be
> caught inflating claims in review — while live conversation drifts toward understatement. Check
> for both: a guard against one is not a guard against the other.

## Mapping to Job Posting Language

**Strong behavioral fit** when a posting says:
- "own a service", "own a domain", "you will own the backend for X", "data modeling"
- "system design", "propose the architecture for your area", "design review", "RFC", "design docs"
- "distributed systems", "event-driven", "microservices", "Kafka", "gRPC", "message queue"
- "performance", "optimization", "profiling", "latency", "scalability", "high traffic"
- "clear requirements, autonomy on delivery", "we hand you problems, not tickets"
- "self-starter", "learns fast", "curious", "clean code", "maintainability", "refactoring"
- "documentation culture", "async-first", "written communication"
- infra/observability as a *plus*: "Kubernetes", "OpenTelemetry", "CI/CD" (he brings these)

**Potential friction** (flag, not necessarily a deal-breaker):
- "meeting-heavy", "daily syncs plus grooming plus planning", heavy ceremony — he named meetings
  and process overhead as a top drain in this run, which the previous profile had missed entirely
- "strict ticket-based workflow, no deviation from spec" — a stated drain
- "requirements evolve constantly", "comfortable with ambiguity day to day" — he wants ambiguity
  resolved up front, not carried through the build
- "primarily maintenance of legacy systems" with no design ownership — a stated drain
- **DevOps / Platform / SRE as the core job title** — he has the skills and enjoys using them, but
  has confirmed twice that he does not want infra to *be* the role. Note the 2026-09-03 change:
  infra/observability is no longer listed among the things that *excite* him, only among the things
  he can do. Sell it as a capability; never steer him into the title.
- Roles requiring **live English** (client-facing, US-hours standups, English-first interviews) —
  a hard filter, with a narrow exception for very strong stack matches (see `04-job-evaluation.md`).

## Management Style Preferences

- **Best fit** *[Self-reported 2026-09-03]* — a manager who states the goal and the why, then
  leaves the method alone, and is available when something needs unblocking. He chose this over a
  technically deep tech lead, over frequent structured feedback, and over a manager who shields the
  team from noise.
- **Likely poor fit with:** micromanagement of the *how* after the goal is set; an environment
  with no code review where designs are never challenged; a manager who mediates all technical
  discussion rather than letting engineers argue it out.

## Using This in Applications

- **Cover letters:** Lead with module ownership and the design authority he actually had —
  proposing the data model and backend stack for his SkyReality and C06 modules, reviewed and
  approved before build. Pair with the depth signal from GitHub (gRPC down to the TLS/AEAD layer,
  20 GoF patterns in Go), which is concrete and rare at mid-level. Link the GitHub.
- **CV:** Emphasise module ownership, the inherited-codebase turnaround at Leeon Group, and the
  event-driven/performance work. The side projects earn a real "Projects" section.
- **Interviews:** The `challenges` repo is direct ammunition for design-pattern and DSA rounds; the
  gRPC repo for a system-design round; the incident answer is "follow the telemetry to root cause,"
  backed by having built the telemetry. On English, prefer written take-homes over live English
  interviews wherever the format is negotiable.
- **Don't overstate:** No formal leadership or mentoring. No fluent business English. Do not claim
  open-source contribution beyond two merged PRs. **Rust is in active self-study**, not production
  experience — it may appear under learning/interests, never as a delivery skill. Java Core and
  .NET/Entity Framework were deliberately left off the CV in this run; do not reintroduce them.
- **Never write** "architected the system", "owned the architecture end to end", or "sole
  architect". The accurate scope is: proposed designs for his assigned modules, reviewed and
  approved before build.

## TODO — Strengthen with more signal

- [ ] Add a LinkedIn export to `documents/linkedin/` — About section, recommendations, and the
      ScyllaDB certification names/dates. Still empty as of 2026-09-03.
- [ ] Add reference letters to `documents/references/` — referee competency language is the
      strongest behavioral evidence available. (No referees are recorded by name in this repo by
      the candidate's decision — it is public.)
- [ ] Optional: a formal assessment (DISC / Big Five) to replace the remaining inferred items.
