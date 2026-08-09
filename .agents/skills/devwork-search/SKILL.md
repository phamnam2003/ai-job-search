---
name: devwork-search
version: 1.0.0
description: >
  Use this skill whenever the user wants to search IT/software jobs in Vietnam on
  Devwork (devwork.vn), a Hanoi-based IT recruitment and referral network, or to
  look up a specific Devwork posting. Devwork lists backend, frontend, fullstack,
  Golang, Java, NodeJS, ReactJS, VueJS, PHP, mobile and DevOps roles, and unlike
  most Vietnamese boards it publishes salary bands on the listing itself. Invoke
  for developer and engineer roles in the Vietnamese market even if the user does
  not name Devwork. Trigger phrases (English): Devwork jobs, IT jobs Vietnam,
  developer jobs Hanoi, Golang jobs Hanoi, backend developer Vietnam, IT
  recruitment Vietnam, referral bonus jobs. Trigger phrases (Vietnamese): việc làm
  IT, tuyển dụng lập trình viên, việc làm lập trình Hà Nội, việc làm Golang,
  tuyển dụng IT, việc làm có thưởng giới thiệu.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/devwork-search/cli/src/cli.ts *)
---

# Devwork Search

Searches **devwork.vn**, a Hanoi-based IT recruitment / referral network. Volume is
small compared with the big general boards, but almost every listing is a
developer role, and the board is Hanoi-heavy — which makes its hit rate high for a
Hanoi-based backend/fullstack search.

Zero runtime dependencies — plain `bun` + `fetch` + regex over the server-rendered
HTML.

## Courtesy note

Devwork's `robots.txt` is a single record — `User-agent: *` with `Disallow: /admin?*` — so
the search and job-detail paths this CLI uses are **allowed**, and no crawler is singled out.
Verified 2026-08-09 with `python tools/robots_check.py`. Devwork is a small board; keep
request volume low and polite (personal use, no bulk scraping).

## What makes this portal worth running

**Salary bands are published on the card.** Most Vietnamese boards hide pay behind
"Thoả thuận" / "Cạnh tranh"; Devwork shows a real VND band (e.g. `35-45 triệu`) on
the listing itself, so a salary floor can be applied before spending any detail
fetches. Detail pages additionally state the **seniority band** (`Vị trí`) and
**years of experience** (`Kinh nghiệm`) as explicit fields, which is unusually
convenient for a level filter.

## Commands

```
bun run .agents/skills/devwork-search/cli/src/cli.ts search [--query "<tag>"] [--location <city>] [flags]
bun run .agents/skills/devwork-search/cli/src/cli.ts detail <id|url> [--format json|plain]
bun run .agents/skills/devwork-search/cli/src/cli.ts tags
```

### Search flags

| Flag | Meaning |
|------|---------|
| `--query`, `-q <tag>` | **Technology tag, not free text** — see below. Omit to list all openings |
| `--location`, `-l <city>` | Client-side substring filter, diacritic-insensitive (`ha noi` matches `Hà Nội`) |
| `--page <n>` | 1-indexed page, 20 listings/page. Default 1 |
| `--limit`, `-n <n>` | Cap results emitted (client-side) |
| `--format <fmt>` | `json` (default) \| `table` \| `plain` |

### `-q` takes a fixed tag, not free text

Devwork browses by technology slug (`/viec-lam/golang`), the same shape as
`vietnamdevs-search`. Run `tags` for the known list:

`golang` · `java` · `javascript` · `nodejs` · `reactjs` · `vuejs` · `angular` ·
`php` · `laravel` · `python` · `ruby` · `dotnet` · `android` · `ios` · `flutter` ·
`devops` · `tester` · `business-analyst`

An unknown slug returns an empty page rather than a 404, so a typo looks like
"no results" — check the tag before concluding the board is empty.

## Examples

```bash
# All current Golang openings
bun run .agents/skills/devwork-search/cli/src/cli.ts search -q "golang" --format table

# NodeJS roles in Ha Noi only
bun run .agents/skills/devwork-search/cli/src/cli.ts search -q "nodejs" -l "ha noi" --format table

# Everything currently listed, machine-readable for /scrape
bun run .agents/skills/devwork-search/cli/src/cli.ts search --limit 20 --format json

# Second page of Java roles
bun run .agents/skills/devwork-search/cli/src/cli.ts search -q "java" --page 2 --format table

# Full posting
bun run .agents/skills/devwork-search/cli/src/cli.ts detail 13758 --format plain
```

## Output format

`search --format json` emits:

```json
{ "meta": { "count": 5, "page": 1 }, "results": [ ... ] }
```

| Field | Notes |
|-------|-------|
| `id` | Numeric Devwork job ID |
| `title` | Decoded text |
| `company` | From the logo `alt` attribute — `null` on listings with no logo |
| `companyUrl` | Always `null` on cards; populated on `detail` when present |
| `location` | e.g. `Hà Nội`. Some listings are overseas (Seoul) — check it |
| `date` | Always `null` — Devwork shows no posting date anywhere |
| `deadline` | `null` on cards; populated on `detail` (already ISO) |
| `salary` | VND band, e.g. `35-45 triệu` |
| `skills` | Technology chips from the card |
| `url` | Absolute posting URL |

`detail` adds `description`, `requirements`, `benefits`, `employmentType`,
`headcount`, `experience`, `level`, `education`.

Errors go to **stderr** as `{"error": "...", "code": "..."}` with exit code 1.

## Notes / portal quirks

- **`detail` needs a slug segment.** `/viec-lam/<id>` renders the listing shell
  with no job content; `/viec-lam/<id>/<anything>` renders the posting. The CLI
  appends a placeholder slug when given a bare ID, so both forms work.
- **Two `salary-amount` blocks exist per detail page.** The first is the referral
  bonus (`Tiền thưởng`), usually login-gated and rendering as
  "Đăng nhập để xem"; the real pay band is the second, under `Mức lương`. The
  parser anchors on the heading — do not take the first match.
- **Detail pages have no location field.** The city appears only on the listing
  card, so `detail` returns `location: null` by design rather than guessing.
- **The page contains an empty `<h1>` before the real title.** Take the first
  `<h1>` with non-empty text.
- **Not all listings are Vietnamese.** The board carries Korean-market postings
  (Seoul, salaries shown as `1-2 triệu` because the band is not in VND). Filter on
  location.
- **No posting-age filter** is available, and no posting date is exposed, so
  `--jobage` is deliberately not implemented rather than faked.
