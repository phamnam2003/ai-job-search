# itviec-cli

CLI for searching IT jobs on **ITviec** (itviec.com), Vietnam's leading IT job board.

**Data source**: ITviec public, server-rendered pages (`/it-jobs/<keyword>[/<city>]` and the `/it-jobs/<slug>/content` job partial).
**Authentication**: None required.
**Dependencies**: None (plain `bun` + `fetch`). `bun install` is optional and only pulls dev type defs.

> **Personal use only.** ITviec's robots.txt allows crawling (only `/subscriptions/new` is
> disallowed), so this is not against their rules — but keep request volume low and polite.

## Installation

```bash
cd .agents/skills/itviec-search/cli
bun install   # optional — only installs TypeScript dev types
```

The CLI runs without any install because it has zero runtime dependencies.

## Commands

| Command | Description |
|---------|-------------|
| `search` | Search for IT job listings |
| `detail` | Fetch full detail for one job (needs the slug/url, not a bare id) |

`search` accepts `--format json|table|plain` (default `json`); `detail` accepts `--format json|plain`.
All errors are written to **stderr** as `{ "error": "...", "code": "..." }` with exit code `1`.

## Quick examples

```bash
# Golang roles in Ha Noi
bun run src/cli.ts search -q "golang" -l "ha-noi" --format table

# Backend developer roles in Ha Noi, capped to 10
bun run src/cli.ts search -q "backend developer" -l "ha-noi" --limit 10 --format table

# ReactJS roles in Ha Noi
bun run src/cli.ts search -q "reactjs" -l "ha-noi" --format table

# Full detail for one job (pass the slug or the url from a search result)
bun run src/cli.ts detail backend-developer-golang-dnse-4853 --format plain
```

See `../SKILL.md` for the full flag reference and notes.

## Search flags

| Flag | Alias | Description |
|------|-------|-------------|
| `--query` | `-q` | Keywords (title / skill / role). Hyphenated into the URL path. |
| `--location` | `-l` | City slug path segment: `ha-noi`, `ho-chi-minh`, `da-nang`. |
| `--jobage` | | Best-effort only — ITviec has no reliable posting-age filter, so the flag is accepted but **not applied**. |
| `--page` | | 1-indexed page. |
| `--limit` | `-n` | Cap results emitted (client-side). |
| `--format` | | `json` \| `table` \| `plain`. |

## Notes

- **Salary** is frequently gated behind sign-in on ITviec; when so, `salary` is `null`.
- **`detail`** needs the full slug (e.g. `backend-developer-golang-dnse-4853`) or the job URL —
  a bare numeric id cannot be resolved to a job page. Copy the `url` field from `search` results.
