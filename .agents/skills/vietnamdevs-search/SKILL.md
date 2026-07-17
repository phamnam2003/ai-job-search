---
name: vietnamdevs-search
version: 1.0.0
description: >
  Use this skill whenever the user wants to search IT/software jobs in Vietnam on
  VietnamDevs (vietnamdevs.com) — a curated, English-friendly job board with many
  remote and offshore-friendly roles — or look up a specific VietnamDevs posting.
  Great for backend, frontend, fullstack, Golang, Java, Python, DevOps, data, QA,
  and mobile roles, and especially for remote developer jobs, even if the user does
  not name VietnamDevs. Trigger phrases (English): VietnamDevs jobs, IT jobs Vietnam,
  remote developer jobs Vietnam, backend developer Vietnam, Golang jobs Vietnam,
  software engineer Ho Chi Minh, developer jobs Hanoi, offshore developer jobs
  Vietnam, English-friendly IT jobs Vietnam. Trigger phrases (Vietnamese): việc làm
  IT, việc làm lập trình, việc làm remote, tuyển dụng lập trình viên, việc làm
  developer, tìm việc IT Việt Nam, việc làm backend, tuyển dụng IT remote, việc làm
  lập trình viên Hà Nội.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/vietnamdevs-search/cli/src/cli.ts *)
---

# VietnamDevs Search Skill

Search live IT/software job listings from **VietnamDevs** (vietnamdevs.com), a curated,
**English-friendly** IT job board for the Vietnamese market with a strong share of
**remote / offshore-friendly** roles. Pages are server-rendered HTML — no
authentication, no API key, and **zero runtime dependencies**: it runs with just `bun`.

Filter by a category keyword (Golang, Backend, Frontend, DevOps, data, QA, …), by city
(`ha-noi`, `ho-chi-minh`, `da-nang`), or surface **remote** roles via the special
`--location remote` filter.

## Courtesy note

VietnamDevs' `robots.txt` **allows** `/jobs` (only `/google/login`, `/google/callback`,
and `/newsletter/` are disallowed), so this does not violate their rules. It is intended
for **personal use** — keep request volume low and polite (no bulk scraping).

## When to use this skill

- Search IT job openings in Vietnam by category keyword, city, or remote status
- Scan the market for a technology (e.g. Golang, or remote Golang roles)
- Get the full description, tags, employment type, and apply-by date of a specific posting

## Commands

### Search job listings

```bash
bun run .agents/skills/vietnamdevs-search/cli/src/cli.ts search [--query "<kw>"] [--location <slug>] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — a **category keyword** that maps to a URL path segment. VietnamDevs has a **fixed taxonomy**; use one of: `golang`, `java`, `python`, `php`, `nodejs`, `reactjs`, `vuejs`, `back-end`, `front-end`, `full-stack`, `sre-devops`, `mobile-engineer`, `data-engineer`, `machine-learning`, `qa-qc`, `project-manager`. A keyword outside the taxonomy (e.g. `backend`, `kafka`) returns **no results** (the site 404s that path). Multi-word input is hyphenated (`"back end"` → `back-end`).
- `--location <slug>` / `-l <slug>` — a city path segment: `ha-noi`, `ho-chi-minh`, `da-nang`. Combines with a keyword as `/jobs/<keyword>/<city>`. The special value `remote` is **not** a URL path (VietnamDevs has no remote path); it is applied as a **client-side filter** keeping only cards labelled "Remote working".
- `--jobage <days>` — **best-effort.** Filters on each card's relative posted-age label (`3d`, `1w`, `2mos`). Cards with an unparseable age are kept, never dropped.
- `--page <n>` — page number (1-indexed). The base `/jobs` listing paginates ~60 per page.
- `--limit <n>` / `-n <n>` — cap total results emitted (client-side).
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/vietnamdevs-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

Pass a **bare numeric id** (e.g. `928767371223434`), an `<id>/<slug>` fragment, or the full
job **URL** from a search result's `url` field. A bare id works: `/jobs/<id>/<anything>`
redirects to the canonical page, so the slug is not required. Detail metadata (title,
company, location, employment type, posted date, apply-by deadline) is read from the page's
`JobPosting` structured-data block; the description is the rendered job body with paragraphs
and bullets preserved.

## Usage examples

```bash
# Golang roles (quick scan)
bun run .agents/skills/vietnamdevs-search/cli/src/cli.ts search -q "golang" --format table

# Backend roles in Ha Noi, top 10
bun run .agents/skills/vietnamdevs-search/cli/src/cli.ts search -q "back-end" -l "ha-noi" --limit 10 --format table

# Remote Golang roles (client-side "Remote working" filter)
bun run .agents/skills/vietnamdevs-search/cli/src/cli.ts search -q "golang" -l "remote" --format table

# Recent Ho Chi Minh City postings (last 14 days, best-effort)
bun run .agents/skills/vietnamdevs-search/cli/src/cli.ts search -l "ho-chi-minh" --jobage 14 --format json

# Page 2 of all jobs
bun run .agents/skills/vietnamdevs-search/cli/src/cli.ts search --page 2 --format table

# Full detail for one job (bare id from a search result)
bun run .agents/skills/vietnamdevs-search/cli/src/cli.ts detail 928767371223434 --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, passing the `id`/`url` to `detail` |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single job's full detail (`detail` command) |

Search JSON shape: `{ "meta": { "count": <n>, "page": <n> }, "results": [ { id, title, company, location, employmentType, workingModel, salary, date, tags, url } ] }`.
Missing values are `null` (never omitted). All errors are written to **stderr** as
`{ "error": "...", "code": "..." }` with exit code `1`.

## Notes

- **Keyword taxonomy is fixed.** Unlike free-text boards, VietnamDevs search is category-path based. Use the slugs listed above; anything else returns an empty result set. Location paths verified live: `ha-noi`, `ho-chi-minh`, `da-nang`.
- **Location filtering is real but the card shows one city.** `/jobs/back-end/ha-noi` genuinely narrows results (e.g. 25 → 5), but a multi-location job's card may display its primary city (often Ho Chi Minh City) even when it also matched Ha Noi.
- **Remote status is a card label, not the location text.** A card can read "Ho Chi Minh City" yet carry a "Remote working" tag. `--location remote` filters on that tag; `workingModel` (`"Remote"` / `"Hybrid"` / `null`) is exposed on every result.
- **Salary is rarely shown** — only some cards carry a green salary chip; when absent, `salary` is `null`.
- **`date` on search is a relative age** (`3d`, `1w`, `2mos`); the `detail` `date`/`deadline` are ISO 8601 (`datePosted` / `validThrough`).
- **Job ids are large numeric strings** (e.g. `928767371223434`) — kept as strings.
- **Parsing:** search results are split into per-`.card-hoverable` chunks and parsed independently so one bad card cannot break the rest; detail metadata comes from the `JobPosting` ld+json and the description from the rendered `.typography` block.
