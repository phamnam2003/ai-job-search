# topdev-cli

CLI for searching IT/software jobs on **TopDev** (topdev.vn), Vietnam's largest IT job board,
via its public JSON API.

**Data source**: TopDev JSON:API (`https://api.topdev.vn/td/v2/jobs`).
**Authentication**: None required.
**Dependencies**: None (plain `bun` + `fetch`). `bun install` is optional and only pulls dev type defs.

> **Personal use only.** This uses TopDev's public job data. Keep volume low, don't use it
> commercially or for bulk data collection, and run it on your own responsibility.

## Installation

```bash
cd .agents/skills/topdev-search/cli
bun install   # optional — only installs TypeScript dev types
```

The CLI runs without any install because it has zero runtime dependencies.

## Commands

| Command | Description |
|---------|-------------|
| `search` | Search for IT job listings (all flags optional) |
| `detail` | Fetch full detail for a single job listing |

`search` accepts `--format json|table|plain` (default `json`); `detail` accepts `--format json|plain`.
All errors are written to **stderr** as `{ "error": "...", "code": "..." }` with exit code `1`.

## Quick examples

```bash
# Golang roles, quick scan
bun run src/cli.ts search -q "golang" --limit 5 --format table

# Backend roles filtered to Ha Noi (accent-insensitive)
bun run src/cli.ts search -q "backend developer" -l "Ha Noi" --format table

# Fullstack / React roles, readable listing
bun run src/cli.ts search -q "fullstack react" --format plain

# Full detail for one job (accepts an id, a slug, or a full detail-jobs URL)
bun run src/cli.ts detail 2118052 --format plain
```

See `../SKILL.md` for the full flag reference and the personal-use note, and `../url-reference.md`
for the API endpoints and field paths.

## Search flags

| Flag | Alias | Description |
|------|-------|-------------|
| `--query` | `-q` | Keywords (title / skill / role). Recommended. |
| `--location` | `-l` | Filter by location, client-side & accent-insensitive (e.g. `"Ha Noi"`, `"Hà Nội"`). |
| `--jobage` | | Accepted but **unsupported** by the API (no-op). |
| `--page` | | 1-indexed page (10 results/page — fixed). |
| `--limit` | `-n` | Cap results emitted. |
| `--format` | | `json` \| `table` \| `plain`. |

## Development

```bash
bun run typecheck   # tsc --noEmit
bun run test        # bun test --timeout 30000 (offline parser tests + live smoke tests)
```

The test suite mixes offline unit tests (entity decoding, salary formatting, id extraction,
diacritics folding, field mapping) with a couple of live smoke tests that hit the public API.
