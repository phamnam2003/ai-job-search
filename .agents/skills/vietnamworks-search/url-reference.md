# VietnamWorks — endpoint reference

Maintenance notes for the `vietnamworks-search` CLI. If the portal changes and the parser
breaks, this is the file to update. All findings verified live 2026-07-22.

## Data source

VietnamWorks (vietnamworks.com) is a React SPA backed by a public **job-search microservice**.
Both `search` and `detail` use a single POST/JSON endpoint — no auth, no API key.

```
POST https://ms.vietnamworks.com/job-search/v1.0/search
Content-Type: application/json
```

Recommended request headers (the CLI sends these):
- `User-Agent`: a normal browser UA
- `Origin: https://www.vietnamworks.com`
- `Referer: https://www.vietnamworks.com/`

### robots.txt

`https://www.vietnamworks.com/robots.txt` disallows only apply/profile/internal-ajax paths
(`/my-profile`, `/ho-so/`, `/jobseekers/apply_online.php`, `/jobseekers/ajax.php`, etc.). The
search microservice host (`ms.vietnamworks.com`) and public job-listing pages are **not**
disallowed. This skill touches none of the blocked paths.

## Search

### Request body

```json
{
  "userId": 0,
  "query": "backend",
  "filter": [],
  "ranges": [],
  "order": [{ "field": "approvedOn", "value": "desc" }],
  "hitsPerPage": 50,
  "page": 0
}
```

| Field | Meaning |
|-------|---------|
| `query` | Free-text keyword (title/skill/role). Empty string browses all. |
| `filter` | Array of `{ "field": "<name>", "value": "<string>" }`. **`value` must be a string, not an array** (an array errors 400). `jobId` is a confirmed working field (used by `detail`). Location filter fields tried (`locationIds`, `cityId`, `locationId`, …) all returned 0 hits — treat server-side location filtering as unavailable. |
| `ranges` | Numeric range filters (unused by this CLI). |
| `order` | `[{ "field": "approvedOn", "value": "desc" }]` gives newest-first. |
| `hitsPerPage` | Page size. Up to ~50 used here. |
| `page` | **0-indexed** (CLI `--page` is 1-indexed → API page = `--page` − 1). |

Omitting `retrieveFields` returns **full** records (recommended). If you pass `retrieveFields`,
`jobUrl`/`alias` come back empty — so the CLI does not restrict fields.

### Response shape

```json
{
  "meta": { "code": 200, "nbHits": 48, "page": 0, "nbPages": 1, "hitsPerPage": 50 },
  "data": [ { /* job */ } ]
}
```

Errors come back as `{ "errors": { "status": 400, "detail": "..." } }` (HTTP may still be 200-ish),
so check for an `errors` key.

### Per-job fields used (from `data[]`)

| Field | Maps to | Notes |
|-------|---------|-------|
| `jobId` | `id` | numeric |
| `jobTitle` | `title` | |
| `companyName` | `company` | |
| `jobUrl` | `url` | e.g. `https://www.vietnamworks.com/<alias>-<jobId>-jv`. Empty if `retrieveFields` was sent. |
| `alias` | (url fallback) | slug; URL built as `https://www.vietnamworks.com/<alias>-<jobId>-jv` |
| `canonical` | — | `<alias>-<jobId>-jv` (alternative slug source) |
| `approvedOn` | `date` | ISO 8601, e.g. `2026-07-03T11:58:05+07:00` — used for `--jobage` |
| `approvedOnText` | (date fallback) | Vietnamese relative text, e.g. `"Đăng 19 ngày trước"` |
| `workingLocations[]` | `location` | each has `cityName` (EN, e.g. `"Ha Noi"`), `cityNameVI` (`"Hà Nội"`), `cityId` (Ha Noi = 24) |
| `prettySalary` | `salary` | pre-formatted string; `"Thương lượng"` = negotiable |
| `skills[]` | `skills` | each `{ skillId, skillName }`; de-duplicated on join |

## Detail

Same endpoint, filtered by `jobId`:

```json
{
  "userId": 0,
  "query": "",
  "filter": [{ "field": "jobId", "value": "2076956" }],
  "ranges": [],
  "order": [],
  "hitsPerPage": 1,
  "page": 0
}
```

The returned record additionally carries (empty in list view):

| Field | Maps to | Notes |
|-------|---------|-------|
| `jobDescription` | description (part 1) | HTML (`<p>`, `<ul>`, `<li>`) |
| `jobRequirement` | description (part 2, "REQUIREMENTS") | HTML |
| `skills[]` | `skills` | as above |
| `benefits[]` | (not surfaced) | `{ benefitName, benefitValue }` — available if needed later |

There is **no** dedicated detail API: `ms.vietnamworks.com/job/v1.0/detail?jobId=` and
`/jobseeker/v1.0/jobs/<id>` return 403; the SPA HTML has no JSON-LD or embedded state to scrape.
The search-by-jobId path is the supported source of full detail.

## Detail URL patterns

- Canonical: `https://www.vietnamworks.com/<alias>-<jobId>-jv`
- Also resolves (200): `https://www.vietnamworks.com/<anything>-<jobId>-jd`
- `extractId()` pulls the trailing `<jobId>` from `-<id>-jv` / `-<id>-jd`, a bare number, or any
  URL/slug containing a 4+ digit run.
