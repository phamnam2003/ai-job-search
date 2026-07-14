# Behavioral Profile

<!-- Rewritten by /setup on 2026-07-15 from Pham Hai Nam's own answers to the setup
     behavioral questions. Sections marked [Self-reported] are confirmed by the candidate.
     Sections marked [Inferred from GitHub] remain a hypothesis read off public code and
     should still be reviewed before being leaned on heavily. -->

## Overview

**Working style, in one line:** a **depth-first builder** who researches a problem to its
foundations, commits to a decision, and owns the subsystem end to end. Confirmed by self-report
and consistent with the public GitHub record.

Pham Hai Nam decides by **researching deeply, then committing** — not by prototyping fast and
pivoting, and not by waiting for team consensus. This matches the visible pattern in his side
projects (working gRPC down to the TLS/AEAD layer, all four RPC method types, 20 Gang-of-Four
patterns implemented from scratch) and the CV pattern of making architecture and DB-modeling
calls on real projects at ~3 years of experience.

## Strongest Behaviors

- **Deep-research-then-commit decision-making** *[Self-reported]* — When the answer is not
  obvious, he reads down to the foundations (docs, protocol, internals), prototypes to confirm,
  then decides and stays the course. High-confidence decisions, slower to start, low churn once
  committed. *Best used* on architecture, data models, and other expensive-to-reverse choices.

- **Architecture and system-design ownership** *[Self-reported + CV]* — Energised by system
  design and database modeling; has owned both on the SkyReality real-estate platform and the
  C06 document-AI system (database modeling + backend stack decisions), and took over an
  inherited Go codebase at Leeon Group. Comfortable being the one who decides.

- **Draws energy from distributed, event-driven, performance-sensitive work** *[Self-reported]* —
  Kafka, gRPC, worker pools, async import/export pipelines, and profiling/optimization are the
  parts of the job he actively wants more of, not tolerates. The STM work (async pipelines,
  removing background-processing bottlenecks, step-level tracing) sits squarely in this zone.

- **Enjoys infra and observability without wanting it as the job title** *[Self-reported]* —
  Genuinely likes Kubernetes, CI/CD, and the Prometheus/Grafana/Loki/OpenTelemetry stack (stood
  the whole thing up at Leeon Group). Treat this as a **strength to sell**, not a role to steer
  him into: he wants backend/architecture as the title, with infra as a capability he brings.

- **Systematic self-directed learning** *[Inferred from GitHub — phamnam2003/challenges]* — The
  `challenges` repo is a self-authored curriculum (18+ algorithm solutions, all 20 GoF patterns
  in Go, deep dives into Kafka/ScyllaDB/OpenTelemetry/Kubernetes). Learning is structured and
  finished, not started and abandoned.

- **Builds for reuse** *[Inferred from GitHub — go-http-server/temp + CV]* — The `temp` repo
  exists as a template for later projects (auth, queue, mailer, transactions, layered
  architecture, CI, solved once and lifted). Matches the CV pattern of refactoring internal
  packages for maintainability.

- **Documents as he goes** *[Inferred from GitHub]* — READMEs written for a reader, architecture
  drawn in Mermaid, a `build-docs` skill committed into the repo. Documentation is treated as
  part of the work.

## How You Work Best

- **Given a problem and room to choose the approach**, rather than a spec to type out. Confirmed:
  ticket-only work with no design input is a stated drain.
- **On systems with real depth** — distributed, event-driven, performance-sensitive. Both the
  work history and the stated energizers point the same way.
- **Adaptable on team size and management style** *[Self-reported]* — Works well across small
  own-a-subsystem teams, tightly collaborative teams, larger specialized orgs, and near-solo
  ownership; and across manager styles from hands-off to actively mentoring. Does not require a
  specific setup. *In applications, frame this as flexibility, not indifference* — he adapts to
  the team he joins rather than needing it shaped around him.
- **On new development, not pure legacy maintenance** — maintaining a legacy system with no new
  build is a stated drain. (Note: he is comfortable *taking over* an inherited codebase and
  enhancing it — Leeon Group — the drain is maintenance with no architectural work, not
  inherited code as such.)

## Growth Areas (frame positively in applications)

- **English is professional technical reading/writing, not confirmed conversational**
  *[Self-reported]* — Comfortable with docs, code review, written specs, and Slack; not confident
  in live conversation. *Frame honestly* — do not claim fluent business English or comfort in a
  live English interview. This is the current honest ceiling; it filters out English-first and
  US-timezone offshore roles that require live calls.
- **Formal collaboration signal is thin in public artifacts** *[Inferred]* — most visible work is
  solo; open-source record is light (Pull Shark ×2). *Frame as:* eager to work in a team with a
  strong code-review culture.
- **No formal leadership or mentoring track yet** *[Inferred + CV]* — has led architecture
  decisions but has no people-management title. *Frame as:* has owned technical direction and is
  ready to grow into mentorship.

## Mapping to Job Posting Language

**Strong behavioral fit** when a posting says:
- "system design", "architecture ownership", "you will own the backend", "data modeling"
- "distributed systems", "event-driven", "microservices at scale", "Kafka", "gRPC"
- "performance", "optimization", "profiling", "scalability"
- "self-starter", "learns fast", "curious", "clean code", "maintainability", "refactoring"
- "documentation culture", "RFC", "design docs"
- infra/observability as a *plus*: "Kubernetes", "OpenTelemetry", "CI/CD" (he brings these)

**Potential friction** (flag, not necessarily a deal-breaker):
- "fast-paced, ship first, refactor later" — clashes with the research-then-commit instinct
- "strict ticket-based workflow, no deviation from spec" — ticket-only work is a stated drain
- "primarily maintenance of legacy systems" with no design ownership — a stated drain
- **DevOps / Platform / SRE as the core job title** — he has the skills and enjoys the work, but
  has said he does not want infra to *be* the role. Surface these only as a deliberate stretch.
- Roles requiring **live English** (client-facing, US-hours standups, English-first interviews) —
  a real constraint at his current self-assessed level.

## Management Style Preferences

- **Adaptable** *[Self-reported]* — works with problem-plus-autonomy-plus-review, with active
  mentorship, with hands-off goal-setting, and with a collaborative coding peer. No single
  required style. The one consistent thread from his other answers: he wants **real technical
  pushback on his designs** somewhere in the loop, not a rubber stamp.
- **Likely poor fit with:** micromanagement of the *how* after the problem is set, or an
  environment with zero code review where designs never get challenged.

## Using This in Applications

- **Cover letters:** Lead with the depth signal — the gRPC/crypto work and the 20-pattern repo
  are concrete, verifiable, and rare at mid-level. Pair it with the architecture ownership
  (SkyReality, C06). Link the GitHub.
- **CV:** Emphasize architecture ownership and the inherited-codebase turnaround at Leeon Group.
  The side projects earn a real "Projects" section.
- **Interviews:** The `challenges` repo is direct ammunition for design-pattern and DSA rounds;
  the gRPC repo for a system-design round. On English, prefer written take-homes over live
  English interviews where the format is negotiable.
- **Don't overstate:** No Rust (bio interest only). No formal leadership or mentoring. No fluent
  business English. Do not claim open-source contribution beyond two merged PRs.

## TODO — Strengthen with more signal

- [ ] Add a LinkedIn export to `documents/linkedin/` — About section and recommendations would
      confirm or sharpen the inferred items above.
- [ ] Add reference letters to `documents/references/` — referee competency language is the
      strongest behavioral evidence available.
- [ ] Optional: a formal assessment (DISC / Big Five) to replace the remaining inferred items.
