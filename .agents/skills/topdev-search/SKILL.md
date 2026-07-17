---
name: topdev-search
version: 1.0.0
description: >
  Use this skill to search IT and software jobs in Vietnam on TopDev (topdev.vn),
  Vietnam's largest IT job board, or to look up a specific TopDev job posting. Covers
  developer, engineering, backend, frontend, fullstack, data, DevOps and tech-lead roles
  in Ha Noi, Ho Chi Minh City, Da Nang and remote. Trigger phrases (English): TopDev jobs,
  IT jobs Vietnam, software jobs Vietnam, Golang jobs Vietnam, backend developer Hanoi,
  find IT job Vietnam, tech jobs Ho Chi Minh. Trigger phrases (Vietnamese): tuyển dụng IT,
  việc làm IT, việc làm lập trình, tìm việc IT Hà Nội, tuyển lập trình viên, việc làm Golang,
  tuyển dụng công nghệ thông tin.
context: fork
allowed-tools: Bash(bun run .agents/skills/topdev-search/cli/src/cli.ts *)
---

# TopDev Search Skill

Search live IT job listings from **TopDev** (topdev.vn), Vietnam's largest IT-focused
job board, through its public JSON API. No authentication, no API key, and **zero runtime
dependencies** — it runs with just `bun`.

> This is the Vietnam-market portal skill in the repo's job-portal-skill pattern. TopDev is
> IT-only, so results are software/engineering roles; the API serves the whole country and
> you narrow to a city with `--location`.

## ⚠️ Personal use only

This uses TopDev's public job data. **Keep volume low, don't use it commercially or for bulk
data collection.** topdev.vn's robots policy disallows named AI crawlers, so this is for your
own personal job search only — run it on your own responsibility.

## When to use this skill

- Search IT/software job openings in Vietnam (Ha Noi, HCMC, Da Nang, or remote)
- Filter to a city with `--location` (client-side, accent-insensitive)
- Get the full description of a specific TopDev job posting

## Commands

### Search job listings

```bash
bun run .agents/skills/topdev-search/cli/src/cli.ts search [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search (title, skill, role). Recommended. e.g. `"golang"`, `"backend"`, `"react"`.
- `--location <text>` / `-l <text>` — filter results by location. Client-side and **accent-insensitive**, so `"Ha Noi"`, `"Hà Nội"`, or `"ha noi"` all match. The API has no server-side region param (see Notes).
- `--jobage <days>` — accepted for compatibility but **unsupported** by the API (no-op; the search endpoint returns no posting date).
- `--page <n>` — page number (1-indexed, **10 results per page** — the API's fixed page size).
- `--limit <n>` / `-n <n>` — cap total results emitted (client-side).
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/topdev-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

`id` is the numeric job ID from `search` results (e.g. `2118052`). You may also pass a full
TopDev `detail-jobs/...` URL or a slug ending in `-<id>` — the trailing numeric id is
extracted automatically. Returns the full description (overview + responsibilities +
requirements + benefits), salary, skills, company, and location.

## Usage examples

```bash
# Golang roles, quick scan
bun run .agents/skills/topdev-search/cli/src/cli.ts search -q "golang" --limit 5 --format table

# Backend developer roles filtered to Ha Noi
bun run .agents/skills/topdev-search/cli/src/cli.ts search -q "backend developer" -l "Ha Noi" --format table

# Fullstack / React roles, readable listing
bun run .agents/skills/topdev-search/cli/src/cli.ts search -q "fullstack react" --format plain

# Kafka / microservices backend roles in Ha Noi, page 1
bun run .agents/skills/topdev-search/cli/src/cli.ts search -q "kafka" -l "Hà Nội" --format table

# Python roles, second page
bun run .agents/skills/topdev-search/cli/src/cli.ts search -q "python" --page 2 --format table

# Full details for a specific job
bun run .agents/skills/topdev-search/cli/src/cli.ts detail 2118052 --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, passing IDs to `detail`. Shape: `{ meta: { count, page }, results: [...] }` |
| `table` | Quick human-readable scanning (ID · title · company · location · salary) |
| `plain` | Reading listings or a single job's full detail (`detail` command) |

Each JSON result has `id`, `title`, `company`, `location`, `date`, `url`, plus the extras
`salary` (human string, or `"Negotiable"`) and `skills`. Missing values are `null`, never omitted.

All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the process exits with code `1`.

## Notes

- **Data source:** TopDev's public JSON:API at `api.topdev.vn` — no credentials required. The
  topdev.vn website is a Cloudflare-fronted SPA; the API is the clean, stable source.
- **Keyword recall is literal/tag-based and can be low.** During testing `golang` returned only
  2 hits while `python` returned 31 and `java` 17. If a query looks thin, **try a broader or
  alternate keyword** (e.g. `backend`, `developer`, a language name) or drop `-q` to browse all.
- **Location is client-side only.** The API ignores region params (`address_region_ids`,
  `province_id`, etc. all return the full result set), so `--location` filters the fetched page
  by matching the job's location string (accent-insensitive). It narrows *within* a page of 10;
  combine with `--page` to scan further.
- **`--jobage` is unsupported.** The search endpoint returns no posting date (`date` is always
  `null`), so there is no age to filter on. The flag is accepted but has no effect.
- **Page size is fixed at 10.** The API ignores `per_page`; use `--page` to paginate and
  `--limit` to cap output.
- **Salary:** formatted from the reliable VND `min_filter`/`max_filter` range; shows
  `"Negotiable"` when the employer marks it so, and `null` when the range is hidden/masked.
- TopDev may rate-limit; the CLI retries 429/5xx with exponential backoff. Keep volume low.
