---
framework_version: 1.2.2
---

# Job Evaluation Framework

<!-- SETUP: Skill match areas and career goals are personalized by running /setup -->

## Eligibility Gate — run before scoring

If the candidate is not a citizen or permanent resident of the country they are applying in, run this first. It is a hard filter, not a scoring dimension, and it is separate from work-permit *timing*: timing asks "can they work the required hours yet?", eligibility asks "are they permitted to hold this job at all?". A candidate can pass timing and still be categorically excluded.

Read the posting's eligibility / work rights / "who can apply" section **verbatim** and classify:

| Posting wording | Verdict |
|-----------------|---------|
| Names a **citizenship or permanent-residency requirement** ("must be a citizen of X", "permanent resident", "PR required", "full working rights" where the employer means citizen/PR) | **FAIL — hard stop.** Do not score, do not draft. Quote the exact wording back to the user. |
| Requires a **security clearance** at any level | **FAIL** in most countries, since clearance is normally gated on citizenship. Verify the specific scheme rather than assuming. |
| **Explicitly names** the candidate's permit class, or says "international applicants welcome", "visa holders considered", "we sponsor" | **PASS** — verified acceptance. Worth noting as a positive in the application. |
| **Silent** on citizenship or residency | **PROCEED, but mark unverified.** Check the employer's own careers or international-applicant page before drafting. |

**Two rules that are easy to get wrong:**

1. **Silence is not permission.** Large graduate programs frequently gate eligibility on their own website rather than in the job ad. Highest-risk categories: professional-services firms, government and defence, banking, telecommunications, and anything touching critical infrastructure.
2. **A company-wide "we accept international applicants" statement is not role-level permission.** The common pattern is a general welcome followed by a *named list* of the specific programs or service lines it covers. Confirm the **specific posting or stream** appears on that list before drafting.

**Report an eligibility failure to the user with the quoted source** rather than silently dropping the role. They may know something about their own status that the profile does not record.

If the candidate's permit also constrains *hours* or *start date* (a student visa with a term-time cap, a permit that begins on graduation), record that as a second gate under this section during `/setup`, with the specific dates. Do not merge it with the eligibility question above — they fail for different reasons and need different answers.

A role that fails this gate is not scored and not drafted. Everything below applies only to roles that pass it.

## Seniority Gate — run before scoring

A hard filter, like eligibility. Added 2026-07-29: Pham has ~3 years of experience and is **not** at senior level. Senior-titled postings were flooding `/scrape` and `/rank`, crowding out the mid-level roles he can actually land.

| Posting title contains | Verdict |
|------------------------|---------|
| **Senior, Sr., Staff, Principal, Lead, Tech Lead, Team Lead, Head of, Manager, Architect** as the *only* band | **FAIL — do not score, do not draft.** A strong stack match does not buy an exemption. |
| **Intern, Fresher, Trainee, Graduate**, or an early-career accelerator/talent program | **FAIL** — below the current level. |
| Junior, Middle, Mid-level, or a plain "Developer" / "Engineer" with no band | **PASS** |
| Mid-Senior | **PASS** if the posting lists 2–4 yrs; **FAIL** if it lists 5+ |

**Range titles pass.** Vietnamese employers routinely open one req across two bands — `[Middle, Senior] BackEnd Engineer`, `Backend Engineer (Junior+/Senior)`, `Middle/Senior Fullstack Developer`, `Senior, Junior: ReactJS, Java`. If the title names Junior or Middle *alongside* Senior, the req is open at his level: **PASS**, and apply to the lower band. Only a title where Senior (or above) is the sole band fails the gate.

**The filter is on the title band, not the years line.** A plain "Backend Developer" posting that asks for 5+ years still passes the gate — score it normally and note the years gap under Experience Match. It is the *title* that determines whether an application is realistic.

If the user explicitly asks to evaluate a senior posting anyway, score it but open the evaluation with the seniority gap stated plainly.

## Language Gate — run before scoring

