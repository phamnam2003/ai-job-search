# Search Queries for Job Scraper

<!-- Populated by /setup on 2026-07-12 for Pham Hai Nam (Backend/Fullstack, Ha Noi + Remote) -->
<!-- Expanded 2026-07-17: added Cake, Devwork, Vieclam24h, JobsGO, CareerLink, Joboko, Arc.dev,
     Glassdoor + freelance/Japan-bridge notes (all domains verified via web search). -->
<!-- Reconfirmed 2026-07-17: target FE + BE + Fullstack as co-equal active nets (broad, adaptable
     skillset). DevOps/infra (CI/CD, Docker, K8s) is a SUPPLEMENTARY STRENGTH to surface inside
     backend/fullstack roles, NOT a target job title — Priority 5 stays opt-in/off-target. -->
<!-- 2026-07-17: installed CLIs for ITviec (itviec-search) + TopDev (topdev-search) via /add-portal;
     Cake skipped (Cloudflare-walled, WebSearch-only). -->
<!-- Reconfirmed 2026-09-03 (/setup full re-interview). Four decisions worth not relitigating:
     (1) KEEP all three nets — Backend, Fullstack, Frontend all stay in the default pass. He was
         offered the option to demote Frontend to opt-in and declined, so Priority 3 is deliberate
         breadth, not stale config.
     (2) NO Rust queries. He is learning Rust and it goes on the CV under "currently learning",
         but he chose not to spend scrape budget on it — VN Rust volume is near zero. Do not add
         Rust query lines on the strength of the CV entry alone.
     (3) Outsourcing/offshore-services companies are now explicitly IN SCOPE as a sector, alongside
         fintech, product/startup, and public sector. See the Sector Weighting note below — in
         scope is not the same as unfiltered.
     (4) Live-English roles gain a narrow exceptional-match carve-out. See Language Filter. -->
<!-- Drain signal added 2026-09-03: meeting-heavy / process-heavy environments now rank alongside
     ticket-only work and legacy-only maintenance as a stated drain. It is not filterable from a
     search query, so it is scored later — `04-job-evaluation.md`, Behavioral/Culture Fit. -->
<!-- Retuned 2026-10-11 from five weeks of seen_jobs.json data (2903 entries, 477 ranked), at his
     request. This supersedes decision (1) above:
     (a) Frontend (Priority 3) is now OPT-IN. 51 frontend-titled postings were ranked: 1 scored 60+,
         none 70+, none applied to. Backend titles produced 33 of the 40 postings scoring 70+, so
         the default pass spends that slot on Priority 6 (backend stack/domain) instead.
     (b) Low-fit postings are no longer sent to /rank — see Low-Fit Triage below.
     (c) lever, devwork, vietnamdevs and weworkremotely CLIs are disabled for low yield (0-1 of
         their results ranked 60+); their site: lines were removed from this file so the WebSearch
         fallback does not quietly bring them back. -->

## Installed portal CLIs (primary for `/scrape`)

`/scrape` discovers every portal skill under `.agents/skills/*/SKILL.md` and runs its CLI first. Shipped country-agnostic CLIs include `linkedin-search` and `freehire-search`; Danish demos and any skill you add with `/add-portal` are included the same way. You do **not** need a matching `site:` line below for those CLIs to run.

The `site:` query templates in this file are the **WebSearch fallback** — for portals without a CLI, company career pages, or when a CLI fails.

**Language scope:** write every query category in every language listed in your CLAUDE.md Languages table (typically 1-2, sometimes more). A posting requiring a language you have *not* declared, as a job condition, is excluded before scoring; a posting requiring a *higher level* than you declared in a language you *do* work in is flagged for your own judgment, not excluded — see `04-job-evaluation.md`'s Language Gate, the single source of truth for this rule. Translate each category's keywords rather than machine-translating word-for-word (e.g. "Frontend Developer" -> "Desarrollador Frontend", not a literal word-for-word translation) if you work in more than one language.

## Search Sites

### Primary (IT-specific, Vietnam)

