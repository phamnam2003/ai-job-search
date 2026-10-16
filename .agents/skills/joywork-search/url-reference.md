# JoyWork API URL Reference

Public, unauthenticated JSON endpoints on `api.joywork.vn` used by this skill. They are the
same endpoints the joywork.vn Next.js frontend calls from the browser (an axios client with
`baseURL: "https://api.joywork.vn"`). This is the maintenance doc: if JoyWork changes its
API, update the params and field paths here.

Recorded 2026-10-16.

> Personal use only. joywork.vn's terms (Điều D1) forbid scraping other users' data and
> reverse engineering; Điều C1.2 forbids commercial exploitation. `https://joywork.vn/robots.txt`
> is `Allow: /` for every user agent. `api.joywork.vn/robots.txt` does not exist (404).
> Plain requests with `User-Agent: Mozilla/5.0 (compatible; joywork-cli/1.0)` return 200,
> with no WAF or challenge page.

## Why not the HTML

`https://joywork.vn/jobs?...` is a client-rendered React Query page: the HTML carries no
job data, only the JS bundle. The search page's bundle (`app/(app)/jobs/page-*.js`) builds
the request below. The job-detail page is server-rendered but uses the same detail endpoint.

## Search

```
GET https://api.joywork.vn/api/jobs
```

| Param | Meaning | Notes |
|-------|---------|-------|
| `q` | Free-text keyword | Fuzzy / similarity-ranked (see Quirks). Results are relevance-ordered. |
| `location` | Province code | One of the 34 codes below. A name (`Hà Nội`) is a 400 `VALIDATION_ERROR` "Unknown location code". |
| `page` | 1-indexed page | `page=0` is a 400. Past the last page returns `jobs: []`. |
| `limit` | Page size | Default 20; maximum 50 (`51+` is a 400). The site sends 12. |
| `ward` | Ward code (`ha-noi/00637`) | Not exposed by the CLI. |
| `remote` | Remote only | `remote=true` returned 0 results on 2026-10-16. Not exposed. |
| `employmentType` | `FULL_TIME` `PART_TIME` `CONTRACT` `INTERNSHIP` `REMOTE` | Not exposed. |
| `experienceLevel` | `NO_EXPERIENCE` `LT_1_YEAR` `Y1_2` `Y2_3` `Y3_5` `Y5_10` `GT_10` | Not exposed. |
| `jobLevel` | `INTERN_STUDENT` `FRESH_GRAD` `EMPLOYEE` `SPECIALIST_TEAM_LEAD` `MANAGER_HEAD` `DIRECTOR` `EXECUTIVE` | Not exposed. |
| `educationLevel`, `gender`, `worksOnSaturday`, `companyBadges`, `companyId`, `salaryCurrency`, `salaryMin`, `salaryMax` | Other site filters | Not exposed. |

There is **no** posting-age, sort, or active-only parameter. `isActive=true` and
`status=ACTIVE` are ignored (same totals).

### Search response

```json
{
  "data": {
    "jobs": [ { ...job... } ],
    "pagination": { "page": 1, "limit": 20, "total": 295, "totalPages": 15 }
  }
}
```

Each search job object already carries the **full description sections** (`mission`,
`tasks`, `knowledge`, …), which is what lets `--strict` match on description text
without a detail request per result.

## Detail

```
GET https://api.joywork.vn/api/jobs/<id>
```

`<id>` is a cuid (25 chars, starts with `c`, e.g. `cmvaaz25x08uhp066wlvmmh9d`).

| Case | Response |
|------|----------|
| Found | 200 `{ "data": { "job": { ...job... } } }`. Closed postings are still served, with `isActive: false`. |
| Well-formed but unknown id | 404 `{ "error": { "code": "JOB_NOT_FOUND", "message": "Job not found" } }` |
| Malformed id | 400 `{ "error": { "code": "VALIDATION_ERROR", ... "Invalid job ID" } }` |

The CLI validates the id format before sending, so the 400 is not normally reached.

## Job object fields

