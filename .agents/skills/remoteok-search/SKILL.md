---
name: remoteok-search
version: 1.0.0
description: >
  Use this skill to search remote and offshore software jobs on RemoteOK
  (remoteok.com), a global remote-only job board, or to look up a specific
  RemoteOK posting. Covers backend, frontend, fullstack, Go/Golang, engineering
  and other developer roles that are worldwide-remote — a good fit for offshore /
  work-from-Vietnam searches. Trigger phrases (English): remote jobs, remote
  backend, remote golang jobs, remote developer jobs, offshore developer jobs,
  work from home developer, RemoteOK jobs. Trigger phrases (Vietnamese): việc làm
  remote, việc làm offshore, tìm việc remote, lập trình viên remote.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/remoteok-search/cli/src/cli.ts *)
---

# RemoteOK Search Skill

Search live remote job listings from **RemoteOK** (remoteok.com), a global
remote-only job board, through its public JSON API. No authentication, no API
key, and **zero runtime dependencies** — it runs with just `bun`.

> This is the remote/offshore portal skill in the repo's job-portal-skill pattern.
> RemoteOK is remote-only and worldwide, so results are remote roles you could work
> from Vietnam. Most postings have no fixed location; the few that are geo-scoped can
> be narrowed with `--location`.

## ⚠️ Personal use only

This uses RemoteOK's public job feed. **Keep volume low, don't use it commercially
or for bulk data collection.** RemoteOK's API terms ask that you link back to and
credit RemoteOK as a source. The feed serves the latest ~100 postings per request —
this is for your own personal job search only, run on your own responsibility.

## When to use this skill

- Search remote / offshore developer job openings (backend, fullstack, Go, etc.)
- Filter to a keyword with `-q` (client-side, **title only**) or `--tag` (opt-in tag filter)
- Narrow by posting age with `--jobage <days>`
- Get the full description of a specific RemoteOK job posting

## Commands

### Search job listings

```bash
bun run .agents/skills/remoteok-search/cli/src/cli.ts search [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search against the job **title only**,
  **client-side** and case- & accent-insensitive. Every word must match (AND). e.g.
  `"engineer"`, `"backend"`, `"react"`. Tags, company, and description are **excluded**
  on purpose (see Notes) — a niche term may honestly return **0 results** when the
  latest-100 feed has no such titles.
- `--tag <text>` — opt-in RemoteOK **tag** filter (e.g. `--tag golang`). This is the
  broad, noisy tag matching; RemoteOK applies 13–43 tags per posting, so precision is
  low. Combine with `-q` to narrow. Use only when you explicitly want tag-based recall.
- `--location <text>` / `-l <text>` — filter results by location substring,
  client-side. Most RemoteOK roles are worldwide-remote (shown as `Remote`), so this
  only narrows the minority of geo-scoped postings.
- `--jobage <days>` — **supported**: only postings from the last N days (client-side
  filter on the posting `epoch`/`date`). e.g. `--jobage 7`.
- `--page <n>` — 1-indexed page (**20 results per page**, client-side over the fetched feed).
- `--limit <n>` / `-n <n>` — cap total results emitted (client-side).
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/remoteok-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

`id` is the numeric job ID from `search` results (e.g. `1134900`). You may also pass
a full RemoteOK `remote-jobs/...` URL or a slug ending in `-<id>` — the trailing
numeric id is extracted automatically. Returns the cleaned full description (HTML
stripped, entities decoded, paragraph breaks kept), salary, tags, company, and
location. RemoteOK has no per-id endpoint, so `detail` looks the job up in the
current feed — only jobs still in the latest ~100 postings are retrievable.

## Usage examples

```bash
# Engineer roles (title match), quick scan
bun run .agents/skills/remoteok-search/cli/src/cli.ts search -q "engineer" --limit 5 --format table

# Backend roles posted in the last week
bun run .agents/skills/remoteok-search/cli/src/cli.ts search -q "backend" --jobage 7 --format table

# React roles (title match), readable listing
bun run .agents/skills/remoteok-search/cli/src/cli.ts search -q "react" --format plain

# Explicit Go tag filter (opt-in, noisy — broad tag recall)
bun run .agents/skills/remoteok-search/cli/src/cli.ts search --tag golang --format table

# Everything in the current feed (no keyword), first 10
bun run .agents/skills/remoteok-search/cli/src/cli.ts search --limit 10 --format table

# Full details for a specific job
bun run .agents/skills/remoteok-search/cli/src/cli.ts detail 1134900 --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, passing IDs to `detail`. Shape: `{ meta: { count, page }, results: [...] }` |
| `table` | Quick human-readable scanning (ID · title · company · location · salary) |
| `plain` | Reading listings or a single job's full detail (`detail` command) |

Each JSON result has `id`, `title`, `company`, `location`, `date`, `url`, plus the
extras `salary` (USD string, or `null` when undisclosed) and `tags` (string array).
Missing values are `null`, never omitted.

All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the
process exits with code `1`.

## Notes

- **Data source:** RemoteOK's public JSON API at `https://remoteok.com/api` — no
  credentials required. It returns one array; **element [0] is a legal/metadata
  object and is skipped.** The feed is the latest ~100 postings.
- **`-q` is a client-side TITLE filter.** The API has no reliable keyword parameter, so
  we filter the fetched feed ourselves — and match the **job title only**. Tags, company,
  and description are excluded deliberately: RemoteOK stuffs 13–43 broad tags onto every
  posting (a `golang` tag lands on medical/sales/admin roles) and descriptions are noisy,
  so including them returned badly misleading hits (`-q golang` → a Coca-Cola customer
  role; `-q backend` → a sales internship). Title-only matching keeps results honest — a
  niche term simply returns few or **0** hits when the latest-100 feed has no such titles.
- **`--tag` is the opt-in tag filter.** If you specifically want RemoteOK's broad tag
  recall, use `--tag <t>` (e.g. `--tag golang`). It is intentionally lower-precision. The
  `?tags=<tag>` server endpoint behaves the same way (every returned job carries the tag,
  but the tag is stuffed), so we apply the tag filter client-side for consistency.
- **`--jobage` is supported** (unlike some portals): postings carry an `epoch`/`date`,
  so `--jobage 7` keeps only the last 7 days.
- **Remote-only board.** Nearly all roles are worldwide-remote and show as
  `location: "Remote"`. `--location` only narrows the minority of geo-scoped listings.
- **Recall is bounded by the feed.** Because only the latest ~100 postings are served,
  a narrow keyword may return few or no hits — broaden the term or drop `-q` to browse.
- **Salary** is formatted from RemoteOK's USD `salary_min`/`salary_max` (annual); it is
  `null` when the employer didn't disclose a range (the common case).
- RemoteOK may rate-limit; the CLI retries 429/5xx with exponential backoff. Keep volume low.
