---
name: careerviet-search
version: 1.0.0
description: >
  Use this skill whenever the user wants to search jobs in Vietnam on CareerViet
  (careerviet.vn), a large general job board with a strong IT-Software category,
  or to look up a specific CareerViet job posting — especially for Ha Noi, Ho Chi
  Minh, or Da Nang. CareerViet is the rebrand of CareerBuilder Vietnam, so
  careerbuilder.vn links redirect here. Invoke for developer, engineer, backend,
  frontend, fullstack, IT, banking and other roles in the Vietnamese market, even
  if the user does not name CareerViet. Trigger phrases (English): CareerViet
  jobs, CareerBuilder Vietnam, jobs Vietnam, developer jobs Hanoi, backend
  developer Vietnam, IT jobs Ho Chi Minh, find job Vietnam. Trigger phrases
  (Vietnamese): việc làm, tuyển dụng, tìm việc làm Hà Nội, việc làm IT, việc làm
  lập trình, tuyển lập trình viên, kỹ sư phần mềm, việc làm ngân hàng.
context: fork
allowed-tools: Bash(bun run .agents/skills/careerviet-search/cli/src/cli.ts *)
---

# CareerViet Search

Searches **careerviet.vn**, one of Vietnam's larger general job boards (rebranded
from CareerBuilder Vietnam in 2024). Volume is broad rather than IT-only, but the
CNTT - Phần mềm category is well populated and the board carries a lot of
**banking and financial-services engineering** roles that the IT-specific boards
miss.

Zero runtime dependencies — plain `bun` + `fetch` + regex over the server-rendered
HTML. Nothing to install beyond the repo clone.

## What makes this portal worth running

**Search results carry the application deadline (`Hạn nộp`) directly.** Most
Vietnamese boards only expose the deadline on the detail page, which forces one
fetch per job to find out whether a posting is still open. Here the deadline is on
the card, so `--open-only` filters the whole result set without any extra requests.

## Commands

```
bun run .agents/skills/careerviet-search/cli/src/cli.ts search [--query "<kw>"] [--location <city>] [flags]
bun run .agents/skills/careerviet-search/cli/src/cli.ts detail <id|url> [--format json|plain]
```

### Search flags

| Flag | Meaning |
|------|---------|
| `--query`, `-q <text>` | Keywords (job title or skill), e.g. `backend`, `golang`, `lập trình` |
| `--location`, `-l <city>` | City name or raw CareerViet code (see below) |
| `--jobage <days>` | Keep postings updated within N days — **client-side**, see Notes |
| `--open-only` | Drop postings whose application deadline has already passed |
| `--sort date` | Newest first (CareerViet's `sortdv` segment) |
| `--page <n>` | 1-indexed page, 50 results/page. Default 1 |
| `--limit`, `-n <n>` | Cap results emitted (client-side) |
| `--format <fmt>` | `json` (default) \| `table` \| `plain` |

### Known location names

`ha noi` (4) · `ho chi minh` (8) · `da nang` (20) · `binh duong` (13) ·
`dong nai` (19) · `hai phong` (6) · `can tho` (17)

Any numeric CareerViet location code also works, so a city that is not in the map
can still be searched by passing its code directly.

## Examples

```bash
# Backend roles in Ha Noi, newest first
bun run .agents/skills/careerviet-search/cli/src/cli.ts search -q "backend" -l "ha noi" --sort date --format table

# Only postings whose deadline has not passed
bun run .agents/skills/careerviet-search/cli/src/cli.ts search -q "golang" -l "ha noi" --open-only --format table

# Vietnamese keyword, page 2
bun run .agents/skills/careerviet-search/cli/src/cli.ts search -q "lập trình" -l "ha noi" --page 2 --format table

# Machine-readable output for /scrape
bun run .agents/skills/careerviet-search/cli/src/cli.ts search -q "nodejs" -l "ha noi" --limit 20 --format json

# Full posting by ID or URL
bun run .agents/skills/careerviet-search/cli/src/cli.ts detail 35C7FB4F --format plain
bun run .agents/skills/careerviet-search/cli/src/cli.ts detail "https://careerviet.vn/vi/tim-viec-lam/backend-techlead-khoi-ngan-hang-so.35C7CAB2.html" --format plain
```

## Output format

`search --format json` emits:

```json
{ "meta": { "count": 2, "page": 1 }, "results": [ ... ] }
```

| Field | Notes |
|-------|-------|
| `id` | CareerViet job ID, e.g. `35C7FB4F` (alphanumeric, not decimal) |
| `title` | Decoded text |
| `company` / `companyUrl` | `null` if the card omits the employer |
| `location` | Comma-joined when a posting lists several cities |
| `date` | Last updated (`Cập nhật`) as ISO `YYYY-MM-DD` |
| `deadline` | Application deadline (`Hạn nộp`) as ISO `YYYY-MM-DD` |
| `salary` | Verbatim, usually `Cạnh tranh` or a VND band |
| `url` | Absolute posting URL |

`detail` adds `description`, `benefits`, `industry`, `employmentType`.

Errors go to **stderr** as `{"error": "...", "code": "..."}` with exit code 1.

## Notes / portal quirks

- **Search is path-based, not query-string based.** URLs look like
  `/viec-lam/<keyword>-k-vi.html`, with `-kl<code>-` for location and
  `-trang-<n>-` for pagination. `?q=` and `?page=` do nothing. See
  `url-reference.md`.
- **No posting-age parameter exists**, so `--jobage` is applied client-side
  against the card's `Cập nhật` date. Cards with no parsable date are kept rather
  than silently dropped. Prefer `--open-only`, which uses the real deadline.
- **Keyword matching is loose.** `-q "developer"` also matches "Business
  Development Executive". Filter titles downstream or use a more specific keyword.
- **Detail pages embed schema.org `JobPosting` JSON-LD**, which the parser prefers
  over markup scraping; HTML parsing is the per-field fallback. This is why detail
  output survives most template changes.
- **Golang volume is thin** (single digits site-wide). This board's value is
  `backend` (~85), `lập trình` (~2,200) and the banking/fintech employers, not
  Go-specific searches.
- Job IDs are alphanumeric (`35C7FB4F`), not numeric like most boards — don't
  assume `\d+` when matching them.
