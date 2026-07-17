# topcv-cli

CLI for searching jobs on **TopCV** (topcv.vn), Vietnam's largest-volume job board.

**Data source**: TopCV public, server-rendered pages (`/tim-viec-lam-<keyword>[-tai-<city>-kl<id>]` search and the `/viec-lam/<slug>/<id>.html` · `/brand/<company>/tuyen-dung/<slug>-j<id>.html` job pages).
**Authentication**: None required.
**Dependencies**: No npm packages. Fetching uses the **`curl`** binary (ships with Windows 10+, macOS, and virtually every Linux) because TopCV's WAF fingerprints and blocks Bun/undici's native `fetch` — even the homepage returns 403 with a full browser header set, while curl's TLS fingerprint is allowed. If curl is missing the CLI falls back to native `fetch` (which TopCV usually blocks, surfacing a clear 403). `bun install` is optional and only pulls dev type defs.

> **Personal use only.** TopCV's robots.txt allows the search and job-detail paths (only CV/account paths are disallowed), so this is not against their rules — but TopCV is large and may rate-limit, so keep request volume low and polite.

## Installation

```bash
cd .agents/skills/topcv-search/cli
bun install   # optional — only installs TypeScript dev types
```

The CLI runs without any install because it has zero runtime dependencies.

## Commands

| Command | Description |
|---------|-------------|
| `search` | Search for job listings |
| `detail` | Fetch full detail for one job (prefers the full URL; a bare id is reconstructed best-effort) |

`search` accepts `--format json|table|plain` (default `json`); `detail` accepts `--format json|plain`.
All errors are written to **stderr** as `{ "error": "...", "code": "..." }` with exit code `1`.

## Quick examples

```bash
# Backend roles in Ha Noi
bun run src/cli.ts search -q "backend" -l "ha-noi" --format table

# Golang roles in Ha Noi, capped to 10
bun run src/cli.ts search -q "golang" -l "ha-noi" --limit 10 --format table

# Fullstack roles, JSON
bun run src/cli.ts search -q "fullstack" -l "ha-noi" --format json

# Full detail for one job (pass the url from a search result)
bun run src/cli.ts detail https://www.topcv.vn/viec-lam/backend-developer/2231500.html --format plain
```

See `../SKILL.md` for the full flag reference and `../url-reference.md` for the markup selectors.

## Search flags

| Flag | Alias | Description |
|------|-------|-------------|
| `--query` | `-q` | Keywords (title / skill / role). Hyphenated into the URL slug. Defaults to `it`. |
| `--location` | `-l` | City name/slug: `ha-noi`, `ho-chi-minh`, `da-nang`, … Resolved to TopCV's server-side city filter; unknown values fall back to a client-side filter. |
| `--jobage` | | Max posting age in days. Best-effort, applied client-side from each card's freshness text ("Đăng 2 tuần trước"). |
| `--page` | | 1-indexed page. |
| `--limit` | `-n` | Cap results emitted (client-side). |
| `--format` | | `json` \| `table` \| `plain`. |

## Notes

- **Location** filtering only works via the URL slug (`-tai-ha-noi-kl1`); TopCV silently ignores `?city_id=`/`?locations=` query params, so the CLI maps `--location` to the slug form (68 provinces are mapped, plus aliases like `hanoi`, `hcm`, `saigon`, `danang`).
- **`detail`** accepts a full TopCV job URL (either the `/viec-lam/` or `/brand/` shape) or a bare numeric id. A bare id is reconstructed as `/viec-lam/j/<id>.html` (TopCV resolves a job by its trailing id regardless of the slug), but the full URL from a `search` result is the reliable input.
- **Salary** on TopCV is frequently `Thoả thuận` (negotiable); it is captured verbatim.
