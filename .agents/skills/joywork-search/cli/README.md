# joywork-cli

CLI for searching jobs on **JoyWork** (joywork.vn), a general Vietnamese job board, via
the public JSON API its own frontend uses.

**Data source**: JoyWork JSON API (`https://api.joywork.vn/api/jobs`).
**Authentication**: None required.
**Dependencies**: None (plain `bun` + `fetch`). `bun install` is optional and only pulls dev type defs.

> **Personal use only.** joywork.vn's terms forbid scraping user data and reverse
> engineering the platform. This reads public job postings only. Keep volume low, don't use
> it commercially or for bulk data collection, and run it on your own responsibility.

## Installation

```bash
cd .agents/skills/joywork-search/cli
bun install   # optional — only installs TypeScript dev types
```

The CLI runs without any install because it has zero runtime dependencies.

## Commands

| Command | Description |
|---------|-------------|
| `search` | Search job listings (all flags optional) |
| `detail` | Fetch full detail for a single job listing |

`search` accepts `--format json|table|plain` (default `json`); `detail` accepts `--format json|plain`.
All errors are written to **stderr** as `{ "error": "...", "code": "..." }` with exit code `1`.

## Quick examples

```bash
# Go roles in Ha Noi, fuzzy-match noise removed
bun run src/cli.ts search -q "golang" -l "Hà Nội" --strict --format table

# Developer roles in Ha Noi from the last 30 days
bun run src/cli.ts search -q "developer" -l ha-noi --strict --jobage 30 --format table

# Newest postings in Ho Chi Minh City this week
bun run src/cli.ts search -l hcm --jobage 7 --format table

# Full detail for one job (accepts an id, a <slug>--<id> segment, or a full URL)
bun run src/cli.ts detail cmvaaz25x08uhp066wlvmmh9d --format plain
```

See `../SKILL.md` for the full flag reference and the personal-use note, and
`../url-reference.md` for the API endpoints, field paths and province codes.

## Search flags

| Flag | Alias | Description |
|------|-------|-------------|
| `--query` | `-q` | Keywords. Fuzzy, similarity-ranked — pair with `--strict`. |
| `--location` | `-l` | Province code or name, accents optional (`ha-noi`, `"Hà Nội"`, `hanoi`, `hcm`). Server-side. |
| `--jobage` | | Posted within N days (client-side, on `createdAt`). |
| `--strict` | | Keep only postings whose text contains every query word. |
| `--include-expired` | | Keep closed / past-deadline postings (dropped by default). |
| `--page` | | 1-indexed page (20 results/page before filtering). |
| `--limit` | `-n` | Cap results emitted. |
| `--format` | | `json` \| `table` \| `plain`. |

## Development

```bash
bun run typecheck   # tsc --noEmit
bun run test        # bun test --timeout 30000 (offline parser tests + live smoke tests)
```

The test suite mixes offline unit tests (HTML flattening, location resolution, salary
formatting, expiry, id extraction, strict matching, description assembly) with a few live
smoke tests that hit the public API.
