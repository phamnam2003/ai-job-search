---
name: joywork-search
version: 1.0.0
description: >
  Use this skill to search jobs in Vietnam on JoyWork (joywork.vn), a general Vietnamese
  job board with culture-focused company profiles, or to look up a specific JoyWork job
  posting. Covers all sectors (IT/software, marketing, sales, accounting, design, operations)
  in Ha Noi, Ho Chi Minh City, Da Nang and the other provinces. Trigger phrases (English):
  JoyWork jobs, joywork.vn, jobs in Vietnam, find a job in Hanoi, developer jobs Hanoi,
  look up this JoyWork posting. Trigger phrases (Vietnamese): việc làm JoyWork, tuyển dụng
  Hà Nội, tìm việc làm, việc làm lập trình, tuyển lập trình viên, tin tuyển dụng joywork.
context: fork
enabled: true  # set to false to keep this portal installed but have /scrape skip it
allowed-tools: Bash(bun run .agents/skills/joywork-search/cli/src/cli.ts *)
---

# JoyWork Search Skill

Search live job listings from **JoyWork** (joywork.vn), a Vietnamese job board, through the
public JSON API its own website calls. No authentication, no API key, and **zero runtime
dependencies** — it runs with just `bun`.

> JoyWork is a **general** board, not an IT one. It held about 926 open postings
> nationwide on 2026-10-16. Most are sales, marketing, admin and teaching roles. Expect a
> few software roles per query, not dozens.

## ⚠️ Personal use only

joywork.vn's terms of use (Điều D1) forbid "thu thập trái phép dữ liệu người dùng khác
(scraping, crawling)" and reverse engineering the platform, and Điều C1.2 forbids commercial
exploitation. This skill reads **public job postings only** — never candidate data — through
the same API the website calls. `robots.txt` allows all crawlers. Even so, **keep volume
low, don't use it commercially or for bulk data collection**, and run it on your own
responsibility.

## When to use this skill

- Search job openings in Vietnam, optionally narrowed to one province with `--location`
- Browse the newest postings in a city (no query, `--jobage` to keep it fresh)
- Get the full description of a specific JoyWork posting

## Commands

### Search job listings

```bash
bun run .agents/skills/joywork-search/cli/src/cli.ts search [flags]
```

Key flags:
- `--query <text>` / `-q <text>` — keyword search. **Fuzzy and similarity-ranked** (see Notes), so pair it with `--strict`.
- `--location <text>` / `-l <text>` — one province, filtered **server-side**. Accepts a code (`ha-noi`) or a name with or without accents (`"Hà Nội"`, `"ha noi"`), plus the aliases `hanoi`, `hcm`, `hcmc`, `saigon` and `danang`. An unknown value exits with `BAD_LOCATION` instead of being sent.
- `--jobage <days>` — posted within N days. Applied **client-side** on the posting date (the API has no age parameter).
- `--strict` — keep only postings whose own text (title, mission, tasks, requirements) contains **every** query word, accent-insensitively. This removes the fuzzy-match noise.
- `--include-expired` — keep closed and past-deadline postings. By default they are **dropped**, because keyword search returns them mixed in with open ones.
- `--page <n>` — page number (1-indexed, **20 results per page before filtering**).
- `--limit <n>` / `-n <n>` — cap total results emitted (client-side).
- `--format json|table|plain` — default `json`.

### Fetch full job detail

```bash
bun run .agents/skills/joywork-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

`id` is the job id from `search` results, a 25-character cuid such as
`cmvaaz25x08uhp066wlvmmh9d`. You may also pass a full `https://joywork.vn/jobs/<slug>--<id>`
URL or the `<slug>--<id>` segment. Returns the full description in the site's own section
order: mission, tasks, key results, requirements (knowledge / skills / attitude), authority,
working relationships, career path and benefits. It also returns department, street
address, working hours, deadline and an `expired` flag.

## Usage examples

