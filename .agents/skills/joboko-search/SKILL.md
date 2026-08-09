---
name: joboko-search
version: 1.0.0
description: >
  Use this skill whenever the user wants to search jobs in Vietnam on Joboko
  (vn.joboko.com), a Vietnamese job aggregator (formerly GoodCV) that cross-posts
  listings from many other boards, or to look up a specific Joboko posting. Useful
  as a catch-all net for postings that the source-specific Vietnamese job CLIs
  miss. Covers developer, engineer, backend, frontend, fullstack, IT and general
  roles in Ha Noi, Ho Chi Minh and Da Nang. Trigger phrases (English): Joboko jobs,
  GoodCV, jobs Vietnam, aggregator jobs Vietnam, developer jobs Hanoi, find job
  Vietnam. Trigger phrases (Vietnamese): việc làm, tuyển dụng, tìm việc làm Hà Nội,
  việc làm IT, việc làm lập trình viên, tuyển dụng backend.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/joboko-search/cli/src/cli.ts *)
---

# Joboko Search

Searches **vn.joboko.com**, a Vietnamese job aggregator (ex-GoodCV). It republishes
listings from many other boards, so its value is **coverage overlap** — it
occasionally surfaces a posting that no source-specific CLI caught.

Zero runtime dependencies.

## Read this before trusting results

This is an **aggregator, and its index skews stale.** It keeps expired postings
live on the site rather than removing them — a posting fetched from here in
testing had been closed since 2023 while still rendering as a normal listing.

Two mitigations are built in and you should treat both as required:

- Cards carry the **application deadline**, so `--open-only` filters the whole
  result set with no extra requests. Use it by default.
- `detail` returns an **`expired: true|false`** field parsed from the page's own
  closed-posting banner. Check it before acting on any Joboko result.

Prefer the source-specific CLIs (`itviec-search`, `topcv-search`,
`vietnamworks-search`, `careerviet-search`) when a posting appears on both.

## Commands

```
bun run .agents/skills/joboko-search/cli/src/cli.ts search [--query "<kw>"] [--location <city>] [flags]
bun run .agents/skills/joboko-search/cli/src/cli.ts detail <url|path> [--format json|plain]
bun run .agents/skills/joboko-search/cli/src/cli.ts slugs
```

### Search flags

| Flag | Meaning |
|------|---------|
| `--query`, `-q <text>` | Keyword — **pre-generated slugs only**, see below |
| `--location`, `-l <city>` | City, appended as `-tai-<city>`. e.g. `ha noi` |
| `--open-only` | Drop postings whose deadline has passed. **Use this** |
| `--page <n>` | 1-indexed page, 20/page. Default 1 |
| `--limit`, `-n <n>` | Cap results emitted (client-side) |
| `--format <fmt>` | `json` (default) \| `table` \| `plain` |

### `-q` only accepts pre-generated slugs

Joboko serves a fixed set of keyword landing pages. Broad terms resolve; narrow
technology terms 404:

| Works | 404s |
|-------|------|
| `backend developer`, `lap trinh vien`, `developer` | `golang`, `nodejs`, `lap trinh vien backend` |

An unsupported keyword exits 1 with code `NO_SLUG` and a message naming working
alternatives — it does not silently return nothing. Run `slugs` for the known list.

To find Go roles here, search a broad slug and filter titles downstream.

## Examples

```bash
# Open Ha Noi backend postings only
bun run .agents/skills/joboko-search/cli/src/cli.ts search -q "backend developer" -l "ha noi" --open-only --format table

# Second page
bun run .agents/skills/joboko-search/cli/src/cli.ts search -q "lap trinh vien" --page 2 --format table

# Machine-readable for /scrape
bun run .agents/skills/joboko-search/cli/src/cli.ts search -q "backend developer" -l "ha noi" --open-only --limit 20 --format json

# Full posting — needs the URL, not a bare ID
bun run .agents/skills/joboko-search/cli/src/cli.ts detail "https://vn.joboko.com/viec-lam-lap-trinh-vien-java-xvi6610939" --format plain
```

## Output format

`search --format json` emits:

```json
{ "meta": { "count": 5, "page": 1 }, "results": [ ... ] }
```

| Field | Notes |
|-------|-------|
| `id` | Numeric Joboko job ID (the `xvi<id>` URL suffix) |
| `title` | Decoded text |
| `company` / `companyUrl` | From the card; `companyUrl` may be `null` |
| `location` | e.g. `Hà Nội` |
| `date` | Always `null` on cards — the card date is the deadline |
| `deadline` | ISO `YYYY-MM-DD` |
| `salary` | Verbatim; formats vary wildly (`8TR-12TR`, `1300 - 2500 USD`, `12 - 18 triệu`) |
| `snippet` | Short description excerpt from the card |
| `url` | Absolute posting URL |

`detail` adds `description`, `industry`, `employmentType`, `expired`, and a real
`date` (posted) from the page's JSON-LD.

Errors go to **stderr** as `{"error": "...", "code": "..."}` with exit code 1.

## Notes / portal quirks

- **Pagination is `?p=`, not `?page=`.** `?page=2` returns HTTP 200 with page 1
  content — a silent no-op that looks like "no more results".
- **`detail` needs the full URL or path.** The slug is part of the route
  (`/viec-lam-<slug>-xvi<id>`), so a bare numeric ID cannot be resolved. The CLI
  rejects a bare ID with an explanatory `BAD_ID` rather than fetching a wrong page.
- **Detail pages embed schema.org `JobPosting` JSON-LD**, which the parser uses for
  title, description, dates, employer, location, industry and employment type.
- **The card date is the deadline, not the posting date**, despite the generic
  `item-date` class name. The posting date is only available on `detail`.
- **Salary formats are inconsistent** because listings come from different source
  boards. Parse defensively downstream; the CLI passes the text through verbatim.
- `robots.txt` blocks SEO crawlers (AhrefsBot, SemrushBot, MJ12bot, dotbot and
  others) but places no restriction on this kind of access.