| Portal | URL | Notes |
|--------|-----|-------|
| **ITviec** | `itviec.com` | ⚡ **CLI installed** (`itviec-search`). Highest-signal IT board in VN, curated, English-friendly. Slug URLs: `itviec.com/it-jobs/<skill>/ha-noi` |
| **TopDev** | `topdev.vn` | ⚡ **CLI installed** (`topdev-search`, open JSON API). IT-only, strong for Go/backend. |
| **VietnamDevs** | `vietnamdevs.com` | ⚡ **CLI installed** (`vietnamdevs-search`) — **disabled 2026-10-11** (41 results, all skipped at scrape). Hand-verified, English-friendly, offshore/remote-USD roles. `-q` uses fixed category slugs (golang, back-end, nodejs…) |
| **ITNavi** | `itnavi.com.vn` | ⚡ **CLI installed** (`itnavi-search`). Small board, decent Go/backend; real Hanoi roles (HDBank, VNG). |
| **Cake** (ex-CakeResume) | `cake.me` | Taiwan/APAC talent network, English-friendly. **WebSearch-only** — job pages Cloudflare-walled, no CLI. `cake.me/jobs/Vietnam` |
| **Devwork** | `devwork.vn` | ⚡ **CLI installed** (`devwork-search`) — **disabled 2026-10-11** (56 results, 18 ranked, none 60+). Hanoi IT recruitment/referral network. Small volume but **publishes salary bands on the card**, plus seniority + years-of-experience on detail. `-q` uses fixed technology tags. |

### Primary (general boards with large IT sections)

