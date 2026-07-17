# remoteok-cli

CLI for searching remote / offshore developer jobs on **RemoteOK** (remoteok.com), a
global remote-only job board, via its public JSON API.

**Data source**: RemoteOK JSON API (`https://remoteok.com/api`).
**Authentication**: None required (a browser `User-Agent` is required — empty UAs are blocked).
**Dependencies**: None (plain `bun` + `fetch`). `bun install` is optional and only pulls dev type defs.

> **Personal use only.** This uses RemoteOK's public job feed. Keep volume low, don't use it
> commercially or for bulk data collection, credit RemoteOK as a source per their API terms, and
> run it on your own responsibility.

## Installation

```bash
cd .agents/skills/remoteok-search/cli
bun install   # optional — only installs TypeScript dev types
```

The CLI runs without any install because it has zero runtime dependencies.

## Commands

| Command | Description |
|---------|-------------|
| `search` | Search for remote job listings (all flags optional) |
| `detail` | Fetch full detail for a single job listing (looked up in the current feed) |

`search` accepts `--format json|table|plain` (default `json`); `detail` accepts `--format json|plain`.
All errors are written to **stderr** as `{ "error": "...", "code": "..." }` with exit code `1`.

## Quick examples

```bash
# Engineer roles (title match), quick scan
bun run src/cli.ts search -q "engineer" --limit 5 --format table

# Backend roles posted in the last week
bun run src/cli.ts search -q "backend" --jobage 7 --format table

# Explicit Go tag filter (opt-in, broad/noisy)
bun run src/cli.ts search --tag golang --format table

# Full detail for one job (accepts an id, a slug, or a full remote-jobs URL)
bun run src/cli.ts detail 1134900 --format plain
```

See `../SKILL.md` for the full flag reference and the personal-use note, and `../url-reference.md`
for the API endpoint and field paths.

## Search flags

| Flag | Alias | Description |
|------|-------|-------------|
| `--query` | `-q` | Keywords matched against the **job title only**, client-side (accent-insensitive, all words must match). Tags/company/description excluded — RemoteOK stuffs tags, so a niche term may return 0 hits. |
| `--tag` | | Opt-in RemoteOK tag filter (e.g. `--tag golang`). Broad/noisy; lower precision than `-q`. |
| `--location` | `-l` | Filter by location substring, client-side. Most roles are worldwide-remote (`Remote`). |
| `--jobage` | | Only postings from the last N days (client-side, on `epoch`/`date`). |
| `--page` | | 1-indexed page (20 results/page, client-side). |
| `--limit` | `-n` | Cap results emitted. |
| `--format` | | `json` \| `table` \| `plain`. |

## Development

```bash
bun run typecheck   # tsc --noEmit
bun run test        # bun test --timeout 30000 (offline parser tests + live smoke tests)
```

The test suite mixes offline unit tests (entity decoding, salary formatting, id extraction,
diacritics folding, location cleaning, legal-entry skipping, keyword matching, jobage filtering,
field mapping) with a couple of live smoke tests that hit the public API.