| Field | Type | CLI output |
|-------|------|------------|
| `id` | cuid | `id` |
| `title` | string | `title` |
| `slug` | string | used in `url` |
| `company.name` | string | `company` (`company.legalName`, `logoUrl`, `badges`, `website` also present) |
| `locations` | string[] | `location`. **Mixed:** province codes (`ha-noi`) on newer postings, display names (`Hà Nội`) on older ones. The CLI maps codes to names. |
| `location` | string \| absent | Free-text fallback on older postings |
| `specificAddress` | string \| null | detail `address` |
| `wardCodes` | string[] | `province/ward` codes, unused |
| `remote` | boolean | appends `Remote` to `location` |
| `createdAt` | ISO 8601 | `date` (`updatedAt` changes on bulk edits, so it is not a posting date) |
| `applicationDeadline` | ISO 8601 \| null | `deadline` |
| `isActive` | boolean | feeds `expired` |
| `salaryMin`, `salaryMax`, `currency` | number \| null, `"VND"` | `salary` |
| `benefitsIncome` | string \| null | `salary` fallback, and `Income:` in BENEFITS |
| `employmentType`, `experienceLevel`, `jobLevel` | enums above | `employmentType`, `experience`, `level` (English labels) |
| `department` | string \| null | detail `department` (`Công nghệ` for IT) |
| `educationLevel`, `gender`, `worksOnSaturday` | enums | unused |
| `workingTimeRanges` | `[{ dayFrom, dayTo, timeStart, timeEnd }]` | detail `workingHours` |
| `workingTimeNote` | string \| null | detail `workingHours` |
| `generalInfo` | HTML | description overview (usually empty) |
| `mission` | HTML | `MISSION` — site heading "1. Sứ mệnh / Vai trò tổng quát" |
| `tasks` | HTML | `TASKS` — "2. Nhiệm vụ chuyên môn" |
| `kpis` | HTML \| null | `KEY RESULTS` — "3. Kết quả chuyên môn cần đạt" |
| `knowledge`, `skills`, `attitude` | HTML | `REQUIREMENTS` — "4. Yêu cầu vị trí" (Kiến thức / Kỹ năng / Thái độ) |
| `authority` | HTML | `AUTHORITY` — "5. Quyền hạn và phạm vi ra quyết định" |
| `relationships` | HTML | `WORKING RELATIONSHIPS` — "6. Quan hệ công việc" |
| `careerPath` | HTML \| null | `CAREER PATH` — "7. Lộ trình phát triển" |
| `benefitsPerks` | HTML | `BENEFITS` — "8. Quyền lợi" |

HTML is TipTap editor output: `<p>`, `<ul><li><p>…</p></li></ul>`, `<strong>`, `&nbsp;`.

## Site URLs

- Job page: `https://joywork.vn/jobs/<slug>--<id>`. The site splits on the **last** `--`;
  the slug part is not validated (any slug returns the page). When `slug` is null the site
  slugifies the title (Vietnamese locale, lowercase).
- Search page: `https://joywork.vn/jobs?q=<keyword>&location=<code>`.

## Province codes

The 34 codes the `location` param accepts, from the frontend bundle (`chunks/7963-*.js`,
objects shaped `{ code, name, type, region, merged, merged_from, merged_from_codes }`):

| Region | Codes |
|--------|-------|
| North | `ha-noi` `cao-bang` `dien-bien` `lai-chau` `son-la` `lang-son` `quang-ninh` `thanh-hoa` `nghe-an` `ha-tinh` `lao-cai` `tuyen-quang` `thai-nguyen` `phu-tho` `bac-ninh` `hung-yen` `hai-phong` `ninh-binh` |
| Central | `hue` `quang-tri` `da-nang` `quang-ngai` `gia-lai` `khanh-hoa` `lam-dong` `dak-lak` |
| South | `tp-ho-chi-minh` `dong-nai` `tay-ninh` `can-tho` `vinh-long` `dong-thap` `ca-mau` `an-giang` |

The CLI's copy lives in `PROVINCES` in `cli/src/helpers.ts`. If JoyWork adds codes,
update both.

## Quirks

- **Fuzzy keyword match.** `q=golang` → 295 results, with one actual Go posting; the rest
  were teaching and design roles. `q=backend developer` → 49. `q=lập trình viên` → 1364.
  The CLI's `--strict` re-filters on the job text.
- **Keyword results include closed postings**; no-keyword browsing does not. 10 of the
  first 20 `q=backend developer&location=ha-noi` results were closed or past deadline on
  2026-10-16.
- **Board size.** `GET /api/jobs` (no filters) reported `total: 926` on 2026-10-16;
  `location=ha-noi` 440.