| Portal | URL | Notes |
|--------|-----|-------|
| **TopCV** | `topcv.vn` | ⚡ **CLI installed** (`topcv-search`). Largest volume in VN; strong Hanoi backend/fintech results. (Shells out to curl to pass TopCV's WAF.) |
| **VietnamWorks** | `vietnamworks.com` | ⚡ **CLI installed** (`vietnamworks-search`, public POST/JSON microservice). Largest general portal, good for product companies & banks. Newest-first; client-side `-l`/`--jobage`. |
| **CareerViet** | `careerviet.vn` | ⚡ **CLI installed** (`careerviet-search`). Rebrand of CareerBuilder VN (`careerbuilder.vn` redirects here). **Search results carry the application deadline (`Hạn nộp`)**, so `--open-only` filters with no detail fetches. Strong on banking/fintech engineering. |
| **LinkedIn** | `linkedin.com/jobs` | **Has an installed CLI** (`.agents/skills/linkedin-search/`) - use it as the primary mechanism. Best channel for remote/offshore |
| **Indeed VN** | `vn.indeed.com` | Aggregator - useful for catching what the others miss |
| **Glints** | `glints.com/vn` | Startup-heavy, SEA regional, remote-friendly |
| **Vieclam24h** | `vieclam24h.vn` | High volume; absorbed MyWork, TimViecNhanh, Viectotnhat. Broad - filter hard to IT |
| **JobsGO** | `jobsgo.vn` | ❌ **Unreachable** — every path, including `robots.txt`, sits behind a Cloudflare *managed challenge* (403). No CLI is possible without defeating a bot-detection control. Evaluated 2026-08-04. |
| **CareerLink** | `careerlink.vn` | ❌ **Excluded by the site's own policy** — `robots.txt` names `ClaudeBot`, `Claude-Web`, `anthropic-ai` and `GPTBot` with `Disallow: /`. Reachable by a human browser; do not build or run automated access. Evaluated 2026-08-04. |
| **Joboko** | `vn.joboko.com` | ⚡ **CLI installed** (`joboko-search`). Aggregator (ex-GoodCV) — catches cross-posted listings. **Index skews stale and expired postings stay live**: always pass `--open-only` and check the `expired` field on detail. |

**Junior-skewed, use sparingly** (mostly fresher/entry volume, below target level): `123job.vn`, `timviec365.vn`, `ybox.vn`. Only mine these if a broad pass comes up thin.

**Japan-bridge / offshore-JP** (need Japanese or live English, off-target given the English constraint - surface only as a deliberate stretch): `hr1tech.com` (BrSE/IT-comtor heavy), `growupwork.com`.

### Remote / offshore (USD-paying)

- `linkedin.com/jobs` with `Remote` + `Vietnam` / `Asia` filters
- `wellfound.com` (ex-AngelList) - startup remote roles open to APAC
- ⚡ **CLI installed:** `remoteok.com` (`remoteok-search`, JSON API — title-precise `-q`, `--tag` for broad; feed skews non-tech day-to-day) and `weworkremotely.com` (`weworkremotely-search`, RSS — detail falls back to feed body since WWR job pages are Cloudflare-walled; **disabled 2026-10-11**, 134 results and 1 ranked 60+). Check timezone on both.
- `cake.me/jobs/Vietnam` - APAC network, remote + hybrid, English-friendly
- `arc.dev/en-vn/remote-jobs` - vetted remote dev roles, global (timezone-check mandatory)
- `glassdoor.com` - aggregates remote VN dev roles, plus company reviews and salary data (doubles as company research)
- ~~Freelance/contract USD~~ (`toptal.com`, `lemon.io`, `gun.io`, `workana.com`, `vlance.vn`): **out of
  scope since 2026-10-22.** He takes employment only, so contractor and freelance platforms are not
  searched at all. See the Employment Type Filter below.

### Tooling note

**Disabled for low yield (2026-10-11):** `lever-search`, `devwork-search`, `vietnamdevs-search`,
`weworkremotely-search`. Unlike `topcv-search` — disabled because its WAF blocks the CLI, and
deliberately covered by the `site:topcv.vn` fallback — these four were switched off because what
they return does not fit, so do **not** cover them through the Step 1c WebSearch fallback either.
The two `site:jobs.lever.co` lines under Priority 1 stay: they reach companies outside the
curated `companies.json`, a different population from the one the CLI was measured on.

**Installed portal CLIs** (structured results + dedup, faster than WebSearch — prefer these):
- **LinkedIn** — `.agents/skills/linkedin-search/`
- **ITviec** — `.agents/skills/itviec-search/` (SSR HTML; salary sign-in-gated)
- **TopDev** — `.agents/skills/topdev-search/` (open JSON API `api.topdev.vn`)
- **TopCV** — `.agents/skills/topcv-search/` (added 2026-07-17; SSR HTML via curl; largest VN volume, strong Hanoi backend)
- **VietnamDevs** — `.agents/skills/vietnamdevs-search/` (added 2026-07-17; SSR HTML; `-q` = fixed category slugs)
- **ITNavi** — `.agents/skills/itnavi-search/` (added 2026-07-17; SSR HTML + `get-job-by-id` enrich)
- **RemoteOK** — `.agents/skills/remoteok-search/` (added 2026-07-17; JSON API; title-precise `-q`, `--tag` for broad)
- **WeWorkRemotely** — `.agents/skills/weworkremotely-search/` (added 2026-07-17; RSS feeds, remote-only)
- **VietnamWorks** — `.agents/skills/vietnamworks-search/` (added 2026-07-22; public POST/JSON microservice `ms.vietnamworks.com`; general board — strong for product companies/banks/fintech; newest-first, client-side `-l`/`--jobage`)
- **Greenhouse** — `.agents/skills/greenhouse-search/` (added 2026-07-20; public Job Board API; **ATS fan-out**)
- **Lever** — `.agents/skills/lever-search/` (added 2026-07-20; public v0 postings API; **ATS fan-out**; best VN/APAC coverage of the three)
- **Ashby** — `.agents/skills/ashby-search/` (added 2026-07-20; public Posting API; **ATS fan-out**; densest Go/infra coverage)
- **CareerViet** — `.agents/skills/careerviet-search/` (added 2026-08-04; SSR HTML, path-based search; **deadline on the search card**; JSON-LD on detail)
- **Devwork** — `.agents/skills/devwork-search/` (added 2026-08-04; SSR HTML; `-q` = fixed technology tags; **salary bands on the card**, seniority + years on detail)
- **Joboko** — `.agents/skills/joboko-search/` (added 2026-08-04; SSR HTML + JSON-LD on detail; aggregator — use `--open-only`, `?p=` pagination, pre-generated keyword slugs only)
- **Facebook** — `.agents/skills/facebook-search/` (added 2026-07-20; **zero-network hybrid**, NOT a scraper). Facebook is login-walled and its ToS forbids automation, so this skill never fetches Facebook. Instead: `links` builds Facebook search/group URLs for you to open yourself, and `search` parses recruitment posts you paste into `facebook-search/inbox/` into structured jobs. `/scrape` runs `search` over the inbox and dedups the results; run `links` yourself to find posts to paste. See its SKILL.md.

**The three ATS CLIs work differently from every other portal here.** Greenhouse, Lever, and
Ashby are applicant tracking systems, not job boards — they have **no global search endpoint**.
Each searches only the company boards listed in that skill's `companies.json`, so their coverage
is a curated list, not the whole platform. Two consequences for `/scrape`:

1. A relevant company that is not in `companies.json` will never appear, no matter how well the
   query matches. Add its board token to the file to fix that (each `companies.json` header
   comment explains how to find and verify one).
2. The ATS `site:` queries below are **not redundant** for these three — they reach
   companies outside the curated lists, which is exactly the blind spot the CLIs have.

**No company whitelist (2026-10-22).** He does not want the search limited to named employers:
any posting that fits the profile is in scope, whoever posts it. So the curated `companies.json`
lists are a *speed-up*, never a boundary. Two rules follow:

- The ATS `site:` blocks are **always-run**, not fallback-only: run each one whenever its
  category runs (Priority 1 on every default pass, Priority 7 on `/scrape abroad` and `/scrape
  broad`), even when the Greenhouse/Lever/Ashby CLIs succeed. SKILL.md Step 1c says the same.
- When an always-run `site:` query surfaces a fitting employer on Greenhouse, Lever or Ashby that
  is not yet in that CLI's `companies.json`, add its board token there so later runs reach it
  through the CLI too. Never drop a fitting posting because its employer is unknown or absent
  from a list.

The remaining Vietnamese portals have no CLI, so `/scrape` hits them via `WebSearch` with the
`site:` queries below. To add more CLI coverage, scaffold with:

```
/add-portal vietnamworks.com
/add-portal vieclam24h.vn
```

**Cake** (`cake.me`) was evaluated 2026-07-17 but can't get a zero-dependency CLI — its job and
detail pages are behind a Cloudflare JS challenge (403). Reach it via `site:cake.me` WebSearch only.

The four Danish CLIs in `.agents/skills/` (jobindex, jobbank, jobdanmark, jobnet) are **not
applicable** to this profile and ship `enabled: false`, so `/scrape` skips them.

**freehire is not one of them** (corrected 2026-08-09). It was grouped with the Danish boards by
mistake: it is a country-agnostic aggregator over ~50 ATS platforms, and `-q "backend engineer"
--country VN` / `--region apac` return live Vietnamese and APAC roles. It is enabled. Its weakness
is the opposite of a Danish board's - it returns plenty of India/Singapore/HCMC postings that the
Location Filter below then drops, so pair it with `--country VN` rather than a bare region query.
Since 2026-10-12 Singapore, Australia and Europe are in scope (Priority 7), so `--country SG,AU`
and `--region eu` are deliberate queries there rather than noise.

---

## Query Categories

Queries are grouped by priority. **The default pass runs Priority 1, 2 and 6** — not "the top
three": Priority 3 (Frontend) became opt-in on 2026-10-11 and its slot went to Priority 6's
backend stack/domain queries. `/scrape broad` runs all; `/scrape frontend` runs Priority 3. Write **each category in both Vietnamese and English** (the two languages on the Languages table — see Language scope above and the Language Note table at the bottom of this file). Combine each query with the Ha Noi location terms where the site supports it.

**Organize by function, not job title.** The same underlying work carries different titles across companies and markets (a "Data Scientist" role at one employer may be posted as "Insights Analyst" or "Data Consultant" at another). Name each priority category after the function it covers, and list several plausible job titles as query variants within that category rather than betting an entire priority tier on one exact title string.

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
site:linkedin.com/jobs "Golang Developer" Hanoi Vietnam
site:linkedin.com/jobs "Backend Engineer" Go Vietnam
site:careerviet.vn Golang OR "Backend Developer" Hà Nội
site:cake.me "Backend Engineer" OR "Golang" Vietnam
site:vieclam24h.vn "Backend Developer" OR Golang Hà Nội
site:jobsgo.vn "Backend Developer" Golang Hà Nội
site:careerlink.vn "Backend Developer" OR Golang Hà Nội
```

ATS boards — **always-run** (see "No company whitelist" above). These reach companies
**outside** the curated `companies.json` fan-out lists, so run them in addition to the
Greenhouse/Lever/Ashby CLIs on every default pass, not only when a CLI fails:

```
site:boards.greenhouse.io "Golang" OR "Go Engineer" remote
site:job-boards.greenhouse.io "Backend Engineer" Go remote
site:jobs.lever.co "Golang" OR "Go Developer" Vietnam OR remote
site:jobs.lever.co "Backend Engineer" Vietnam
site:jobs.ashbyhq.com "Golang" OR "Go Engineer" remote
site:jobs.ashbyhq.com "Backend Engineer" Kubernetes OR Kafka remote
site:apply.workable.com "Golang" OR "Go Developer" Vietnam OR remote
site:jobs.smartrecruiters.com "Golang" OR "Backend Engineer" Vietnam
```

Installed-CLI equivalents (preferred over WebSearch — structured, deduped, faster):

```
bun run .agents/skills/linkedin-search/cli/src/cli.ts search -q "Golang Backend Developer" -l "Hanoi, Vietnam"
bun run .agents/skills/linkedin-search/cli/src/cli.ts search -q "Go Backend Engineer" -l "Vietnam" --remote remote
bun run .agents/skills/itviec-search/cli/src/cli.ts search -q "golang" -l "ha-noi" --format table
bun run .agents/skills/topdev-search/cli/src/cli.ts search -q "backend" --limit 20 --format table
bun run .agents/skills/itnavi-search/cli/src/cli.ts search -q "golang" -l "ha-noi" --format table
```

(`topcv-search` is disabled — its WAF blocks the CLI — so TopCV runs on the `site:topcv.vn`
lines above. The LinkedIn lines used `--keywords` and a bare `--remote` until 2026-10-11; the
CLI rejects both as `UNKNOWN_FLAG` — see its SKILL.md for `-q` and `--remote <mode>`.)

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
```

### Priority 3 (opt-in only): Frontend Developer (React / Next.js / Vue)

**Opt-in since 2026-10-11** — run only on `/scrape frontend` or `/scrape broad`. The experience is
real, but in five weeks of data 51 frontend-titled postings were ranked, 1 scored 60+ and none 70+,
so it was spending default-pass budget on roles the fit framework then scores low. React/Next still
counts inside Fullstack (Priority 2), which stays in the default pass.

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
site:wellfound.com Golang backend remote
site:remoteok.com golang backend
site:cake.me "Backend" remote Vietnam OR Asia
site:arc.dev Golang OR backend remote
```

Timezone check is mandatory on these - reject anything requiring US-hours overlap unless the
user explicitly opts in. European, Singaporean and Australian employer hours are accepted in full
(2026-10-12).

Employment-type check is mandatory too (2026-10-22): remote roles for foreign employers are
often contractor engagements paid through Deel, Remote.com or a similar platform. Keep only
employment — see the Employment Type Filter below.

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

Installed-CLI equivalents — this category is in the default pass since 2026-10-11, so these run
every time, on the three portals with the best record (LinkedIn, ITviec, TopDev: 8-10% of their
results ranked 60+, against 0-4% elsewhere):

```
bun run .agents/skills/linkedin-search/cli/src/cli.ts search -q "Golang Kafka" -l "Hanoi, Vietnam"
bun run .agents/skills/linkedin-search/cli/src/cli.ts search -q "Backend Engineer microservices" -l "Hanoi, Vietnam"
bun run .agents/skills/linkedin-search/cli/src/cli.ts search -q "Backend Engineer fintech" -l "Vietnam"
bun run .agents/skills/itviec-search/cli/src/cli.ts search -q "nodejs" -l "ha-noi" --format table
bun run .agents/skills/itviec-search/cli/src/cli.ts search -q "kafka" -l "ha-noi" --format table
bun run .agents/skills/topdev-search/cli/src/cli.ts search -q "golang" --limit 20 --format table
bun run .agents/skills/topdev-search/cli/src/cli.ts search -q "kafka" -l "Hà Nội" --format table
bun run .agents/skills/topdev-search/cli/src/cli.ts search -q "nodejs" --limit 20 --format table
```

**Infra-as-strength, not DevOps-title** (2026-07-17): the four Kubernetes/Docker/CI-CD lines above
target *backend/fullstack* roles that treat infra as a plus. They are NOT DevOps/SRE-title searches
(those live in Priority 5, off-target). Match them to backend/fullstack postings; never surface a
DevOps-Engineer title from this block.

### Priority 7: Abroad - Europe / Singapore / Australia (added 2026-10-12)

He opened these three markets on 2026-10-12, either **remote from Ha Noi or by relocating**
(visa sponsorship required for the latter). Any working hours are fine: it is a full-time switch.
Not in the default pass yet. It runs on `/scrape abroad` and `/scrape broad`. Promote it to the
default pass once a few runs show its yield, the same way Priority 6 was promoted on 2026-10-11.
English rules differ for these postings. See the Language Filter below: English as the working
language is flagged, not excluded.

**The whole of Europe, no country priority (2026-10-22).** He widened Europe to every EU/EEA
country plus the UK and Switzerland, with none ranked above another. Do not narrow the Europe
queries to a few hubs, and do not score a posting up or down for which European country it is
in. The salary floor does differ by country (see the Salary Filter below), and the local-language
rule in the Language Filter still applies.

```
site:linkedin.com/jobs "Golang" OR "Go Engineer" Singapore
site:linkedin.com/jobs "Backend Engineer" Go Australia
site:linkedin.com/jobs "Golang" "visa sponsorship" Europe
site:relocate.me golang OR "backend engineer"
site:arbeitnow.com golang OR "backend engineer" visa sponsorship
site:landing.jobs golang OR "backend developer" relocation
site:nodeflair.com golang OR "backend engineer" singapore
site:seek.com.au golang OR "go developer"
```

ATS boards — **always-run** whenever this category runs (see "No company whitelist" above).
They reach European, Singaporean and Australian employers that no curated list holds:

```
site:boards.greenhouse.io "Golang" OR "Go Engineer" Europe OR Singapore OR Australia
site:job-boards.greenhouse.io "Backend Engineer" Go "visa sponsorship"
site:jobs.lever.co "Golang" OR "Backend Engineer" Europe OR Singapore OR Australia
site:jobs.ashbyhq.com "Golang" OR "Go Engineer" Europe OR Singapore OR Australia
site:apply.workable.com "Golang" OR "Go Developer" relocation OR "visa sponsorship"
site:jobs.smartrecruiters.com "Golang" OR "Go Developer" Europe
site:recruitee.com "Golang" OR "Go Developer"
site:jobs.personio.de "Golang" OR "Go Developer"
site:teamtailor.com "Golang" OR "Backend Engineer" Go
```

Installed-CLI equivalents:

```
bun run .agents/skills/linkedin-search/cli/src/cli.ts search -q "Golang Backend Engineer" -l "Singapore"
bun run .agents/skills/linkedin-search/cli/src/cli.ts search -q "Golang Backend Engineer" -l "Australia"
bun run .agents/skills/linkedin-search/cli/src/cli.ts search -q "Golang Backend Engineer" -l "European Union"
bun run .agents/skills/linkedin-search/cli/src/cli.ts search -q "Golang Backend Engineer" -l "United Kingdom"
bun run .agents/skills/linkedin-search/cli/src/cli.ts search -q "Golang Backend Engineer" -l "Switzerland"
bun run .agents/skills/linkedin-search/cli/src/cli.ts search -q "Backend Engineer visa sponsorship" -l "European Union"
bun run .agents/skills/freehire-search/cli/src/cli.ts search -q "golang" --country SG,AU
bun run .agents/skills/freehire-search/cli/src/cli.ts search -q "golang" --region eu
bun run .agents/skills/ashby-search/cli/src/cli.ts search -q golang -l Singapore
bun run .agents/skills/greenhouse-search/cli/src/cli.ts search -q golang --tag eu-hours
```

Before keeping a relocation posting, check its sponsorship line. "Must have the right to work in
X" or "we do not sponsor" is a drop unless remote from Vietnam is also offered.

---

## Seniority Filter

Target bands: **Middle / Mid-level** (primary) and **Junior** (secondary).

**Tightened 2026-07-29.** Pham confirmed he is not at senior level yet, and the previous
"include Senior with caution if 3+ yrs" clause was diluting every `/scrape` and `/rank` run —
18 of 57 ranked postings in the 07-29 batch were Senior/Staff/Principal titles he cannot
realistically land. Seniority is now a **hard title-level filter**, not a judgement call.

- **Include:** Junior, Middle, Mid-level, "Developer" / "Engineer" with no band stated,
  Mid-Senior when the posting itself lists 2-4 yrs
- **Exclude (hard, by title):** any posting whose title contains **Senior, Sr., Staff,
  Principal, Lead, Tech Lead, Team Lead, Head of, Manager, or Architect** — drop it at Step 2
  regardless of how well the stack matches. A Go/Kafka posting titled "Senior Backend Engineer"
  is still excluded; the stack match does not buy an exemption.
- **Exception — range titles keep:** VN employers often open one req across two bands.
  `[Middle, Senior] BackEnd Engineer`, `Backend Engineer (Junior+/Senior)`, `Middle/Senior
  Fullstack Developer`, `Senior, Junior: ReactJS, Java`. When the title names **Junior or
  Middle alongside** Senior, the req is open at his level — **keep it** and treat it as the
  lower band. Only drop titles where Senior or above is the *sole* band.
- **Exclude (hard):** Intern, Fresher, Trainee, Graduate, Accelerator/Talent-Program and other
  early-career tracks — below the current level.
- **Untitled roles demanding 5+ years:** keep, but flag as a stretch. A plain "Backend Developer"
  posting that happens to ask for 5 yrs is still worth a look — the *title band* is what's being
  filtered, not the years line.

**Where this is enforced:** portal CLIs and WebSearch have no reliable negative-keyword syntax,
so the filter is applied **after fetching**, at `/scrape` Step 2 — excluded postings are written
to `seen_jobs.json` with `"status": "skipped"` (so dedup still works and they never resurface)
and are **not** presented in the Step 5 table. `/rank` therefore never sees them.

## Employment Type Filter (2026-10-22)

He takes **employment only** — no contractor and no freelance work, in Vietnam or abroad. This is
a hard filter, enforced the same way as the Seniority Filter: after fetching, at `/scrape` Step 2,
with excluded postings written to `seen_jobs.json` as `"status": "skipped"` and `"skip_reason":
"contract/freelance"`. The portal CLIs have no job-type flag, so it cannot be pushed into the
query.

- **Exclude (hard):** a title or employment-type field saying Contract, Contractor, Freelance,
  Freelancer, B2B, Independent Contractor, Fixed-term contract, Project-based, Hourly, Daily rate,
  Gig; or in Vietnamese Cộng tác viên, CTV, Freelancer, Theo dự án, Hợp đồng thời vụ. Also
  exclude a posting that pays a day rate, an hourly rate, or invoices through Deel,
  Remote.com, Oyster or a similar platform *as a contractor*.
- **Keep:** Full-time, Permanent, Chính thức, Toàn thời gian, and postings that state no type at
  all (most VN ads do not; treat silence as employment and let `/rank` check the detail page).
- **Remote for a foreign employer:** keep only when it is employment — through the employer's own
  local entity or an Employer of Record (EOR) that employs him in Vietnam. The same platforms
  (Deel, Remote.com, Oyster) run both models, so the platform name alone decides nothing: read
  whether the posting says *employee/EOR* or *contractor*. When it does not say, keep the posting
  and let `/rank` flag the question.
- **Unclear wording** ("Contract-to-hire", "6-month contract, extension possible"): exclude.
  Contract-to-hire starts as a contract, which is what he ruled out.

## Salary Filter

The floors are recorded in three places that must change together: CLAUDE.md's Deal-breakers,
`01-candidate-profile.md` → Constraints and `04-job-evaluation.md` → Life situation alignment.
The per-country Europe table exists only in `04-job-evaluation.md`. Do not copy the figures into
this file — a fourth copy is how the three drift apart. Read them from `04-job-evaluation.md`
when filtering.

- There is one floor for Vietnam and one per market abroad (per country inside Europe), because
  a single figure cannot cover Hanoi and Zurich.
- At `/scrape` time salary is usually missing or sign-in-gated, so **do not drop on salary at
  Step 2.** Keep the posting. `/rank` applies the floor when the detail page shows a figure: flag
  a posting clearly below it, and drop it only when the user asks for a hard cut.
- A posting with no stated salary passes. Most do not state one.
- The floors are filter bands, not expectations or asking figures. Never write an actual or
  expected salary into this repository (it is public).

## Low-Fit Triage (2026-10-11)

Step 3's quick fit signal predicts `/rank`'s score well enough to act on. Across 489 ranked
postings: **high** → 26 of 65 scored 70+; **medium** → 9 of 139; **low** → 5 of 285. Of the 16
tracker applications that can be matched to a scraped entry, every one was rated high or medium. Ranking low-fit postings was most of `/rank`'s
work for almost none of its output.

- **Low** fit → write the entry with `"status": "skipped"` and `"skip_reason": "low fit at
  scrape"` (keep `fit: "low"` too), so dedup still holds and `/rank` — which only selects `new`
  — never spends a scoring agent on it.
- **High / medium** fit → `"status": "new"` as before.
- In the Step 5 report, leave low-fit postings out of the table and give their count on one
  line instead (e.g. `low fit, not queued for /rank: 23`), so the cut stays visible.

The Language Gate's low override (an undeclared required language) lands in the same bucket.

## Location Filter

- **Ideal:** Ha Noi (all districts) - onsite or hybrid
- **Ideal:** Remote (Vietnam-based company)
- **Ideal:** Remote (foreign / offshore, USD) - Asian, European or Australian employer hours are
  all fine (2026-10-12); only a required US-hours overlap excludes. Employment only, never a
  contractor engagement (see the Employment Type Filter)
- **Acceptable:** Hybrid roles in Ha Noi with 1-3 office days
- **Borderline:** Bac Ninh, Hung Yen, Ha Nam - only if hybrid/mostly-remote, flag the commute
- **Too far:** Ho Chi Minh City, Da Nang, and all other provinces - **exclude unless the posting
  is explicitly fully remote**
- **Abroad, in scope since 2026-10-12:** Europe (EU/EEA, plus UK and Switzerland), Singapore,
  Australia. **Keep** onsite/hybrid postings there as relocation candidates and remote postings open
  to Vietnam, at any working hours. **Drop** a relocation posting that requires an existing right
  to work or says it does not sponsor, unless it also allows remote from Vietnam. Every European
  country counts equally (2026-10-22). Australian relocation visas carry an English-test
  condition; he is willing to sit IELTS (2026-10-22), so note it on the posting as information,
  never as a reason to drop or score it down.
- **Other countries** (US, India, Japan, Korea, the rest of Asia...) - exclude unless fully remote
  and open to Vietnam. US-hours overlap still excludes.

## Language Filter

Your working languages and levels are in CLAUDE.md's Languages table. When filtering scraped results, apply `04-job-evaluation.md`'s Language Gate: a posting requiring a language you haven't declared at all is excluded; a posting requiring a higher level than you declared in a language you do work in is not excluded, flag it clearly instead (see `job-scraper/SKILL.md`'s Step 3 "Quick Fit Assessment" for how the flag surfaces in `/scrape` output). Postings simply *written* in a language you don't work in, that don't require it on the job, are fine.

