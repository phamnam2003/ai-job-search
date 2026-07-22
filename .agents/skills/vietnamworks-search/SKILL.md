---
name: vietnamworks-search
version: 1.0.0
description: >
  Use this skill to search jobs in Vietnam on VietnamWorks (vietnamworks.com), one of
  Vietnam's largest general job boards (strong for product companies, banks and fintech),
  or to look up a specific VietnamWorks job posting. Covers developer, engineering, backend,
  frontend, fullstack, data, and DevOps roles in Ha Noi, Ho Chi Minh City, Da Nang and remote.
  Trigger phrases (English): VietnamWorks jobs, jobs Vietnam, software jobs Vietnam, Golang jobs
  Vietnam, backend developer Hanoi, find job Vietnam, IT jobs Ho Chi Minh. Trigger phrases
  (Vietnamese): việc làm VietnamWorks, tuyển dụng, việc làm IT, việc làm lập trình,
  tìm việc Hà Nội, tuyển lập trình viên, việc làm Golang, kỹ sư phần mềm.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/vietnamworks-search/cli/src/cli.ts *)
---

# VietnamWorks Search Skill

Search live job listings from **VietnamWorks** (vietnamworks.com), one of Vietnam's largest
general-purpose job boards, through its public job-search microservice. No authentication, no
API key, and **zero runtime dependencies** — it runs with just `bun`.

> This is a Vietnam-market portal skill in the repo's job-portal-skill pattern. VietnamWorks is
> a *general* board (not IT-only like TopDev/ITviec), so it is a strong complement for product
> companies, banks, and fintech employers that under-index on the IT-specific boards. The API
> serves the whole country; you narrow to a city with `--location`.

## ⚠️ Personal use only

This uses VietnamWorks' public job data via the same microservice that backs its website.
**Keep volume low, don't use it commercially or for bulk data collection.** This is for your
own personal job search only — run it on your own responsibility. (robots.txt permits the
search/listing paths; only apply/profile/internal-ajax paths are disallowed, and this skill
touches none of those.)

## When to use this skill

- Search job openings in Vietnam (Ha Noi, HCMC, Da Nang, or remote)
- Filter to a city with `--location` (client-side, accent-insensitive)
- Restrict to recent postings with `--jobage <days>`
- Get the full description of a specific VietnamWorks job posting

## Commands

### Search job listings

```bash
bun run .agents/skills/vietnamworks-search/cli/src/cli.ts search [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search (title, skill, role). e.g. `"golang"`, `"backend"`, `"react"`.
- `--location <text>` / `-l <text>` — filter results by location. Client-side and **accent-insensitive**, so `"Ha Noi"`, `"Hà Nội"`, or `"ha noi"` all match. Filtered against each posting's working-location city names (see Notes).
- `--jobage <days>` — only postings approved within the last N days. Client-side, using each posting's `approvedOn` date.
- `--page <n>` — page number (1-indexed, **up to 50 results per page**).
- `--limit <n>` / `-n <n>` — cap total results emitted (client-side).
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/vietnamworks-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

`id` is the numeric job ID from `search` results (e.g. `2076956`). You may also pass a full
VietnamWorks job URL ending in `-<id>-jv` or `-<id>-jd` — the trailing numeric id is extracted
automatically. Returns the full description (overview + requirements), salary, skills, company,
and location.

## Usage examples

```bash
# Golang roles filtered to Ha Noi
bun run .agents/skills/vietnamworks-search/cli/src/cli.ts search -q "golang" -l "Ha Noi" --format table

# Backend developer roles, newest first, quick scan
bun run .agents/skills/vietnamworks-search/cli/src/cli.ts search -q "backend developer" --limit 10 --format table

# Fullstack / React roles posted in the last 14 days
bun run .agents/skills/vietnamworks-search/cli/src/cli.ts search -q "fullstack react" --jobage 14 --format plain

# Software engineer roles in Ha Noi (Vietnamese city name works too)
bun run .agents/skills/vietnamworks-search/cli/src/cli.ts search -q "software engineer" -l "Hà Nội" --format table

# Second page of results
bun run .agents/skills/vietnamworks-search/cli/src/cli.ts search -q "developer" --page 2 --format table

# Full details for a specific job
bun run .agents/skills/vietnamworks-search/cli/src/cli.ts detail 2076956 --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, passing IDs to `detail`. Shape: `{ meta: { count, page }, results: [...] }` |
| `table` | Quick human-readable scanning (ID · title · company · location · salary) |
| `plain` | Reading listings or a single job's full detail (`detail` command) |

Each JSON result has `id`, `title`, `company`, `location`, `date` (ISO `approvedOn`), `url`, plus
the extras `salary` (human string, e.g. `"Thương lượng"` = negotiable) and `skills`. Missing
values are `null`, never omitted.

All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the process exits with code `1`.

## Notes

- **Data source:** VietnamWorks' public job-search microservice at
  `https://ms.vietnamworks.com/job-search/v1.0/search` — a POST/JSON endpoint, no credentials
  required. It backs the vietnamworks.com React SPA; the API is the clean, stable source.
- **Detail reuses the search endpoint.** The list view omits the description; filtering the same
  endpoint by `jobId` returns a single record that additionally carries `jobDescription`,
  `jobRequirement`, `skills`, and `benefits`. There is no separate detail API (the obvious
  `/job/v1.0/detail` paths return 403).
- **Location is client-side.** The microservice's own location filter field is undocumented and
  returned zero hits in testing, so `--location` filters the fetched page by matching each
  posting's working-location city names (accent-insensitive). It narrows *within* a page of up to
  50; combine with `--page` to scan further.
- **`--jobage` is client-side** against the `approvedOn` ISO date. Results are ordered
  newest-first, so a small `--jobage` plays well with `--limit`.
- **Page size is up to 50.** Use `--page` to paginate and `--limit` to cap output.
- **Salary** is passed through from the site's own `prettySalary` string (e.g.
  `"14tr-25tr ₫/tháng"`, `"$ 1,000-3,000 /tháng"`, or `"Thương lượng"` for negotiable).
- **General board, not IT-only.** Expect some non-engineering roles in broad keyword searches;
  keep `-q` specific (`"golang"`, `"backend engineer"`) for signal.
- VietnamWorks may rate-limit; the CLI retries 429/5xx with exponential backoff. Keep volume low.
