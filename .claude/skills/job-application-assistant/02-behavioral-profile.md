# Behavioral Profile

<!-- Seeded by /expand on 2026-07-12 from github.com/phamnam2003 -->
<!-- ⚠️ Every item below is INFERRED from public code artifacts, not from a formal assessment
     (PI / DISC / Myers-Briggs / StrengthsFinder) or from the candidate's own words.
     Review each one before relying on it in a cover letter or interview answer.
     Replace or confirm with real self-assessment when possible. -->

## Overview

No formal behavioral assessment on file. The signals below are read off Pham Hai Nam's public
GitHub work: what he chooses to build, how deep he goes, and how he documents it. They are a
starting hypothesis, not a verdict.

**Working hypothesis:** a **depth-first builder-learner** — someone who converts curiosity into
shipped artifacts, prefers understanding a system to its foundations over using it at surface
level, and invests up front in reusable structure.

## Strongest Behaviors

- **Systematic self-directed learning** — The `challenges` repo is not a scratchpad; it is a
  self-authored curriculum (18+ algorithm solutions, all 20 Gang-of-Four patterns in Go, plus
  deep dives into Kafka, ScyllaDB, OpenTelemetry, Kubernetes, consistent hashing). Learning is
  structured and finished, not started and abandoned.
  *[Inferred from GitHub — phamnam2003/challenges. Review before relying on this.]*

- **Depth over surface** — Did not simply call the gRPC library. Built out all four method types,
  wrote interceptors for rate-limiting and authz, implemented three TLS modes, and worked through
  the underlying cryptography (AEAD, Diffie-Hellman, MAC, certificate chains). The instinct is to
  go down to the protocol, not to stop at the API.
  *[Inferred from GitHub — go-http-server/grpc. Review before relying on this.]*

- **Builds for reuse** — The `temp` repo exists explicitly as a template for later projects:
  auth, queue, mailer, transactions, layered architecture, CI — solved once, structured to be
  lifted. This matches the CV pattern of taking ownership of an inherited Go codebase and
  refactoring internal packages for maintainability.
  *[Inferred from GitHub — go-http-server/temp + CV (Leeon Group, AIONtech). Review before relying on this.]*

- **Documents as he goes** — READMEs are written for a reader, architecture is drawn in Mermaid,
  and there is a `build-docs` Claude Code skill committed into the repo. Documentation is treated
  as part of the work, not an afterthought.
  *[Inferred from GitHub — challenges, go-http-server/*. Review before relying on this.]*

- **Ownership of ambiguous, inherited work** — Took over an existing Go codebase from departing
  team members at Leeon Group; architected system design (DB modeling, stack decisions) on two
  separate projects at AIONtech. Comfortable being the one who decides.
  *[From CV, not inferred — safe to use.]*

## How You Work Best

*(Hypothesis — confirm or correct)*

- Given a problem and the room to choose the approach, rather than handed a spec to type out
- On systems with real depth (distributed, event-driven, performance-sensitive) — the work
  history and the side projects both point the same way
- Where technical decisions are argued on merit, not seniority — he has been making architecture
  calls at ~3 years of experience
- Small teams (7–9 members on every project listed) where one person can own a whole subsystem

## Growth Areas (frame positively in applications)

*(Hypothesis — confirm or correct)*

- **Breadth of formal collaboration signal is thin.** Almost all visible artifacts are solo work;
  the open-source contribution record is light (Pull Shark ×2). *Frame as:* eager to work in a
  team with strong code review culture and learn from senior engineers.
- **No formal leadership or mentoring track yet.** *Frame as:* has led architecture decisions and
  is ready to grow into technical mentorship.
- **English is professional/technical, not confirmed conversational.** *Frame honestly* — do not
  claim fluent business English until self-assessed.

## Mapping to Job Posting Language

**Strong behavioral fit** when a posting says:
- "system design", "architecture ownership", "you will own the backend"
- "distributed systems", "event-driven", "microservices at scale"
- "self-starter", "learns fast", "curious"
- "clean code", "maintainability", "refactoring", "technical debt"
- "documentation culture", "RFC", "design docs"

**Potential friction** (not a deal-breaker — just flag it):
- "fast-paced, ship first, refactor later" — clashes with the depth-first instinct
- "highly process-driven", "strict ticket-based workflow", "no deviation from spec"
- "primarily maintenance of legacy systems" with no design ownership
- Heavy client-facing / sales-engineering roles — no evidence either way in the record

## Management Style Preferences

*(Hypothesis — confirm or correct)*

- Works well with: clear problem statement + autonomy on the how + a senior reviewer to push back
- Likely poor fit with: micromanagement, or the opposite extreme (zero feedback, no code review)

## Using This in Applications

- **Cover letters:** Lead with the depth signal — the gRPC/crypto work and the 20-pattern repo are
  concrete, verifiable, and rare at mid-level. Link the GitHub.
- **CV:** Emphasize architecture ownership (SkyReality, C06) and the inherited-codebase turnaround
  at Leeon Group. The side projects earn a real "Projects" section, not a footnote.
- **Interviews:** The `challenges` repo is direct ammunition for design-pattern and DSA rounds.
  The gRPC repo is ammunition for a system-design round.
- **Don't overstate:** No Rust (bio interest only, zero repos). No formal leadership. No team-lead
  or mentoring experience. Do not claim open-source contribution beyond two merged PRs.

## TODO — Replace inference with real signal

- [ ] Take a formal assessment (DISC / Big Five) or answer the `/setup` behavioral questions
- [ ] Add a LinkedIn export to `documents/linkedin/` — the About section and recommendations are
      far better behavioral evidence than code
- [ ] Add reference letters to `documents/references/` — referee competency language is the
      strongest signal available
