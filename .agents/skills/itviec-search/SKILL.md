---
name: itviec-search
version: 1.0.0
description: >
  Use this skill whenever the user wants to search IT/software jobs in Vietnam,
  find listings on ITviec (itviec.com), or look up a specific ITviec job posting —
  especially for Ha Noi, Ho Chi Minh, or Da Nang. Invoke for developer, engineer,
  backend, frontend, fullstack, DevOps, data, QA, and other tech roles in the
  Vietnamese market, even if the user does not name ITviec. Trigger phrases (English):
  ITviec jobs, IT jobs Vietnam, developer jobs Hanoi, Golang jobs Hanoi, backend
  developer Vietnam, software engineer Ho Chi Minh, find IT job Vietnam, tech jobs
  Da Nang. Trigger phrases (Vietnamese): việc làm IT, tuyển dụng lập trình viên,
  tìm việc Golang Hà Nội, việc làm IT Hà Nội, tuyển dụng backend, việc làm
  developer, tìm việc IT, tuyển dụng IT Hồ Chí Minh, việc làm fullstack, tuyển
  lập trình viên Hà Nội.
context: fork
allowed-tools: Bash(bun run .agents/skills/itviec-search/cli/src/cli.ts *)
---

# ITviec Search Skill

Search live IT/software job listings from **ITviec** (itviec.com), Vietnam's leading
IT job board. Pages are server-rendered HTML — no authentication, no API key, and
**zero runtime dependencies**: it runs with just `bun`.

Best suited to the Vietnamese tech market: filter by city (`ha-noi`, `ho-chi-minh`,
`da-nang`) and keyword (Golang, Backend, Fullstack, Frontend, DevOps, data, QA, …).

## Courtesy note

ITviec's `robots.txt` **allows** crawling (only `/subscriptions/new` is disallowed), so
this does not violate their rules. It is intended for **personal use** — keep request
volume low and polite (no bulk scraping).

## When to use this skill

- Search IT job openings in a Vietnamese city by keyword/skill/role
- Scan the market for a technology (e.g. Golang in Ha Noi)
- Get the full description, skills, and working model of a specific ITviec job

## Commands

### Search job listings

```bash
bun run .agents/skills/itviec-search/cli/src/cli.ts search [--query "<kw>"] [--location <city>] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword (title, skill, role). Multi-word input is hyphenated into the URL path (`"backend developer"` → `backend-developer`). Recommended.
- `--location <slug>` / `-l <slug>` — city slug path segment: `ha-noi`, `ho-chi-minh`, `da-nang`.
- `--jobage <days>` — **best-effort only.** ITviec has no reliable posting-age query param, so this flag is accepted (and validated) but **not applied** to results.
- `--page <n>` — page number (1-indexed).
- `--limit <n>` / `-n <n>` — cap total results emitted (client-side).
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/itviec-search/cli/src/cli.ts detail <slug|url> [--format json|plain]
```

Pass the job **slug** (e.g. `backend-developer-golang-dnse-4853`) or the full job **URL**
from a search result's `url` field. A bare numeric id (e.g. `4853`) cannot be resolved to a
job page and returns a `NEED_SLUG` error. Returns the description, skills, working model,
location, and posted date.

## Usage examples

```bash
# Golang roles in Ha Noi (quick scan)
bun run .agents/skills/itviec-search/cli/src/cli.ts search -q "golang" -l "ha-noi" --format table

# Backend developer roles in Ha Noi, top 10
bun run .agents/skills/itviec-search/cli/src/cli.ts search -q "backend developer" -l "ha-noi" --limit 10 --format table

# Fullstack roles in Ha Noi
bun run .agents/skills/itviec-search/cli/src/cli.ts search -q "fullstack" -l "ha-noi" --format table

# Frontend / ReactJS roles in Ha Noi
bun run .agents/skills/itviec-search/cli/src/cli.ts search -q "reactjs" -l "ha-noi" --format table

# Page 2 of Golang roles in Ho Chi Minh, as JSON
bun run .agents/skills/itviec-search/cli/src/cli.ts search -q "golang" -l "ho-chi-minh" --page 2 --format json

# Full details for one job (slug from a search result)
bun run .agents/skills/itviec-search/cli/src/cli.ts detail backend-developer-golang-dnse-4853 --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, passing the `url`/slug to `detail` |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single job's full detail (`detail` command) |

Search JSON shape: `{ "meta": { "count": <n>, "page": <n> }, "results": [ { id, title, company, companyUrl, location, date, salary, skills, url } ] }`.
Missing values are `null` (never omitted). All errors are written to **stderr** as
`{ "error": "...", "code": "..." }` with exit code `1`.

## Notes

- **Salary is frequently sign-in gated** on ITviec for anonymous requests; when so, `salary` is `null`. A visible salary is captured verbatim when present.
- **`--jobage` is not supported** — ITviec exposes no reliable posting-age filter (only "lab" freshness experiments), so the flag is a documented no-op. Use the human-readable `date` field ("Posted X ago") to judge freshness.
- **Parsing** reads two complementary structures on each search page: an authoritative `application/ld+json` `ItemList` (the reliable id/url list) and the rich per-`.job-card` markup (title, company, location, date, salary, skills). Cards are parsed independently per-card so one bad card cannot break the rest; the ItemList is a fallback if card markup shifts.
- **`detail` uses the lightweight `/it-jobs/<slug>/content` partial** for clean description HTML. Job ids can carry leading zeros (e.g. `0422`) and are kept as strings.
- City slugs verified live: `ha-noi`, `ho-chi-minh`, `da-nang`.
