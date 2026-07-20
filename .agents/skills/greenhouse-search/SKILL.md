---
name: greenhouse-search
version: 1.0.0
description: >
  Use this skill to search job openings hosted on Greenhouse company boards —
  the ATS behind the careers pages of many global tech, infrastructure, and
  fintech companies (GitLab, Cloudflare, Stripe, Grafana, Canonical, Tailscale,
  Temporal, MongoDB, and more). Best for remote-friendly and globally
  distributed engineering roles, especially Go/backend, distributed systems,
  Kubernetes, observability, database, and fintech positions. Trigger phrases:
  greenhouse jobs, greenhouse board, search greenhouse, remote backend jobs,
  jobs at <company>, tech company careers, việc làm remote, tuyển dụng backend,
  tìm việc công ty nước ngoài, việc làm Golang remote.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/greenhouse-search/cli/src/cli.ts *)
---

# Greenhouse Search Skill

Search live job listings from **Greenhouse's public Job Board API**. No authentication,
no API key, and **zero runtime dependencies** — it runs with just `bun`.

## How this differs from a normal job board

Greenhouse is an **applicant tracking system, not a job board**. There is no global
search endpoint — each employer publishes its own board under a token
(`boards-api.greenhouse.io/v1/boards/<token>/jobs`). So this skill keeps a curated
fan-out list in [`companies.json`](companies.json) and searches every board on it,
filtering client-side.

**This means coverage is exactly what is in `companies.json` — nothing more.** Edit that
file to change what gets searched; the header comment explains how to find and verify a
new board token.

## Access terms

Greenhouse's Job Board API is a **public, documented API** intended for exactly this use
(companies embed it in their own careers pages). `boards.greenhouse.io/robots.txt`
disallows only `/embed/`, which this skill does not touch. No personal-use warning is
needed — but keep request volume sane, since each search costs one request per board.

## When to use this skill

- Search engineering roles across a curated set of remote-friendly / infra / fintech companies
- Search one specific company's board (`--company <token>`)
- Narrow the fan-out by theme (`--tag go`, `--tag remote-first`, `--tag fintech`)
- Get the full description of a specific posting

## Commands

### Search job listings

```bash
bun run .agents/skills/greenhouse-search/cli/src/cli.ts search [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keywords. **All terms must match** (AND); wrap a phrase in quotes: `-q '"site reliability"'`.
- `--company <tokens>` / `-c <tokens>` — comma-separated board tokens to search **instead of** `companies.json`.
- `--tag <tag>` / `-t <tag>` — only search `companies.json` entries carrying this tag (`go`, `remote-first`, `fintech`, `database`, `kubernetes`, `observability`, `devtools`, `eu-hours`, `apac`).
- `--location <text>` / `-l <text>` — client-side substring filter on the job's location. The API has **no** location parameter, so this filters what was already fetched.
- `--match title|full` — `title` (default) matches title + location only. `full` also searches the description: far more accurate, but much slower and heavier (Stripe's board alone is ~4 MB with descriptions).
- `--jobage <days>` — only postings first published within N days. Omit for all.
- `--page <n>` — 1-indexed page over the aggregated result set (25 per page).
- `--limit <n>` / `-n <n>` — cap results emitted (client-side).
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/greenhouse-search/cli/src/cli.ts detail <board-token>/<job-id> [--format json|plain]
```

Greenhouse job ids are only unique **per board**, so ids are namespaced: `tailscale/4707636005`.
Search results already return ids in this form. A full `greenhouse.io/<token>/jobs/<id>` URL
also works. A bare `?gh_jid=` number needs `--company <token>` to say which board it is on.

### List the configured boards

```bash
bun run .agents/skills/greenhouse-search/cli/src/cli.ts companies
```

## Usage examples

```bash
# Backend roles at Go-heavy companies
bun run .agents/skills/greenhouse-search/cli/src/cli.ts search -q "backend engineer" --tag go --format table

# Anything mentioning Golang in the description, posted in the last 30 days
bun run .agents/skills/greenhouse-search/cli/src/cli.ts search -q golang --match full --jobage 30 --format table

# Remote-only engineering roles
bun run .agents/skills/greenhouse-search/cli/src/cli.ts search -q engineer -l remote --limit 20 --format table

# Kafka roles at three specific companies
bun run .agents/skills/greenhouse-search/cli/src/cli.ts search -q kafka -c cloudflare,datadog,temporaltechnologies --match full

# Fintech backend roles
bun run .agents/skills/greenhouse-search/cli/src/cli.ts search -q backend --tag fintech --format table

# Full detail for one posting
bun run .agents/skills/greenhouse-search/cli/src/cli.ts detail tailscale/4707636005 --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, passing ids to `detail` |
| `table` | Quick human-readable scanning |
| `plain` | Reading a single job's full detail (`detail` command) |

All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the process exits with code `1`.

## Notes

- **Coverage equals `companies.json`.** A company missing from that file is invisible to this skill, no matter how well the query matches.
- **Cost scales with the fan-out.** One search = one HTTP request per board. Use `--tag` or `--company` to keep it small; `--match full` multiplies the payload size, not the request count.
- **`--match title` is the default on purpose.** Full-description search is accurate but downloads every description on every board — slow enough to notice.
- A board that 404s or errors is reported in `meta.errors` and skipped; it never fails the whole search.
- Dates are `first_published` (falling back to `updated_at`), returned as ISO 8601. Results are sorted newest-first.
- Most companies here are US- or EU-headquartered. Many roles are genuinely remote but assume **US or EU working hours** — check the posting before assuming Asia-hours overlap works.