**Live-English carve-out (2026-09-03).** Roles requiring *live* English (client-facing, English-first
interviews, English standups) are still excluded by default — that is a CLAUDE.md deal-breaker
overriding the gate's FLAG verdict. The one exception he asked for: when a posting is an
**exceptional** technical match (Go + Kafka/gRPC/event-driven, a real performance or
distributed-systems brief, or fintech/banking backend), keep it, mark it `english-flag`, and let him
judge. "Exceptional" means it would rank near the top on its own merits — not merely that the stack
is relevant, which is true of most VN backend ads. **US-hours timezone overlap is a separate
deal-breaker and stays a hard exclude**; the carve-out does not reach it.

**Europe / Singapore / Australia postings (2026-10-12): flag, don't exclude.** English is the
working language there, so an English interview and English standups are a given. Keep the
posting and mark it `english-flag`. Exclude it only when it states a high spoken bar as a
requirement (fluent, native, excellent spoken English) or is client-facing, presenting or
consulting work, and the exceptional-match carve-out above still applies. A required local language
(German, Dutch, French...) is undeclared, so the Language Gate excludes it. "Nice to have" is fine.
The Vietnam-posting rule above is unchanged.

## Sector Weighting

*(Confirmed 2026-09-03. All four are in scope; they are not equal.)*

