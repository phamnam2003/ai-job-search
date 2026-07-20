---
name: ashby-search
version: 1.0.0
description: >
  Use this skill to search job openings hosted on Ashby company boards — the ATS
  behind the careers pages of infrastructure, developer-tools, and database
  companies (Temporal, Kong, Coder, Redis, Supabase, Railway, Render, Percona,
  Sentry, PostHog, 1Password, Airwallex, Sky Mavis, and more). This is the best
  of the three ATS skills for Go, Kubernetes, distributed-systems, and
  observability roles. Trigger phrases: ashby jobs, ashby board, search ashby,
  jobs at <company>, infrastructure jobs, devtools jobs, remote Go jobs,
  việc làm remote, tuyển dụng backend, việc làm Golang, tìm việc DevOps.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/ashby-search/cli/src/cli.ts *)
---

# Ashby Search Skill

Search live job listings from **Ashby's public Posting API**. No authentication,
no API key, and **zero runtime dependencies** — it runs with just `bun`.

## How this differs from a normal job board

Ashby is an **applicant tracking system, not a job board**. There is no global search
endpoint — each employer publishes its own board under a name
(`api.ashbyhq.com/posting-api/job-board/<name>`). So this skill keeps a curated fan-out
list in [`companies.json`](companies.json) and searches every board on it, filtering
client-side.

**This means coverage is exactly what is in `companies.json` — nothing more.** Edit that
file to change what gets searched; the header comment explains how to find and verify a
new board name.

## Access terms

The Posting API is **public and documented by Ashby** — it exists so employers can embed
their board in their own careers site. Note that `jobs.ashbyhq.com/robots.txt` disallows
`/api/` on *that* host; this skill uses the separate documented API host
(`api.ashbyhq.com/posting-api/`), which is not covered by that rule. No authentication
and no login wall. Keep request volume sane; each search costs one request per board.

## When to use this skill

- Search Go / Kubernetes / distributed-systems / database / observability roles — this is the densest of the three ATS skills for infra work
- Search remote-first companies (`--remote`, `--tag remote-first`)
- Search one specific company's board (`--company <board>`)
- Get the full description of a specific posting

## Commands

### Search job listings

```bash
bun run .agents/skills/ashby-search/cli/src/cli.ts search [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keywords. **All terms must match** (AND); wrap a phrase in quotes: `-q '"site reliability"'`.
- `--company <boards>` / `-c <boards>` — comma-separated board names to search **instead of** `companies.json`.
- `--tag <tag>` / `-t <tag>` — only search `companies.json` entries carrying this tag (`go`, `remote-first`, `database`, `kubernetes`, `distributed-systems`, `observability`, `devtools`, `infra`, `fintech`, `vietnam`, `apac`, `eu-hours`, `us-hours`).
- `--location <text>` / `-l <text>` — client-side substring filter, searching **both** the primary location and `secondaryLocations`.
- `--remote` — only postings the employer flagged `isRemote`.
- `--match full|title` — **`full` is the default here.** Ashby returns full descriptions inside the list response, so full-text search costs no extra requests. Use `title` to cut noise on a common word.
- `--jobage <days>` — only postings published within N days. Omit for all.
- `--page <n>` — 1-indexed page over the aggregated result set (25 per page).
- `--limit <n>` / `-n <n>` — cap results emitted (client-side).
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/ashby-search/cli/src/cli.ts detail <board>/<uuid> [--format json|plain]
```

Ashby's posting API has **no by-id endpoint** — the board is the only entry point — so ids
are namespaced `skymavis/a4dc737a-1893-4981-844c-2153ad06be75` and `detail` fetches the
board and picks the job out. Search results already return ids in this form. A full
`jobs.ashbyhq.com/<board>/<uuid>` URL also works. A bare UUID needs `--company <board>`.

### List the configured boards

```bash
bun run .agents/skills/ashby-search/cli/src/cli.ts companies
```

## Usage examples

```bash
# Go backend roles at infra companies
bun run .agents/skills/ashby-search/cli/src/cli.ts search -q "backend engineer" --tag go --format table

# Remote-flagged Go roles from the last 30 days
bun run .agents/skills/ashby-search/cli/src/cli.ts search -q golang --remote --jobage 30 --format table

# Kubernetes roles at three specific companies
bun run .agents/skills/ashby-search/cli/src/cli.ts search -q kubernetes -c coder,kong,temporal --format table

# Anything open in Vietnam (including roles that list it as a secondary location)
bun run .agents/skills/ashby-search/cli/src/cli.ts search -l vietnam --format table

# Distributed-systems roles, titles only to cut noise
bun run .agents/skills/ashby-search/cli/src/cli.ts search -q engineer --tag distributed-systems --match title --format table

# Full detail for one posting
bun run .agents/skills/ashby-search/cli/src/cli.ts detail skymavis/a4dc737a-1893-4981-844c-2153ad06be75 --format plain
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
- **`--match full` is the default** because Ashby ships descriptions in the list response — it costs nothing. The trade-off is noise on common words; use `--match title` to tighten.
- **`--location` searches `secondaryLocations` too.** An Ashby posting can be open in a dozen countries with only one listed as primary, so filtering on the primary field alone silently drops matches.
- Postings with `isListed: false` are unlisted on the employer's own board and are skipped.
- A board that 404s is reported in `meta.errors` and skipped; it never fails the whole search.
- Dates come from `publishedAt` (already ISO 8601). Results are sorted newest-first.
- **Vietnam caveat:** Sky Mavis is the only Vietnam-based employer on this list, and its Vietnam-located openings are mostly non-engineering. Airwallex covers APAC (Singapore/HK) but not Vietnam directly.
