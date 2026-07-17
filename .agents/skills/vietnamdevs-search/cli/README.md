# vietnamdevs-cli

CLI for searching IT jobs on **VietnamDevs** (vietnamdevs.com), a curated,
English-friendly IT job board for Vietnam with many **remote / offshore-friendly** roles.

**Data source**: VietnamDevs public, server-rendered pages (`/jobs/<keyword>[/<city>]` and
the `/jobs/<id>/<slug>` detail page with a `JobPosting` ld+json block).
**Authentication**: None required.
**Dependencies**: None (plain `bun` + `fetch`). `bun install` is optional and only pulls dev type defs.

> **Personal use only.** VietnamDevs' robots.txt allows `/jobs` (only `/google/login`,
> `/google/callback`, `/newsletter/` are disallowed), so this is not against their rules —
> but keep request volume low and polite.

## Installation

```bash
cd .agents/skills/vietnamdevs-search/cli
bun install   # optional — only installs TypeScript dev types
```

The CLI runs without any install because it has zero runtime dependencies.

## Commands

| Command | Description |
|---------|-------------|
| `search` | Search for IT job listings |
| `detail` | Fetch full detail for one job (bare id, `<id>/<slug>`, or full URL) |

`search` accepts `--format json|table|plain` (default `json`); `detail` accepts `--format json|plain`.
All errors are written to **stderr** as `{ "error": "...", "code": "..." }` with exit code `1`.

## Quick examples

```bash
# Golang roles
bun run src/cli.ts search -q "golang" --format table

# Backend roles in Ha Noi, capped to 10
bun run src/cli.ts search -q "back-end" -l "ha-noi" --limit 10 --format table

# Remote Golang roles (client-side "Remote working" filter)
bun run src/cli.ts search -q "golang" -l "remote" --format table

# Full detail for one job (bare id from a search result)
bun run src/cli.ts detail 928767371223434 --format plain
```

See `../SKILL.md` for the full flag reference and `../url-reference.md` for the markup map.

## Search flags

| Flag | Alias | Description |
|------|-------|-------------|
| `--query` | `-q` | Category keyword → URL path segment. Must be a VietnamDevs taxonomy slug (`golang`, `java`, `python`, `php`, `nodejs`, `reactjs`, `vuejs`, `back-end`, `front-end`, `full-stack`, `sre-devops`, `mobile-engineer`, `data-engineer`, `machine-learning`, `qa-qc`, `project-manager`). Off-taxonomy keywords return no results. |
| `--location` | `-l` | City slug: `ha-noi`, `ho-chi-minh`, `da-nang`. Special value `remote` filters cards tagged "Remote working" (no remote URL path exists). |
| `--jobage` | | Best-effort: filters on the card's relative age label (`3d`, `1w`, `2mos`). Unparseable ages are kept. |
| `--page` | | 1-indexed page. |
| `--limit` | `-n` | Cap results emitted (client-side). |
| `--format` | | `json` \| `table` \| `plain`. |

## Tests

```bash
bun run typecheck   # tsc --noEmit
bun run test        # offline parsing fixtures + live smoke tests
```

## Notes

- **Fixed keyword taxonomy** — VietnamDevs search is category-path based, not free-text. Off-taxonomy slugs 404 (empty results).
- **`detail` accepts a bare numeric id** — `/jobs/<id>/<anything>` redirects to the canonical page, so the slug is not required.
- **Remote is a card label, not the location text** — a card may show a city yet be remote; `workingModel` is exposed on every result and `-l remote` filters on it.
- **Salary** is only on some cards (a green chip); when absent, `salary` is `null`.
