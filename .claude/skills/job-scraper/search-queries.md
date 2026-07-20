# Search Queries for Job Scraper

<!-- Populated by /setup on 2026-07-12 for Pham Hai Nam (Backend/Fullstack, Ha Noi + Remote) -->
<!-- Expanded 2026-07-17: added Cake, Devwork, Vieclam24h, JobsGO, CareerLink, Joboko, Arc.dev,
     Glassdoor + freelance/Japan-bridge notes (all domains verified via web search). -->
<!-- Reconfirmed 2026-07-17: target FE + BE + Fullstack as co-equal active nets (broad, adaptable
     skillset). DevOps/infra (CI/CD, Docker, K8s) is a SUPPLEMENTARY STRENGTH to surface inside
     backend/fullstack roles, NOT a target job title — Priority 5 stays opt-in/off-target. -->
<!-- 2026-07-17: installed CLIs for ITviec (itviec-search) + TopDev (topdev-search) via /add-portal;
     Cake skipped (Cloudflare-walled, WebSearch-only). -->

## Installed portal CLIs (primary for `/scrape`)

`/scrape` discovers every portal skill under `.agents/skills/*/SKILL.md` and runs its CLI first. Shipped country-agnostic CLIs include `linkedin-search` and `freehire-search`; Danish demos and any skill you add with `/add-portal` are included the same way. You do **not** need a matching `site:` line below for those CLIs to run.

The `site:` query templates in this file are the **WebSearch fallback** — for portals without a CLI, company career pages, or when a CLI fails.

## Search Sites

### Primary (IT-specific, Vietnam)

| Portal | URL | Notes |
|--------|-----|-------|
| **ITviec** | `itviec.com` | ⚡ **CLI installed** (`itviec-search`). Highest-signal IT board in VN, curated, English-friendly. Slug URLs: `itviec.com/it-jobs/<skill>/ha-noi` |
| **TopDev** | `topdev.vn` | ⚡ **CLI installed** (`topdev-search`, open JSON API). IT-only, strong for Go/backend. |
| **VietnamDevs** | `vietnamdevs.com` | ⚡ **CLI installed** (`vietnamdevs-search`). Hand-verified, English-friendly, offshore/remote-USD roles. `-q` uses fixed category slugs (golang, back-end, nodejs…) |
| **ITNavi** | `itnavi.com.vn` | ⚡ **CLI installed** (`itnavi-search`). Small board, decent Go/backend; real Hanoi roles (HDBank, VNG). |
| **Cake** (ex-CakeResume) | `cake.me` | Taiwan/APAC talent network, English-friendly. **WebSearch-only** — job pages Cloudflare-walled, no CLI. `cake.me/jobs/Vietnam` |
| **Devwork** | `devwork.vn` | Hanoi-based express IT recruitment (headhunter network); frontend/backend/DevOps roles. `devwork.vn/viec-lam` |

### Primary (general boards with large IT sections)