```bash
# Go / backend roles in Ha Noi, noise removed
bun run .agents/skills/joywork-search/cli/src/cli.ts search -q "golang" -l "Hà Nội" --strict --format table

# Any developer role in Ha Noi from the last 30 days
bun run .agents/skills/joywork-search/cli/src/cli.ts search -q "developer" -l ha-noi --strict --jobage 30 --format table

# Vietnamese-language query
bun run .agents/skills/joywork-search/cli/src/cli.ts search -q "lập trình viên" -l "ha noi" --strict --format plain

# Newest postings in Ho Chi Minh City this week, no keyword
bun run .agents/skills/joywork-search/cli/src/cli.ts search -l hcm --jobage 7 --format table

# Full details for a specific job
bun run .agents/skills/joywork-search/cli/src/cli.ts detail cmvaaz25x08uhp066wlvmmh9d --format plain
```

## Output formats

| Format | Best for |
|--------|----------|
| `json` | Default — programmatic use, passing IDs to `detail`. Shape: `{ meta: { count, page, totalPages, total, expiredDropped }, results: [...] }` |
| `table` | Quick human-readable scanning (ID · title · company · location · posted · salary) |
| `plain` | Reading listings, or a single job's full detail (`detail` command) |

Each JSON result has `id`, `title`, `company`, `location`, `date` (posting date, ISO 8601),
`url`, plus the extras `salary`, `deadline`, `expired`, `level`, `experience` and
`employmentType`. Missing values are `null`, never omitted. `meta.total` and
`meta.totalPages` come from the API and count **before** the client-side filters;
`meta.expiredDropped` says how many results on this page the expired filter removed.

All errors are written to **stderr** as `{ "error": "...", "code": "..." }` and the process exits with code `1`.

## Notes

- **Data source:** `https://api.joywork.vn/api/jobs`, the JSON API the joywork.vn Next.js
  frontend calls. The website itself renders listings client-side, so its HTML has no
  job data to parse. Endpoints and field paths are in `url-reference.md`.
- **Keyword search is fuzzy.** It behaves like trigram similarity, not word matching:
  `golang` returned 295 hits on 2026-10-16, mostly teaching and design jobs ("Giảng viên"
  shares letters with "golang"). Only one was a Go role. **Pass `--strict`** to keep only
  postings that literally mention every query word. `--strict` filters within the fetched
  page, so scan further pages with `--page` if a page comes back thin.
- **Expired postings are mixed in.** Keyword results include postings with `isActive:
  false` (shown on the site as "Đã ngừng tuyển") and postings whose deadline has passed
  ("Đã hết hạn ứng tuyển"). The CLI drops both by default and reports how many in
  `meta.expiredDropped`. A browse with no keyword returns only active postings, newest first.
- **Location is a province code.** The API takes exactly one of the 34 post-merger
  province codes and rejects names. The CLI maps names to codes: `ha-noi`, `hue`,
  `cao-bang`, `dien-bien`, `lai-chau`, `son-la`, `lang-son`, `quang-ninh`, `thanh-hoa`,
  `nghe-an`, `ha-tinh`, `lao-cai`, `tuyen-quang`, `thai-nguyen`, `phu-tho`, `bac-ninh`,
  `hung-yen`, `hai-phong`, `ninh-binh`, `quang-tri`, `da-nang`, `quang-ngai`, `gia-lai`,
  `khanh-hoa`, `lam-dong`, `dak-lak`, `tp-ho-chi-minh`, `dong-nai`, `tay-ninh`, `can-tho`,
  `vinh-long`, `dong-thap`, `ca-mau`, `an-giang`. Pre-merger names such as Bắc Giang or
  Bình Dương are not accepted; use the province they merged into.
- **No remote filter.** The API has a `remote` parameter, but no posting was flagged remote
  on 2026-10-16, so the CLI does not expose it. A remote posting shows `Remote` in `location`.
- **Salary** is the employer's numeric range (`26,000,000 - 35,000,000 VND`) when given,
  else their free-text income note (`"17 - 25 triệu"`), else `null`. The API carries no pay
  period, so none is appended.
- **Level labels** are translated from the API's enums: `Intern / Student`, `Fresh graduate`,
  `Staff`, `Specialist / Team lead`, `Manager / Head of department`, `Director`, `Executive`.
- The CLI retries 429/5xx with exponential backoff and jitter. Keep volume low (see the
  personal-use note above).