No dimension or gate anywhere in this framework currently checks a posting's language requirements against what the candidate actually speaks - it is not one of the five Scoring Dimensions below, not a field `/scrape` or `/rank` track, and not something `/apply`'s language detection (Step 1, which already extracts a posting's required language generically) has anywhere to report to. This gate adds that check, structured the same way as the Eligibility Gate above: read the posting, classify against profile data, and treat a hard mismatch as FAIL before scoring.

Read the posting's language requirements as stated for **the role itself** — not the language the ad happens to be written in. A posting written in a language you don't work in, for a role that only needs languages you do work in on the job, passes fine; only an explicit job-condition requirement ("fluent X required," "must communicate with the Y team in Z") triggers this check. For each language the posting requires as a job condition, compare it against your Languages table in CLAUDE.md / `01-candidate-profile.md`:

| Posting requirement vs. your Languages table | Verdict |
|---|---|
| Requires a language **not on your table at all** (e.g. "fluent Polish required," "must communicate with the Warsaw team in Russian," and you list no Polish/Russian row) | **FAIL — hard stop.** Do not score, do not draft. Quote the exact requirement line. |
| Requires a language you **do** list, but the posting's stated bar (as written — "fluent," "native," "C1+," "business-level") reads as plausibly **higher** than your declared level | **FLAG, then proceed.** Not a fail. Score and draft normally, but surface the gap explicitly in your report to the user (quote both the posting's requirement and your declared level) so they can judge it themselves — bars like "fluent" vary a lot by company and geography, and a recruiter may be flexible. Never silently drop the posting and never silently treat it as a clean pass. |
| Requires a language you list, at or below your declared level (or the posting doesn't specify a level at all — just names the language) | **PASS.** No note needed. |

Judge the level comparison the same way you judge everything else in this framework: read both sides as written and reason about it, don't force either into a rigid scale — CEFR letters, LinkedIn-style buckets ("professional working proficiency"), and plain-English words ("conversational," "fluent," "native") all appear in the wild and don't map onto each other precisely. When genuinely unsure whether a stated bar exceeds the candidate's level, prefer FLAG over a silent PASS — the human is meant to be the tiebreaker, not the gate.

**Worked example:** a candidate whose Languages table lists Spanish (Native) and English (B1/B2). A posting requiring "fluent Russian" → **FAIL**, Russian isn't declared at all. A posting requiring "fluent English" → **FLAG**, English is declared but "fluent" plausibly exceeds B1/B2 — score and draft the application, but tell the candidate this posting's bar may be a stretch and let them decide. A posting requiring "conversational English" or unspecified English → **PASS**, B1/B2 clears a "conversational" bar cleanly.

**Profile override for Pham (from CLAUDE.md deal-breakers):** English is declared as *technical reading/writing only, not live/conversational*. A posting that requires **live** English as a job condition — client-facing communication, English-first interviews, US-hours standups with an English-speaking team — escalates from **FLAG** to **FAIL**. A posting that merely requires reading English docs, writing English code comments/tickets, or states an unspecified "English" requirement still **PASSES**. Vietnamese-language postings always pass.

## Scoring Dimensions

Evaluate each job posting against these five dimensions:

### 1. Technical Skills Match (0-100)
How well do the required/preferred skills align with the candidate's capabilities?

| Score | Meaning |
|-------|---------|
| 80-100 | Core requirements are primary skills |
| 60-79 | Most requirements match, 1-2 gaps that are learnable |
| 40-59 | Partial match, significant upskilling needed |
| 0-39 | Fundamental mismatch |

**Strong match areas:** Go (Gin, gRPC, Worker Pool, uber-go/dig, Fx), microservices & RESTful APIs, event-driven systems (Kafka, RabbitMQ), Redis (cache/pub-sub/streams), PostgreSQL/MySQL/Oracle, system design & DB modeling, Docker/Kubernetes, observability (OpenTelemetry, Prometheus/Grafana/Loki), CI/CD (GitHub Actions, GitLab Runners, ArgoCD), ReactJS/Next.js/Vue with Redux/Recoil
**Moderate match areas:** Node.js (Express, Strapi), MongoDB/ScyllaDB/Cassandra, gRPC mTLS/security & crypto fundamentals, object storage (MinIO/SeaweedFS/S3), Python (Selenium/Scrapy), unit/integration testing
**Weak match areas:** Rust (interest only, no shipped work), formal people-leadership/mentoring, live-English/client-facing roles, cloud-provider-native stacks (AWS/GCP/Azure managed services — infra experience is self-hosted/on-prem), mobile, data engineering/ML

### 2. Experience Match (0-100)
Does work history align with what they're looking for?

| Score | Meaning |
|-------|---------|
| 80-100 | Direct experience in the same domain and role type |
| 60-79 | Related experience, transferable skills clear |
| 40-59 | Adjacent experience, would need to make the case |
| 0-39 | Unrelated experience |

**Strong:** Go backend engineering (~2 yrs production Go across Leeon Group + AIONtech), backend architecture ownership (SkyReality, C06 — DB modeling + stack decisions), fintech/banking backends (Sacombank STM, AION Bank), event-driven microservices
**Moderate:** Fullstack (React/Next/Vue frontends alongside backend at every role), government/public-sector systems (C06, TLGEO), geospatial (PostGIS, Mapbox), self-hosted infra/observability & CI/CD (Leeon Group)
**Entry-level:** Formal DevOps/Platform/SRE titles (has the skills, no title), team lead / engineering management, roles requiring live English fluency

### 3. Behavioral/Culture Fit (0-100)
Does the role and company culture match the behavioral profile?

| Score | Meaning |
|-------|---------|
| 80-100 | Culture strongly matches behavioral preferences |
| 60-79 | Mixed signals but mostly compatible |
| 40-59 | Some friction areas |
| 0-39 | Significant culture mismatch |

**Red flags to research:** Department disorganization, work dominated by maintenance over development, poor chemistry with leadership, culture mismatches. Check reviews, media coverage, LinkedIn connections, and network contacts for insider perspective.

### 4. Location & Logistics (Pass/Fail + Notes)
- Within commute range: PASS
- Remote with occasional office: PASS
- Requires relocation: FAIL (deal-breaker)
- Frequent international travel: FLAG (discuss with user)

### 5. Career Alignment & Motivation (0-100)
Does this role advance career goals and contain tasks that energize?

| Score | Meaning |
|-------|---------|
| 80-100 | Strongly aligned with career direction, clear growth path |
| 60-79 | Good role but only partially aligned with long-term goals |
| 40-59 | Decent job but doesn't build toward career goals |
| 0-39 | Dead end or backwards step |

**Career goals:**
- Grow as a **backend engineer who owns architecture** — system design and DB modeling, not ticket execution
- Go deeper on **distributed, event-driven systems** (Kafka, gRPC, worker pools) at real scale
- Keep infra/observability (K8s, OpenTelemetry) as a strength, without pivoting into a DevOps/Platform job title

**Motivation filter:** Evaluate not just whether you *can* do the tasks, but whether the tasks will *energize* you. Consider:
- Tasks that energize: **system design & DB modeling; distributed / event-driven systems; performance profiling & optimization; infra, Kubernetes & observability**
- Tasks that drain: **ticket-only work with no design input; legacy maintenance with no new build.** Treat both as red flags to research in a posting.
- Non-task factors: **adaptable** on team size (small-own-a-subsystem through larger specialized org) and on manager style (hands-off through actively mentoring) — but wants real technical pushback on his designs somewhere in the loop, not a rubber stamp
- Decision style: **researches deeply, then commits** — friction with "ship first, refactor later" cultures

**Life situation alignment:** Consider personal constraints:
- **Security**: employed at AIONtech (11/2025–present), searching from a position of stability — no pressure to take the first offer. Salary floor **15M VND/month, negotiable**; flag postings clearly below this in `/rank`.
- **Flexibility**: Ha Noi onsite/hybrid or remote (VN + offshore). **Not** relocating to HCMC/Da Nang unless fully remote. English is technical reading/writing only — exclude roles requiring live English or US-hours timezone overlap.
- **Professional development**: wants to deepen backend/distributed-systems expertise and grow toward broader architecture ownership; open to mentorship but does not require it

### 6. Salary Benchmark (Optional)

If the salary lookup tool is configured (`salary_data.json` exists), look up the company:
```
python salary_lookup.py "<Company Name>" --json
```

If a city is known from the posting, add `--city "<City>"` to narrow results.

Present findings as:
```
### Salary Benchmark
| Metric | Value |
|--------|-------|
| [Category] index | XX.X (+/-X.X% vs baseline) |
| Overall index | XX.X (+/-X.X% vs baseline) |
```

Interpret results relative to the baseline defined in the data file's metadata. For index-based data, higher typically means above-market compensation.

If the salary tool is not configured, skip this section.

## Output Format

Present the evaluation as:

```
## Job Fit Evaluation: [Role] at [Company]

| Dimension | Score | Notes |
|-----------|-------|-------|
| Technical Skills | XX/100 | [brief note] |
| Experience Match | XX/100 | [brief note] |
| Behavioral Fit | XX/100 | [brief note] |
| Location | PASS/FAIL | [brief note] |
| Career Alignment | XX/100 | [brief note] |

**Overall Score: XX/100** (weighted average of scored dimensions)

### Verdict: [Strong Fit / Good Fit / Moderate Fit / Weak Fit / Poor Fit]

### Key Strengths for This Role
- [bullet points]

### Gaps to Address
- [bullet points]

### Recommendation
[1-2 sentences: apply/skip/apply with caveats]

### Company Research Checklist
- [ ] Checked company website (mission, values, recent news)
- [ ] Checked review sites (Glassdoor, Jobindex, etc.)
- [ ] Checked LinkedIn for team size, recent hires, connections
- [ ] Checked media for restructuring, growth, or workplace issues
- [ ] Identified network contacts who may know the team/manager
```

## Weighting
- Technical Skills: 30%
- Experience Match: 25%
- Behavioral Fit: 15%
- Career Alignment: 30%

(Location is pass/fail, not weighted)

## Thresholds
- **Strong Fit** (75+): Definitely apply, tailor everything
- **Good Fit** (60-74): Apply, address gaps in cover letter
- **Moderate Fit** (45-59): Consider carefully, discuss with user
- **Weak Fit** (30-44): Probably skip unless strategic reasons
- **Poor Fit** (<30): Skip

## Calibrating the Score Against Outcomes

<!-- Method, not a snapshot. /setup Path A regenerates the actual correlation on demand from the
     resolved outcome.md files under documents/applications/. Read this before trusting a score. -->

The dimensions above are a triage tool, not a validated predictor. Until there is at least one
positive outcome to correlate against, read the overall number as **a ranking of where to spend
effort**, never as a probability of getting a response — and never let a high score buy an
exemption from the channel and follow-up work below. An unvalidated framework is "unknown", not
"working"; those are different claims and only one of them is honest.

**Before concluding a score was wrong, rule out the three variables that usually decide the
outcome and are the easiest to leave silently untested:**

1. **Channel.** Cold portal submission, or a referral, warm intro, or named contact? Portal-cold
   from an unknown-brand candidate is a low-yield channel by construction, so a portal-only
   history tells you about the channel before it tells you anything about fit. `/scrape` Step 4.5
   generates LinkedIn recruiter and peer search links on every run precisely so this gets tested.
2. **Follow-up.** Was one sent? Standard practice is one to two after 10-14 days. Silence
   following no follow-up is not evidence about the application.
3. **Document delivery.** Did the tailored CV and cover letter actually reach the employer? Portal
   forms routinely take the CV and drop the cover letter, and some sends go out with neither. An
   application whose tailoring never arrived says nothing about whether tailoring works.

**Refreshing this.** `/setup` Path A reads every resolved `outcome.md` under
`documents/applications/` and compares recorded scores against recorded results. Report that
correlation at the time it is run and keep it out of this file — a table of company names and
scores is stale the moment the next application resolves, and a stale table reads as evidence.
Once real signal exists, what belongs here is the conclusion drawn from it, not the rows.

## Pre-Application: Call the Employer (Best Practice)

Before writing the application, consider whether the candidate should call the contact person listed in the posting. **Only call if there are substantive questions** - never call just to "be remembered."

### When to Suggest Calling
- The posting has unclear or ambiguous requirements
- It's unclear which competencies are essential vs. nice-to-have
- The role description is vague about day-to-day tasks
- There's a named contact person who invites questions

### Good Questions to Ask
- "What are the primary challenges in this role?"
- "How is time typically divided across the listed responsibilities?"
- "Which competencies are most critical for success in this position?"
- "What does success look like in the first 6-12 months?"

### Rules for the Call
- Prepare a 30-second "elevator pitch" about your background in case they ask
- The call's purpose is **gathering information**, not delivering a pitch
- Take notes - use what you learn to tailor the application
- Reference the conversation naturally in the cover letter ("After speaking with [name], I was especially drawn to...")