| Portal | URL | Notes |
|--------|-----|-------|
| **TopCV** | `topcv.vn` | ⚡ **CLI installed** (`topcv-search`). Largest volume in VN; strong Hanoi backend/fintech results. (Shells out to curl to pass TopCV's WAF.) |
| **VietnamWorks** | `vietnamworks.com` | Largest general portal, good for product companies & banks |
| **CareerViet** | `careerviet.vn` | Mid-size general board, decent IT listings (rebranded from CareerBuilder VN in 2024; `careerbuilder.vn` redirects here) |
| **LinkedIn** | `linkedin.com/jobs` | **Has an installed CLI** (`.agents/skills/linkedin-search/`) - use it as the primary mechanism. Best channel for remote/offshore |
| **Indeed VN** | `vn.indeed.com` | Aggregator - useful for catching what the others miss |
| **Glints** | `glints.com/vn` | Startup-heavy, SEA regional, remote-friendly |
| **Vieclam24h** | `vieclam24h.vn` | High volume; absorbed MyWork, TimViecNhanh, Viectotnhat. Broad - filter hard to IT |
| **JobsGO** | `jobsgo.vn` | ~2M candidates, mobile-first; usable mid-level IT section |
| **CareerLink** | `careerlink.vn` | Est. 2006; stronger for senior/experienced roles, has an IT-Software category |
| **Joboko** | `joboko.com` | Aggregator (ex-GoodCV) - catches listings cross-posted from other boards |

**Junior-skewed, use sparingly** (mostly fresher/entry volume, below target level): `123job.vn`, `timviec365.vn`, `ybox.vn`. Only mine these if a broad pass comes up thin.

**Japan-bridge / offshore-JP** (need Japanese or live English, off-target given the English constraint - surface only as a deliberate stretch): `hr1tech.com` (BrSE/IT-comtor heavy), `growupwork.com`.

### Remote / offshore (USD-paying)

- `linkedin.com/jobs` with `Remote` + `Vietnam` / `Asia` filters
- `vietnamdevs.com` (remote tag)
- `wellfound.com` (ex-AngelList) - startup remote roles open to APAC
- ⚡ **CLI installed:** `remoteok.com` (`remoteok-search`, JSON API — title-precise `-q`, `--tag` for broad; feed skews non-tech day-to-day) and `weworkremotely.com` (`weworkremotely-search`, RSS — detail falls back to feed body since WWR job pages are Cloudflare-walled). Check timezone on both.
- `cake.me/jobs/Vietnam` - APAC network, remote + hybrid, English-friendly
- `arc.dev/en-vn/remote-jobs` - vetted remote dev roles, global (timezone-check mandatory)
- `glassdoor.com` - aggregates remote VN dev roles, plus company reviews and salary data (doubles as company research)
- Freelance/contract USD (only if open to non-permanent work): `toptal.com`, `lemon.io`, `gun.io`, `workana.com`, `vlance.vn`

### Tooling note

**Installed portal CLIs** (structured results + dedup, faster than WebSearch — prefer these):
- **LinkedIn** — `.agents/skills/linkedin-search/`
- **ITviec** — `.agents/skills/itviec-search/` (SSR HTML; salary sign-in-gated)
- **TopDev** — `.agents/skills/topdev-search/` (open JSON API `api.topdev.vn`)
- **TopCV** — `.agents/skills/topcv-search/` (added 2026-07-17; SSR HTML via curl; largest VN volume, strong Hanoi backend)
- **VietnamDevs** — `.agents/skills/vietnamdevs-search/` (added 2026-07-17; SSR HTML; `-q` = fixed category slugs)
- **ITNavi** — `.agents/skills/itnavi-search/` (added 2026-07-17; SSR HTML + `get-job-by-id` enrich)
- **RemoteOK** — `.agents/skills/remoteok-search/` (added 2026-07-17; JSON API; title-precise `-q`, `--tag` for broad)
- **WeWorkRemotely** — `.agents/skills/weworkremotely-search/` (added 2026-07-17; RSS feeds, remote-only)
- **Greenhouse** — `.agents/skills/greenhouse-search/` (added 2026-07-20; public Job Board API; **ATS fan-out**)
- **Lever** — `.agents/skills/lever-search/` (added 2026-07-20; public v0 postings API; **ATS fan-out**; best VN/APAC coverage of the three)
- **Ashby** — `.agents/skills/ashby-search/` (added 2026-07-20; public Posting API; **ATS fan-out**; densest Go/infra coverage)
- **Facebook** — `.agents/skills/facebook-search/` (added 2026-07-20; **zero-network hybrid**, NOT a scraper). Facebook is login-walled and its ToS forbids automation, so this skill never fetches Facebook. Instead: `links` builds Facebook search/group URLs for you to open yourself, and `search` parses recruitment posts you paste into `facebook-search/inbox/` into structured jobs. `/scrape` runs `search` over the inbox and dedups the results; run `links` yourself to find posts to paste. See its SKILL.md.

**The three ATS CLIs work differently from every other portal here.** Greenhouse, Lever, and
Ashby are applicant tracking systems, not job boards — they have **no global search endpoint**.
Each searches only the company boards listed in that skill's `companies.json`, so their coverage
is a curated list, not the whole platform. Two consequences for `/scrape`:

1. A relevant company that is not in `companies.json` will never appear, no matter how well the
   query matches. Add its board token to the file to fix that (each `companies.json` header
   comment explains how to find and verify one).
2. The `site:` fallback queries below are **not redundant** for these three — they reach
   companies outside the curated lists, which is exactly the blind spot the CLIs have.

The remaining Vietnamese portals have no CLI, so `/scrape` hits them via `WebSearch` with the
`site:` queries below. To add more CLI coverage, scaffold with:

```
/add-portal vietnamworks.com
/add-portal vieclam24h.vn
```

**Cake** (`cake.me`) was evaluated 2026-07-17 but can't get a zero-dependency CLI — its job and
detail pages are behind a Cloudflare JS challenge (403). Reach it via `site:cake.me` WebSearch only.

The Danish CLIs already in `.agents/skills/` (jobindex, jobbank, jobdanmark, jobnet, freehire)
are **not applicable** to this profile - `/scrape` should skip them.

---

## Query Categories

Queries are grouped by priority. Priority 1-3 run by default; `/scrape broad` runs all.

### Priority 1: Backend Developer (Go / Node.js)

Strongest and most desired direction. Go + Gin + gRPC + Kafka + microservices is the sharpest
edge on the CV (AIONtech, Leeon Group, banking/fintech projects).

```
site:itviec.com "Golang" OR "Go Developer" ha-noi
site:itviec.com "Backend Developer" ha-noi
site:topdev.vn "Golang" tuyển dụng Hà Nội
site:topdev.vn "Backend Developer" Golang
site:topcv.vn "Golang Developer" Hà Nội
site:topcv.vn "Backend Developer" Golang OR NodeJS Hà Nội
site:vietnamworks.com "Golang" OR "Go Backend" Hà Nội
site:itnavi.com.vn Golang Hà Nội
site:vietnamdevs.com Golang backend
site:linkedin.com/jobs "Golang Developer" Hanoi Vietnam
site:linkedin.com/jobs "Backend Engineer" Go Vietnam
site:careerviet.vn Golang OR "Backend Developer" Hà Nội
site:cake.me "Backend Engineer" OR "Golang" Vietnam
site:devwork.vn Golang OR Backend
site:vieclam24h.vn "Backend Developer" OR Golang Hà Nội
site:jobsgo.vn "Backend Developer" Golang Hà Nội
site:careerlink.vn "Backend Developer" OR Golang Hà Nội
```

ATS boards — these reach companies **outside** the curated `companies.json` fan-out lists,
so run them in addition to the Greenhouse/Lever/Ashby CLIs, not instead of them:

```
site:boards.greenhouse.io "Golang" OR "Go Engineer" remote
site:job-boards.greenhouse.io "Backend Engineer" Go remote
site:jobs.lever.co "Golang" OR "Go Developer" Vietnam OR remote
site:jobs.lever.co "Backend Engineer" Vietnam
site:jobs.ashbyhq.com "Golang" OR "Go Engineer" remote
site:jobs.ashbyhq.com "Backend Engineer" Kubernetes OR Kafka remote
```

Installed-CLI equivalents (preferred over WebSearch — structured, deduped, faster):

```
bun run .agents/skills/linkedin-search/cli/src/cli.ts search --keywords "Golang Backend Developer" --location "Hanoi, Vietnam"
bun run .agents/skills/linkedin-search/cli/src/cli.ts search --keywords "Go Backend Engineer" --location "Vietnam" --remote
bun run .agents/skills/itviec-search/cli/src/cli.ts search -q "golang" -l "ha-noi" --format table
bun run .agents/skills/topdev-search/cli/src/cli.ts search -q "backend" --limit 20 --format table
bun run .agents/skills/topcv-search/cli/src/cli.ts search -q "backend" -l "ha-noi" --format table
bun run .agents/skills/itnavi-search/cli/src/cli.ts search -q "golang" -l "ha-noi" --format table
bun run .agents/skills/vietnamdevs-search/cli/src/cli.ts search -q "golang" --format table
```

### Priority 2: Fullstack Developer (React/Next + Go/Node)

Matches the current job title exactly ("Frontend and Backend Developer"). Widest realistic net.

```
site:itviec.com "Fullstack Developer" ha-noi
site:itviec.com "Full-stack" ReactJS NodeJS ha-noi
site:topdev.vn "Fullstack" ReactJS Golang
site:topcv.vn "Fullstack Developer" ReactJS Hà Nội
site:vietnamworks.com "Fullstack Developer" React Node Hà Nội
site:glints.com "Fullstack Engineer" Vietnam
site:linkedin.com/jobs "Fullstack Engineer" React Node Hanoi
site:vietnamdevs.com fullstack react golang
```

### Priority 3: Frontend Developer (React / Next.js / Vue)

Deep, real experience: React, Next.js, Vue, Redux/Redux Toolkit, Recoil, Tailwind, Ant Design.

```
site:itviec.com "ReactJS" OR "React Developer" ha-noi
site:itviec.com "NextJS" OR "VueJS" ha-noi
site:topdev.vn "ReactJS Developer" Hà Nội
site:topcv.vn "Frontend Developer" ReactJS Hà Nội
site:topcv.vn "Lập trình viên Frontend" React Hà Nội
site:vietnamworks.com "Frontend Developer" React Hà Nội
site:linkedin.com/jobs "Frontend Developer" React Hanoi Vietnam
```

### Priority 4: Remote / Offshore (USD)

Remote roles for foreign or offshore companies. Worth a separate pass - the pay band is different.

```
site:linkedin.com/jobs "Golang" remote Vietnam
site:linkedin.com/jobs "Backend Engineer" remote Asia Go
site:vietnamdevs.com remote golang OR backend
site:wellfound.com Golang backend remote
site:remoteok.com golang backend
site:weworkremotely.com golang OR "back-end" developer
site:cake.me "Backend" remote Vietnam OR Asia
site:arc.dev Golang OR backend remote
```

Timezone check is mandatory on these - reject anything requiring US-hours overlap unless the
user explicitly opts in.

### Priority 5 (opt-in only): DevOps / Platform / Cloud — NOT a target

**Deprioritized as of 2026-07-15 setup.** Pham confirmed he does *not* want DevOps/Platform/SRE
as a job title, even though he has the skills and enjoys the work. Infra is a **strength to sell
inside a backend role**, not a role to chase. Do **not** run these in the default `/scrape` pass;
only run them if the user explicitly asks (`/scrape devops`). When surfaced, flag every result as
an off-target stretch.

**Reconfirmed 2026-07-17.** Pham restated it directly: he can write CI/CD, Docker, and Kubernetes,
but is *not* a "main DevOps" — keep it supplementary. The infra-as-strength queries folded into
Priority 6 target backend/fullstack roles that *value* infra; they are not DevOps-title searches.

The CV genuinely supports this (Docker, Kubernetes + Calico/Cilium/Envoy/Nginx Ingress,
ArgoCD/GitOps, OpenTelemetry, Prometheus/Grafana/Loki, self-hosted GitLab Runners, GitHub
Actions), but the title mismatch is deliberate — see `04-job-evaluation.md` career goals.

```
site:itviec.com "DevOps Engineer" Kubernetes ha-noi
site:topdev.vn "DevOps" Kubernetes Docker Hà Nội
site:topcv.vn "DevOps Engineer" Hà Nội
site:linkedin.com/jobs "Platform Engineer" Kubernetes Vietnam
site:linkedin.com/jobs "Site Reliability Engineer" Vietnam
site:vietnamworks.com "DevOps Engineer" Kubernetes Hà Nội
```

### Priority 6: Broader net - domain & stack keywords

Catch postings that describe the stack rather than the title. Also targets the fintech/banking
domain, where the Sacombank STM and AION Bank work is directly relevant.

```
site:itviec.com Kafka OR gRPC OR microservices ha-noi
site:topdev.vn "microservices" Golang Kafka
site:topcv.vn "Software Engineer" Golang OR NodeJS Hà Nội
site:vietnamworks.com fintech "Backend Engineer" Hà Nội
site:linkedin.com/jobs "Software Engineer" Go Kafka Hanoi
site:itviec.com "Software Engineer" banking OR fintech ha-noi
site:itviec.com "Backend" (Kubernetes OR Docker OR "CI/CD") ha-noi
site:topdev.vn Golang (Kubernetes OR DevOps OR "CI/CD")
site:linkedin.com/jobs "Backend Engineer" Kubernetes Go Hanoi
site:itviec.com "Fullstack" (Docker OR Kubernetes) ha-noi
```

**Infra-as-strength, not DevOps-title** (2026-07-17): the four Kubernetes/Docker/CI-CD lines above
target *backend/fullstack* roles that treat infra as a plus. They are NOT DevOps/SRE-title searches
(those live in Priority 5, off-target). Match them to backend/fullstack postings; never surface a
DevOps-Engineer title from this block.

---

## Seniority Filter

Target bands: **Middle / Mid-level** (primary) and **Junior** (secondary).

- **Include:** Junior, Middle, Mid-level, Mid-Senior (if 2-4 yrs listed), "Developer" with no band
- **Include with caution:** Senior roles asking for 3+ years - the profile has ~3 years plus two
  projects where he owned system design, so these are worth a look. Flag them as a stretch.
- **Exclude:** Senior roles demanding 5+ years, Tech Lead, Engineering Manager, Principal, Architect
- **Exclude:** Intern and Fresher roles - below the current level

## Location Filter

- **Ideal:** Ha Noi (all districts) - onsite or hybrid
- **Ideal:** Remote (Vietnam-based company)
- **Ideal:** Remote (foreign / offshore, USD) - timezone must be Asia-compatible
- **Acceptable:** Hybrid roles in Ha Noi with 1-3 office days
- **Borderline:** Bac Ninh, Hung Yen, Ha Nam - only if hybrid/mostly-remote, flag the commute
- **Too far:** Ho Chi Minh City, Da Nang, and all other provinces - **exclude unless the posting
  is explicitly fully remote**

## Date Filter

Only include jobs posted within the last 14 days, or with an application deadline that has not
yet passed. If a posting date cannot be determined, include it but flag as "date unknown".

Vietnamese portals often show `Cập nhật DD/MM/YYYY` or `Hạn nộp hồ sơ: DD/MM/YYYY` - parse both,
and treat `Hạn nộp` as the deadline.

## Language Note

Vietnamese portals list roles in both Vietnamese and English. When a query returns nothing, retry
with the Vietnamese equivalent:

| English | Vietnamese |
|---------|-----------|
| Backend Developer | Lập trình viên Backend |
| Frontend Developer | Lập trình viên Frontend |
| Fullstack Developer | Lập trình viên Fullstack |
| Software Engineer | Kỹ sư phần mềm |
| Recruitment / hiring | Tuyển dụng |
| Hanoi | Hà Nội |

## Adapting Queries

If the user specifies a focus area, select queries from the matching category and also generate
2-3 custom queries for that focus. For example:
- `/scrape golang` -> Priority 1 queries + custom Go-specific queries
- `/scrape remote` -> Priority 4 queries + remote-filtered variants of Priority 1-2
- `/scrape devops` -> Priority 5 queries + Kubernetes/ArgoCD/observability variants
