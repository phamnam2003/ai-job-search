---
name: lever-search
version: 1.0.0
description: >
  Use this skill to search job openings hosted on Lever company boards — the ATS
  behind the careers pages of gaming, crypto/fintech, and Southeast Asian tech
  companies (Amanotes, Ninja Van, Binance, Coins.ph, Nium, Sysdig, Spotify,
  Palantir, and more). Includes the strongest Vietnam-based coverage of the three
  ATS skills. Trigger phrases: lever jobs, lever board, search lever, jobs at
  <company>, crypto jobs, fintech jobs, APAC tech jobs, việc làm, tuyển dụng,
  tìm việc, việc làm IT Hà Nội, việc làm backend, tuyển dụng lập trình viên.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/lever-search/cli/src/cli.ts *)
---

# Lever Search Skill

Search live job listings from **Lever's public v0 postings API**. No authentication,
no API key, and **zero runtime dependencies** — it runs with just `bun`.

## How this differs from a normal job board

Lever is an **applicant tracking system, not a job board**. There is no global search
endpoint — each employer publishes its own board under a token
(`api.lever.co/v0/postings/<token>`). So this skill keeps a curated fan-out list in
[`companies.json`](companies.json) and searches every board on it, filtering client-side.

**This means coverage is exactly what is in `companies.json` — nothing more.** Edit that
file to change what gets searched; the header comment explains how to find and verify a
new board token.

## Access terms

Lever's v0 postings API is **public and undocumented-but-stable** — it is what
`jobs.lever.co` itself renders from. `jobs.lever.co/robots.txt` sets
`Content-Signal: search=yes, ai-train=no, use=reference`: indexing and reference use are
permitted, model training is not. This skill only reads and displays postings, so it
stays inside those signals. Keep request volume sane; each search costs one request
per board.

## When to use this skill

- Search Vietnam- and APAC-based roles (this is the best of the three ATS skills for that)
- Search crypto/fintech and gaming companies
- Search one specific company's board (`--company <token>`)
- Narrow the fan-out by theme (`--tag vietnam`, `--tag apac`, `--tag fintech`)
- Get the full description of a specific posting

## Commands

### Search job listings

```bash
bun run .agents/skills/lever-search/cli/src/cli.ts search [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keywords. **All terms must match** (AND); wrap a phrase in quotes: `-q '"site reliability"'`.
- `--company <tokens>` / `-c <tokens>` — comma-separated board tokens to search **instead of** `companies.json`.
- `--tag <tag>` / `-t <tag>` — only search `companies.json` entries carrying this tag (`vietnam`, `apac`, `asia-hours`, `fintech`, `crypto`, `go`, `remote-first`, `eu-hours`, `us-hours`, `kubernetes`, `devtools`).
- `--location <text>` / `-l <text>` — client-side substring filter on the job's location, e.g. `-l vietnam`.
- `--match full|title` — **`full` is the default here.** Lever returns full descriptions inside the list response, so full-text search costs no extra requests. Use `title` to match titles only when a common word is returning too much noise.
- `--jobage <days>` — only postings created within N days. Omit for all.
- `--page <n>` — 1-indexed page over the aggregated result set (25 per page).
- `--limit <n>` / `-n <n>` — cap results emitted (client-side).
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/lever-search/cli/src/cli.ts detail <board-token>/<uuid> [--format json|plain]
```

Posting ids are UUIDs but the detail endpoint still needs the board, so ids are
namespaced: `amanotes/9c9416dd-bff1-4cf8-a4a7-b11150e37526`. Search results already
return ids in this form. A full `jobs.lever.co/<token>/<uuid>` URL also works. A bare
UUID needs `--company <token>`.

### List the configured boards

```bash
bun run .agents/skills/lever-search/cli/src/cli.ts companies
```

## Usage examples

```bash
# Everything currently open in Vietnam
bun run .agents/skills/lever-search/cli/src/cli.ts search -l vietnam --format table

# Backend roles across APAC-hours companies
bun run .agents/skills/lever-search/cli/src/cli.ts search -q "backend engineer" --tag apac --format table

# Go roles, posted in the last 30 days
bun run .agents/skills/lever-search/cli/src/cli.ts search -q golang --jobage 30 --format table

# Kafka roles at two specific companies
bun run .agents/skills/lever-search/cli/src/cli.ts search -q kafka -c binance,sysdig

# Titles only, to cut description noise on a common word
bun run .agents/skills/lever-search/cli/src/cli.ts search -q engineer --match title --format table

# Full detail for one posting
bun run .agents/skills/lever-search/cli/src/cli.ts detail amanotes/9c9416dd-bff1-4cf8-a4a7-b11150e37526 --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, passing ids to `detail` |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single job's full detail (`detail` command) |

All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the process exits with code `1`.

## Notes

- **Coverage equals `companies.json`.** A company missing from that file is invisible to this skill.
- **`--match full` is the default** because Lever ships descriptions in the list response — unlike the Greenhouse skill, it costs nothing. The trade-off is noise: a common word like `engineer` will match job bodies, not just titles. Use `--match title` to tighten.
- An unknown board token returns **HTTP 200** with `{"ok":false,"error":"Document not found"}` rather than a 404. The CLI detects the non-array shape and reports it in `meta.errors` instead of crashing.
- `leverdemo` is Lever's own demo board (hundreds of fake postings) and is deliberately excluded from `companies.json`.
- Dates come from `createdAt` (epoch milliseconds) and are normalized to ISO 8601. Results are sorted newest-first.
- Lever splits a description across `openingPlain`, `descriptionPlain`, `lists[]`, and `additionalPlain`, and different boards leave different fields empty. `detail` composes whatever is present in reading order.
- **Vietnam caveat:** Amanotes is Ho Chi Minh City-based, and most VN roles surfaced here are HCMC, not Ha Noi. Check the location before assuming it fits a Ha Noi-onsite constraint.
