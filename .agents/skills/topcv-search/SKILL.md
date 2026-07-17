---
name: topcv-search
version: 1.0.0
description: >
  Use this skill whenever the user wants to search jobs in Vietnam on TopCV
  (topcv.vn), Vietnam's largest-volume job board, or look up a specific TopCV job
  posting — especially for Ha Noi, Ho Chi Minh, or Da Nang. Invoke for developer,
  engineer, backend, frontend, fullstack, IT, and other roles in the Vietnamese
  market, even if the user does not name TopCV. Trigger phrases (English): TopCV
  jobs, IT jobs Vietnam, developer jobs Hanoi, backend developer Vietnam, software
  engineer Ho Chi Minh, find job Vietnam, Golang jobs Hanoi, tech jobs Da Nang.
  Trigger phrases (Vietnamese): việc làm, tuyển dụng, tìm việc làm Hà Nội, việc
  làm IT, tuyển dụng lập trình viên, tìm việc backend, việc làm developer, tuyển
  dụng IT Hà Nội, tìm việc làm TopCV, việc làm fullstack, tuyển lập trình viên.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/topcv-search/cli/src/cli.ts *)
---

# TopCV Search Skill

Search live job listings from **TopCV** (topcv.vn), Vietnam's largest-volume job
board. Pages are server-rendered HTML — no authentication, no API key, and **no
npm dependencies**. Fetching uses the system `curl` binary (TopCV's WAF blocks
Bun's native `fetch` by TLS fingerprint; curl is allowed), so it runs with just
`bun` + `curl` — both standard on Windows 10+, macOS, and Linux.

Best suited to the Vietnamese market across all sectors (TopCV is general-purpose,
not IT-only): filter by keyword (backend, golang, fullstack, react, …) and city
(`ha-noi`, `ho-chi-minh`, `da-nang`, and 60+ more provinces).

## Courtesy note

TopCV's `robots.txt` **allows** the search and job-detail paths (it only disallows
CV/account paths like `/xem-cv/`, `/viet-cv/`, `/private/`), so this does not
violate their rules. It is intended for **personal use** — TopCV is a large site
and may rate-limit, so keep request volume low and polite (no bulk scraping).

## When to use this skill

- Search job openings in a Vietnamese city by keyword/skill/role
- Scan the market for a technology (e.g. Golang in Ha Noi)
- Get the full description, requirements, and benefits of a specific TopCV job

## Commands

### Search job listings

```bash
bun run .agents/skills/topcv-search/cli/src/cli.ts search [--query "<kw>"] [--location <city>] [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword (title, skill, role). Multi-word input is hyphenated into the URL slug (`"backend developer"` → `backend-developer`). Defaults to `it` when omitted.
- `--location <city>` / `-l <city>` — city name/slug (`ha-noi`, `ho-chi-minh`, `da-nang`, …). Mapped to TopCV's server-side city filter (`-tai-<slug>-kl<id>`). An unknown value falls back to a client-side filter on the card's location text.
- `--jobage <days>` — **best-effort.** Max posting age in days, applied client-side by parsing each card's freshness text ("Đăng 2 tuần trước"). Weeks/months are approximated (×7 / ×30).
- `--page <n>` — page number (1-indexed).
- `--limit <n>` / `-n <n>` — cap total results emitted (client-side).
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/topcv-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

Pass the full job **URL** from a search result's `url` field (either the
`/viec-lam/…/<id>.html` or `/brand/…-j<id>.html` shape) — this is the reliable
input. A bare numeric **id** also works: it is reconstructed as
`/viec-lam/j/<id>.html` (TopCV resolves a job by its trailing id regardless of the
slug), but if that id no longer maps to a live posting the command returns a
`NEED_URL` error asking for the full URL. Returns description, requirements,
benefits, salary, location, and application deadline.

## Usage examples

```bash
# Backend roles in Ha Noi (quick scan)
bun run .agents/skills/topcv-search/cli/src/cli.ts search -q "backend" -l "ha-noi" --format table

# Golang roles in Ha Noi, top 10
bun run .agents/skills/topcv-search/cli/src/cli.ts search -q "golang" -l "ha-noi" --limit 10 --format table

# Fullstack roles in Ha Noi
bun run .agents/skills/topcv-search/cli/src/cli.ts search -q "fullstack" -l "ha-noi" --format table

# Page 2 of backend roles in Ho Chi Minh, as JSON
bun run .agents/skills/topcv-search/cli/src/cli.ts search -q "backend" -l "ho-chi-minh" --page 2 --format json

# Only jobs posted within ~7 days
bun run .agents/skills/topcv-search/cli/src/cli.ts search -q "backend" -l "ha-noi" --jobage 7 --format table

# Full details for one job (url from a search result)
bun run .agents/skills/topcv-search/cli/src/cli.ts detail https://www.topcv.vn/viec-lam/backend-developer/2231500.html --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, passing the `url` to `detail` |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single job's full detail (`detail` command) |

Search JSON shape: `{ "meta": { "count": <n>, "page": <n> }, "results": [ { id, title, company, companyUrl, location, date, salary, url } ] }`.
Missing values are `null` (never omitted). All errors are written to **stderr** as
`{ "error": "...", "code": "..." }` with exit code `1`.

## Notes

- **Location** filtering works only through the URL slug (`-tai-ha-noi-kl1`). The `?city_id=`/`?locations=` query params are silently ignored by TopCV, so the CLI maps `--location` to the slug form (68 provinces mapped, plus aliases: `hanoi`, `hcm`, `hcmc`, `tphcm`, `saigon`, `danang`). City ids verified live 2026-07: `ha-noi`=1, `ho-chi-minh`=2, `da-nang`=8.
- **`date`** is the card's *posted* freshness ("Đăng 2 tuần trước"), which varies per job — not the bulk-refresh "Cập nhật …" timestamp (mostly identical across a page).
- **Salary** is frequently `Thoả thuận` (negotiable) on TopCV; it is captured verbatim, and a numeric range ("20 - 30 triệu") is captured when shown.
- **Parsing** chunks each search page by the `.job-item-search-result` container so one malformed card cannot break the rest; each card is parsed independently. The job id comes from the `data-job-id` attribute and is cross-checked against the detail link.
- **`detail`** works for both job-URL shapes (identical markup) and reconstructs a bare id via the slug-agnostic `/viec-lam/j/<id>.html`.
