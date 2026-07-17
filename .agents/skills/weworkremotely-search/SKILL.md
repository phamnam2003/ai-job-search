---
name: weworkremotely-search
version: 1.0.0
description: >
  Use this skill to search remote and offshore software jobs on We Work Remotely
  (weworkremotely.com), one of the largest remote-only job boards, or to look up a
  specific We Work Remotely posting. Covers backend, frontend, fullstack, DevOps,
  Go/Golang and other developer roles that are worldwide-remote — a good fit for
  offshore / work-from-Vietnam searches. Trigger phrases (English): remote jobs,
  work from home developer, remote backend jobs, remote fullstack jobs, remote
  frontend jobs, remote golang jobs, remote developer jobs, offshore developer
  jobs, We Work Remotely jobs, WWR jobs. Trigger phrases (Vietnamese): việc làm
  remote, việc làm offshore, tìm việc remote, lập trình viên remote.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/weworkremotely-search/cli/src/cli.ts *)
---

# We Work Remotely Search Skill

Search live remote job listings from **We Work Remotely** (weworkremotely.com), one of
the largest remote-only job boards, through its public **RSS category feeds**. No
authentication, no API key, and **zero runtime dependencies** — it runs with just `bun`.

> This is a remote/offshore portal skill in the repo's job-portal-skill pattern. We Work
> Remotely is remote-only, so every result is a role you could work from Vietnam. It
> publishes one RSS feed per category; this skill fetches the programming feeds (back-end,
> full-stack, front-end) by default, merges them, and de-duplicates by job. Most postings
> are "Anywhere in the World"; the few that are geo-scoped can be narrowed with `--location`.

## ⚠️ Personal use only

This reads We Work Remotely's public RSS feeds. **Keep volume low, don't use it commercially
or for bulk data collection.** Each feed serves the latest ~10–40 active postings for its
category — this is for your own personal job search only, run on your own responsibility.

## When to use this skill

- Search remote / offshore developer openings (backend, fullstack, frontend, DevOps, Go, etc.)
- Filter by keyword with `-q` (client-side, over title + company + skills + description)
- Narrow by posting age with `--jobage <days>`, or by region with `--location`
- Get the full description of a specific We Work Remotely posting

## Commands

### Search job listings

```bash
bun run .agents/skills/weworkremotely-search/cli/src/cli.ts search [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search, client-side & case-insensitive over
  title + company + skills + category + description. **All whitespace-separated words must
  match.** e.g. `"backend"`, `"golang"`, `"react node"`.
- `--location <text>` / `-l <text>` — filter by region, client-side & accent-insensitive.
  Most WWR jobs are `"Anywhere in the World"`; some list a country or US state (e.g. `"India"`).
- `--jobage <days>` — **supported**: keep postings whose `<pubDate>` is within N days. e.g. `7`, `14`, `30`.
- `--category <c>` — comma-separated feeds to fetch: `backend`, `fullstack`, `frontend`,
  `devops`, `all`. Default: `backend,fullstack,frontend`. Aliases: `be`/`fe`/`fs`, `sysadmin`.
- `--page <n>` — 1-indexed page over the merged list (**10 results/page**). Default 1.
- `--limit <n>` / `-n <n>` — cap results emitted (client-side).
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/weworkremotely-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

`id` is the job **slug** from `search` results (e.g. `proxify-ab-senior-java-backend-developer`).
You may also pass a full `weworkremotely.com/remote-jobs/<slug>` URL — the trailing slug is
extracted automatically. Returns the full description, company, location, posted date, type and
skills. (We Work Remotely fronts individual job pages with Cloudflare and blocks automated
fetches, so `detail` reads the full description from the RSS feeds — see Notes.)

## Usage examples

```bash
# Backend roles, quick scan
bun run .agents/skills/weworkremotely-search/cli/src/cli.ts search -q "backend" --limit 5 --format table

# Go/Golang roles across all programming feeds, readable listing
bun run .agents/skills/weworkremotely-search/cli/src/cli.ts search -q "golang" --format plain

# React / fullstack roles, only the frontend + fullstack feeds
bun run .agents/skills/weworkremotely-search/cli/src/cli.ts search -q "react" --category frontend,fullstack --format table

# Anything posted in the last 14 days
bun run .agents/skills/weworkremotely-search/cli/src/cli.ts search --jobage 14 --format table

# Include the DevOps/sysadmin feed as well
bun run .agents/skills/weworkremotely-search/cli/src/cli.ts search -q "kubernetes" --category all --format table

# Full details for a specific job (slug or full URL)
bun run .agents/skills/weworkremotely-search/cli/src/cli.ts detail proxify-ab-senior-java-backend-developer --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, passing IDs to `detail`. Shape: `{ meta: { count, page }, results: [...] }` |
| `table` | Quick human-readable scanning (ID · title · company · location · type) |
| `plain` | Reading listings or a single job's full detail (`detail` command) |

Each JSON result has `id` (slug), `title`, `company`, `location`, `date`, `url`, plus the extras
`type` (Full-Time/Contract/…), `category`, `skills` and `logo`. Missing values are `null`, never omitted.

All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the process exits with code `1`.

## Notes

- **Data source:** We Work Remotely's public **RSS category feeds** (e.g.
  `.../categories/remote-back-end-programming-jobs.rss`) — no credentials required. See
  `url-reference.md` for feed URLs, item structure and the field map.
- **Category selection & merge.** By default the three programming feeds (back-end, full-stack,
  front-end) are fetched, merged, sorted newest-first by `<pubDate>`, and **de-duplicated by job
  slug** (a job listed in two feeds appears once). Use `--category` to pick feeds or add `devops`.
- **`--query` is client-side.** RSS feeds have no server-side search, so `-q` filters the merged
  items in memory — case-insensitive, over title + company + skills + category + description, with
  every whitespace-separated word required to match.
- **`--jobage` is supported** and filters on each item's `<pubDate>` (RFC-822). Items are always
  dated, so age filtering is reliable.
- **`--location` is client-side & accent-insensitive.** Note most postings are
  `"Anywhere in the World"`, so region filtering mainly helps for the minority of geo-scoped jobs.
- **Remote-only.** Every listing is a worldwide-remote role — there is no on-site option to filter.
- **`detail` uses the RSS description.** Individual job pages are Cloudflare-protected and return
  403 to automated fetches; the CLI attempts the page, then falls back to the feed's full
  `<description>` (which is the complete job body). If a slug isn't found in the default feeds, try
  `--category all` (it may be in DevOps or have expired).
- WWR may rate-limit; the CLI retries 429/5xx with exponential backoff + jitter. Keep volume low.
