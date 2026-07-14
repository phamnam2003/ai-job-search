# Job Evaluation Framework

<!-- SETUP: Skill match areas and career goals are personalized by running /setup -->

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