- **Fintech / banking** — aim here first. Strongest domain evidence (Sacombank STM, AION Bank).
- **Product companies & startups** — Go/microservices teams with room to design.
- **Digital transformation / public sector** — real experience (C06, Ministry of Public Security).
  Expect heavier process, which is a stated drain: weigh the ceremony, not just the stack.
- **Outsourcing / offshore services** — newly in scope, and by far the largest source of Vietnamese
  postings. This is the sector most likely to be ticket-only delivery against a client's fixed
  spec, which is his **top** drain. Do not filter it out at scrape time, but at `/rank` time look
  for evidence of design input — "you will own the module", "propose the solution", product team
  rather than staff-augmentation — and mark its absence. Volume from this sector should not be
  allowed to crowd the shortlist.

## Date Filter

**The application deadline (`Hạn nộp`) is the primary gate — the posting date is secondary.**

- **Deadline drives inclusion:** include any job whose application deadline has **not yet passed**,
  regardless of how old the posting is. Exclude jobs whose deadline has already passed.
- **Posting age is a soft bound, not a hard cutoff:** as a rule of thumb a posting older than
  **~1 month (30 days)** is stale enough to drop *when no deadline is stated* — but if a still-open
  deadline is present, keep the job even if it was posted longer ago.
- If neither a posting date nor a deadline can be determined, include the job but flag it as
  "date unknown".

Vietnamese portals often show `Cập nhật DD/MM/YYYY` or `Hạn nộp hồ sơ: DD/MM/YYYY` - parse both,
and treat `Hạn nộp` as the deadline (the field that matters most here).

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
- `/scrape frontend` -> Priority 3 queries (opt-in since 2026-10-11)
- `/scrape remote` -> Priority 4 queries + remote-filtered variants of Priority 1-2
- `/scrape devops` -> Priority 5 queries + Kubernetes/ArgoCD/observability variants
- `/scrape abroad` -> Priority 7 queries (Europe / Singapore / Australia, added 2026-10-12)
