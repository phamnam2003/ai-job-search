# Search Queries for Job Scraper

<!-- Populated by /setup on 2026-07-12 for Pham Hai Nam (Backend/Fullstack, Ha Noi + Remote) -->

## Search Sites

### Primary (IT-specific, Vietnam)

| Portal | URL | Notes |
|--------|-----|-------|
| **ITviec** | `itviec.com` | Highest-signal IT board in VN. Curated, English-friendly, good salary transparency. Supports clean slug URLs: `itviec.com/it-jobs/<skill>/ha-noi` |
| **TopDev** | `topdev.vn` | IT-only, strong for Go/backend. Slug: `topdev.vn/viec-lam-it/golang-kt203` |
| **VietnamDevs** | `vietnamdevs.com` | Hand-verified postings, mid-level and above, many offshore/remote-USD roles |
| **ITNavi** | `itnavi.com.vn` | Smaller but decent Go/backend coverage: `itnavi.com.vn/job/Golang` |

### Primary (general boards with large IT sections)

| Portal | URL | Notes |
|--------|-----|-------|
| **TopCV** | `topcv.vn` | Largest volume in VN, strongest for junior/mid. Slug: `topcv.vn/tim-viec-lam-<role>` |
| **VietnamWorks** | `vietnamworks.com` | Largest general portal, good for product companies & banks |
| **CareerViet** | `careerviet.vn` | Mid-size general board, decent IT listings |
| **LinkedIn** | `linkedin.com/jobs` | **Has an installed CLI** (`.agents/skills/linkedin-search/`) - use it as the primary mechanism. Best channel for remote/offshore |
| **Indeed VN** | `vn.indeed.com` | Aggregator - useful for catching what the others miss |
| **Glints** | `glints.com/vn` | Startup-heavy, SEA regional, remote-friendly |

### Remote / offshore (USD-paying)

- `linkedin.com/jobs` with `Remote` + `Vietnam` / `Asia` filters
- `vietnamdevs.com` (remote tag)
- `wellfound.com` (ex-AngelList) - startup remote roles open to APAC
- `remoteok.com` / `weworkremotely.com` - filter for `Go` / `Golang` / `Backend`, check timezone requirements

### Tooling note

Only **LinkedIn** has an installed portal CLI. The Vietnamese portals above have no CLI, so
`/scrape` will hit them via `WebSearch` with the `site:` queries below. To get proper CLI
coverage (structured results, dedup, date filters), scaffold them with:

```
/add-portal itviec.com
/add-portal topdev.vn
/add-portal topcv.vn
```

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
```

LinkedIn CLI equivalent (preferred over WebSearch):

```
bun run .agents/skills/linkedin-search/cli/src/cli.ts search --keywords "Golang Backend Developer" --location "Hanoi, Vietnam"
bun run .agents/skills/linkedin-search/cli/src/cli.ts search --keywords "Go Backend Engineer" --location "Vietnam" --remote
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
```

Timezone check is mandatory on these - reject anything requiring US-hours overlap unless the
user explicitly opts in.

### Priority 5: Adjacent - DevOps / Platform / Cloud

Pivot lane. The CV genuinely supports this (Docker, Kubernetes + Calico/Cilium/Envoy/Nginx
Ingress, ArgoCD/GitOps, OpenTelemetry, Prometheus/Grafana/Loki, self-hosted GitLab Runners,
GitHub Actions), though there is no formal DevOps job title yet - expect these to be a stretch
at mid-level and to compete against candidates with platform-team titles.

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
```

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
