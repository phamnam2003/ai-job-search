---
name: itnavi-search
version: 1.0.0
description: >
  Use this skill whenever the user wants to search IT/software jobs in Vietnam,
  find listings on ITNavi (itnavi.com.vn), or look up a specific ITNavi job posting.
  ITNavi is a Vietnamese IT job board with solid Go/backend coverage. Invoke for
  developer, engineer, backend, frontend, fullstack, DevOps, data, and QA roles in
  the Vietnamese market, even if the user does not name ITNavi. Trigger phrases
  (English): ITNavi jobs, IT jobs Vietnam, Golang jobs Hanoi, backend developer
  Vietnam, developer jobs Hanoi, software engineer Ho Chi Minh, find IT job Vietnam.
  Trigger phrases (Vietnamese): việc làm IT, tuyển dụng lập trình viên, việc làm
  Golang Hà Nội, tìm việc Golang, việc làm backend, tuyển dụng IT, việc làm
  developer, tuyển lập trình viên Hà Nội.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/itnavi-search/cli/src/cli.ts *)
---

# ITNavi Search Skill

Search live IT/software job listings from **ITNavi** (itnavi.com.vn), a Vietnamese
IT job board with good Go/backend coverage. Pages are server-rendered HTML — no
authentication, no API key, and **zero runtime dependencies**: it runs with just `bun`.

Best suited to the Vietnamese tech market: filter by city (`ha-noi`, `ho-chi-minh`,
`da-nang`, `khac`) and keyword (Golang, Backend, Fullstack, Frontend, DevOps, data, QA, …).
ITNavi is a smaller board — a handful of results per query is expected and normal.

## Courtesy note

ITNavi's `robots.txt` only disallows `/admin` and `/blog/search`, so the `/job/*` and
`/job-detail/*` pages this skill uses are permitted. It is intended for **personal use** —
keep request volume low and polite (no bulk scraping).

## When to use this skill

- Search IT job openings in a Vietnamese city by keyword/skill/role
- Scan the market for a technology (e.g. Golang, Backend)
- Get the full description, skills, and salary of a specific ITNavi job

## Commands

### Search job listings

```bash
bun run .agents/skills/itnavi-search/cli/src/cli.ts search [--query "<kw>"] [--location <city>] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword (title, skill, role). Multi-word input is hyphenated into the URL path (`"backend developer"` → `backend-developer`). Recommended.
- `--location <slug>` / `-l <slug>` — city slug path segment: `ha-noi`, `ho-chi-minh`, `da-nang`, `khac`.
- `--jobage <days>` — **best-effort**: a client-side filter on each card's relative posted-age label (e.g. "5 d"). Rows with an unparseable age are kept.
- `--page <n>` — page number (1-indexed).
- `--limit <n>` / `-n <n>` — cap total results emitted (client-side).
- `--no-enrich` — skip the per-result `get-job-by-id` lookup (fewer requests, but `url`/`slug`/`salary`/`posted` come back `null`).
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/itnavi-search/cli/src/cli.ts detail <id|slug|url> [--format json|plain]
```

Pass a **numeric job id** (e.g. `24005`, resolved via ITNavi's `get-job-by-id` JSON
endpoint), or a job **slug** / full **URL** from a search result's `url` field. Returns
the description, skills, salary, location, and posted date.

## Usage examples

```bash
# Golang roles, quick scan
bun run .agents/skills/itnavi-search/cli/src/cli.ts search -q "golang" --limit 5 --format table

# Backend roles in Ha Noi, top 10
bun run .agents/skills/itnavi-search/cli/src/cli.ts search -q "backend" -l "ha-noi" --limit 10 --format table

# Fullstack roles
bun run .agents/skills/itnavi-search/cli/src/cli.ts search -q "fullstack" --format table

# Page 2 of Golang roles, as JSON
bun run .agents/skills/itnavi-search/cli/src/cli.ts search -q "golang" --page 2 --format json

# Full details for one job — by id (clean JSON endpoint)
bun run .agents/skills/itnavi-search/cli/src/cli.ts detail 24005 --format plain

# ...or by url / slug from a search result
bun run .agents/skills/itnavi-search/cli/src/cli.ts detail golang-backend-developer-bnpl-project --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, passing the `id`/`url` to `detail` |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single job's full detail (`detail` command) |

Search JSON shape: `{ "meta": { "count": <n>, "page": <n> }, "results": [ { id, title, company, location, date, ageDays, posted, salary, url, slug } ] }`.
Missing values are `null` (never omitted). All errors are written to **stderr** as
`{ "error": "...", "code": "..." }` with exit code `1`.

## How it works (and why the id matters)

ITNavi's search page is a master/detail layout. The left column is a list of
`.jsl-item` cards; **each card carries only a numeric `data-id` and has no detail
hyperlink** — clicking it triggers an in-page AJAX swap, not navigation. So the
real detail URL cannot be read from the card, and it cannot be reconstructed from
the title either (ITNavi appends a random suffix to some slugs, e.g. `game-developer-O8qvL`).

- **`search`** parses `id`, `title`, `company`, `location`, and relative `date` from the card HTML in **one request**. It then **enriches** only the emitted results (post `--jobage`/`--limit`) by calling `https://itnavi.com.vn/ajax/get-job-by-id/<id>` — a public JSON endpoint that returns each job's authoritative `job_slug` (the `url`), `posted` date, and `salary`. Enrichment is per-result and independent; a failure leaves that one row's `url` null without aborting the search. Use `--no-enrich` to stay at exactly one request.
- **`detail`** takes a numeric id → the same JSON endpoint (clean, complete), or a slug/URL → scrapes the standalone `/job-detail/<slug>` page.

## Notes

- **Salary** is often shown as `Thương lượng` (negotiable) via the JSON endpoint, or gated behind login on the standalone job page (then `null`). The `search` command reports the JSON-endpoint value; `detail <slug|url>` reports the (usually gated) page value.
- **`--jobage`** is a best-effort **client-side** filter — ITNavi exposes no posting-age query param, so the CLI parses each card's relative age label ("5 d" = 5 days). Only `d` (days) is seen live; h/w/mo/y are handled defensively; unparseable ages are never dropped.
- City slugs verified live: `ha-noi`, `ho-chi-minh`, `da-nang`, `khac`.
- Result volume is modest (≈10 cards/page); combining a niche keyword with a city can legitimately return zero.
