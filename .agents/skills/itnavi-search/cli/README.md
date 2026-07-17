# itnavi-cli

CLI for searching IT jobs on **ITNavi** (itnavi.com.vn), a Vietnamese IT job board
with good Go/backend coverage.

**Data source**: ITNavi public pages — server-rendered search (`/job/<keyword>[/<city>]`),
the standalone job page (`/job-detail/<slug>`), and the public `get-job-by-id` JSON endpoint.
**Authentication**: None required.
**Dependencies**: None (plain `bun` + `fetch`). `bun install` is optional and only pulls dev type defs.

> **Personal use only.** ITNavi's robots.txt disallows only `/admin` and `/blog/search`, so
> the pages used here are permitted — but keep request volume low and polite.

## Installation

```bash
cd .agents/skills/itnavi-search/cli
bun install   # optional — only installs TypeScript dev types
```

The CLI runs without any install because it has zero runtime dependencies.

## Commands

| Command | Description |
|---------|-------------|
| `search` | Search for IT job listings |
| `detail` | Fetch full detail for one job (by numeric id, slug, or url) |

`search` accepts `--format json|table|plain` (default `json`); `detail` accepts `--format json|plain`.
All errors are written to **stderr** as `{ "error": "...", "code": "..." }` with exit code `1`.

## Quick examples

```bash
# Golang roles (quick scan)
bun run src/cli.ts search -q "golang" --limit 5 --format table

# Backend roles in Ha Noi, capped to 10
bun run src/cli.ts search -q "backend" -l "ha-noi" --limit 10 --format table

# Fewer requests — skip the per-result URL lookup
bun run src/cli.ts search -q "golang" --limit 5 --no-enrich --format json

# Full detail for one job — by id (clean JSON endpoint) …
bun run src/cli.ts detail 24005 --format plain
# … or by slug / url from a search result
bun run src/cli.ts detail golang-backend-developer-bnpl-project --format plain
```

See `../SKILL.md` for the full flag reference and `../url-reference.md` for the URL
scheme and selectors.

## Search flags

| Flag | Alias | Description |
|------|-------|-------------|
| `--query` | `-q` | Keywords (title / skill / role). Hyphenated into the URL path. |
| `--location` | `-l` | City slug path segment: `ha-noi`, `ho-chi-minh`, `da-nang`, `khac`. |
| `--jobage` | | Best-effort client-side filter on the card's relative posted-age label ("5 d"). Unparseable ages are kept. |
| `--page` | | 1-indexed page. |
| `--limit` | `-n` | Cap results emitted (client-side). |
| `--no-enrich` | | Skip the per-result `get-job-by-id` lookup that fills `url`/`slug`/`salary`/`posted`. |
| `--format` | | `json` \| `table` \| `plain`. |

## Notes

- **Each search card carries only a numeric `data-id`, no detail link.** The authoritative
  detail `url` is fetched per emitted result from `get-job-by-id` (enrichment). It cannot be
  derived from the title — ITNavi appends a random suffix to some slugs. Use `--no-enrich` to
  stay at one request (then `url`/`slug`/`salary`/`posted` are `null`; `detail <id>` still works).
- **`detail`** accepts a numeric id (JSON endpoint), or a slug / full `/job-detail/<slug>` URL
  (scraped from the job page).
- **Salary** is frequently `Thương lượng` (negotiable) or login-gated (`null`).

## Tests

```bash
bun run test        # offline parsing fixtures + live smoke tests (hits ITNavi)
bun run typecheck   # tsc --noEmit
```
