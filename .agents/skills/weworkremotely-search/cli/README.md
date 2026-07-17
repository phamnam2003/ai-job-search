# weworkremotely-cli

CLI for searching remote/offshore software jobs on **We Work Remotely** (weworkremotely.com),
a global remote-only job board, via its public RSS category feeds.

**Data source**: We Work Remotely RSS feeds (`https://weworkremotely.com/categories/*.rss`).
**Authentication**: None required (send a browser `User-Agent`).
**Dependencies**: None (plain `bun` + `fetch` + regex). `bun install` is optional and only pulls dev type defs.

> **Personal use only.** This uses We Work Remotely's public RSS feeds. Keep volume low, don't use
> it commercially or for bulk data collection, and run it on your own responsibility.

## Installation

```bash
cd .agents/skills/weworkremotely-search/cli
bun install   # optional — only installs TypeScript dev types
```

The CLI runs without any install because it has zero runtime dependencies.

## Commands

| Command | Description |
|---------|-------------|
| `search` | Search remote job listings across the merged RSS feeds (all flags optional) |
| `detail` | Fetch full detail for a single job listing (by slug or URL) |

`search` accepts `--format json|table|plain` (default `json`); `detail` accepts `--format json|plain`.
All errors are written to **stderr** as `{ "error": "...", "code": "..." }` with exit code `1`.

## Quick examples

```bash
# Backend roles, quick scan
bun run src/cli.ts search -q "backend" --limit 5 --format table

# Go/Golang roles, readable listing
bun run src/cli.ts search -q "golang" --format plain

# React roles, only the frontend + fullstack feeds
bun run src/cli.ts search -q "react" --category frontend,fullstack --format table

# Anything posted in the last 14 days
bun run src/cli.ts search --jobage 14 --format table

# Full detail for one job (accepts a slug or a full remote-jobs URL)
bun run src/cli.ts detail proxify-ab-senior-java-backend-developer --format plain
```

See `../SKILL.md` for the full flag reference and the personal-use note, and `../url-reference.md`
for the feed endpoints and field map.

## Search flags

| Flag | Alias | Description |
|------|-------|-------------|
| `--query` | `-q` | Keywords over title/company/skills/description, client-side (all words must match). |
| `--location` | `-l` | Filter by region, client-side & accent-insensitive (most jobs are "Anywhere in the World"). |
| `--jobage` | | Posted within N days (client-side, on `<pubDate>`). **Supported.** |
| `--category` | | Feeds to fetch: `backend,fullstack,frontend,devops,all`. Default `backend,fullstack,frontend`. |
| `--page` | | 1-indexed page over the merged list (10 results/page). |
| `--limit` | `-n` | Cap results emitted. |
| `--format` | | `json` \| `table` \| `plain`. |

## Development

```bash
bun run typecheck   # tsc --noEmit
bun run test        # bun test --timeout 30000 (offline RSS-fixture parser tests + live smoke tests)
```

The test suite mixes offline unit tests (feed parsing, `Company: Role` title split, entity
decoding, double-escaped `<description>` handling, dedupe, slug extraction, category resolution)
with a few live smoke tests that hit the public RSS feeds.
