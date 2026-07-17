# RemoteOK API URL Reference

Public, unauthenticated JSON API used by this skill. This is the maintenance doc —
if RemoteOK changes its API, update the field paths and behaviour notes here.

> Personal use only — keep volume low. RemoteOK's API terms ask that you link back
> and credit RemoteOK as a source. The API **blocks requests with an empty/curl-style
> User-Agent**; a browser `User-Agent` + `Accept: application/json` returns HTTP 200.

## Request headers

| Header | Value |
|--------|-------|
| `User-Agent` | A normal desktop Chrome UA string (**required** — empty UA is blocked) |
| `Accept` | `application/json` |
| `Accept-Language` | `en-US,en;q=0.9` |

## Endpoint (search + detail share one call)

```
GET https://remoteok.com/api
```

Returns a single JSON **array**. There is only this one endpoint — there is **no**
search query, location, date, or per-id endpoint. The array holds the latest ~100
postings, so both `search` and `detail` fetch this same URL:

- **`search`** fetches the array and filters/paginates it entirely **client-side**.
- **`detail <id>`** fetches the array and finds the record whose `id` matches. Only
  jobs still in the latest ~100 are retrievable (older ids return `NOT_FOUND`).

### ⚠️ Element [0] is legal metadata — SKIP it

The first array element is **not** a job. It is a metadata object:

```jsonc
{
  "last_updated": 1784250630,
  "legal": "API Terms of Service: Please link back ... and mention Remote OK as a source ..."
}
```

The CLI detects it by the presence of a `legal` key (and the absence of `id`) via
`isJobEntry()` and skips it. Every other element is a job.

### Job object shape (confirmed live)

```jsonc
{
  "id": "1134900",                    // STRING already; we String() it defensively
  "slug": "remote-hr-assistant-sundayy-1134900",
  "epoch": 1784178132,                // unix seconds -> used by --jobage
  "date": "2026-07-16T05:02:12+00:00",// ISO8601
  "company": "Sundayy",
  "company_logo": "https://...",
  "position": "HR Assistant",         // -> title
  "tags": ["hr", "education", "..."], // ARRAY of strings
  "logo": "https://...",
  "description": "<strong>...</strong>...", // HTML fragment (often LinkedIn-sourced)
  "location": "United States, ",      // trailing ", " noise; often "" (=> "Remote")
  "apply_url": "https://remoteOK.com/remote-jobs/...",
  "salary_min": 0,                    // USD annual; 0 = undisclosed (the common case)
  "salary_max": 0,
  "url": "https://remoteOK.com/remote-jobs/remote-hr-assistant-sundayy-1134900"
}
```

### Field mapping (job object → JobCard)

| JobCard field | Source path |
|---------------|-------------|
| `id` | `String(job.id)` |
| `title` | `job.position` (HTML-cleaned) |
| `company` | `job.company` (HTML-cleaned) → else `null` |
| `location` | `cleanLocation(job.location)` (trailing commas trimmed) → **`"Remote"` when blank** |
| `date` | `job.date` (ISO8601) → else `null` |
| `url` | `job.url` → `job.apply_url` → `https://remoteok.com/remote-jobs/<slug>` → else `null` |
| `salary` (extra) | formatted from `job.salary_min` / `job.salary_max` — see below |
| `tags` (extra) | `job.tags` (array of strings) → else `null` |
| `description` (detail only) | `htmlToText(job.description)` — tags stripped, entities decoded, breaks kept |

**Salary formatting:** USD annual figures. `min>0 && max>0` → `"$50,000 - $70,000"`;
only `max` → `"Up to $90,000"`; only `min` → `"From $60,000"`; both `0` → `null`
(undisclosed, which is the common case — only ~2 in 100 postings list a range).

## Client-side filtering (no server-side params exist)

| Flag | How it's applied |
|------|------------------|
| `-q` / `--query` | Token-AND, case- & accent-insensitive over the **`position` (title) ONLY**. Tags, company, and description are excluded — see below. |
| `--tag <t>` | Opt-in: keep postings where any `tags[]` entry contains `<t>` (case-insensitive). Low precision (tags are stuffed). |
| `-l` / `--location` | Substring match (accent-insensitive) on the mapped location. |
| `--jobage <days>` | Keep postings whose `epoch` (fallback: parsed `date`) is within N days of now. |
| `--page <n>` | Slice the filtered results into pages of 20 (client-side; the feed isn't paged). |
| `-n` / `--limit <n>` | Cap the number of results emitted. |

### Why `-q` matches the title only (and `--tag` is a separate opt-in)

RemoteOK applies **13–43 tags to nearly every posting** (verified live: avg ~13/job,
max 43). The `golang` tag shows up on medical, sales, and admin roles; descriptions
are equally noisy. Matching `-q` over tags/company/description therefore produced
badly misleading false positives — `-q golang` returned a Coca-Cola customer role and
`-q backend` a sales internship. So `-q` matches the **job title only**, which keeps
precision honest (a niche term returns few/zero hits rather than garbage), and the
broad tag-based recall is preserved behind the opt-in `--tag` flag.

`GET https://remoteok.com/api?tags=golang` **does** change the returned set (every
returned job carries the requested tag), but because the tag itself is stuffed, the
server endpoint is just as noisy — so `--tag` is applied client-side for consistency.

## HTML cleaning

Descriptions are HTML fragments (frequently LinkedIn-sourced) mixing named entities
(`&amp;`, `&nbsp;`, `&ndash;`, …), numeric references, and `<br>`/`<p>`/`<li>` tags,
plus a trailing "Please mention the word … when applying" / "See this and similar
jobs on LinkedIn" boilerplate RemoteOK injects. The CLI decodes named + numeric
entities, converts `<br>`/`</p>`/`</li>`/… to line breaks (list items get a `•`),
strips remaining tags, and collapses whitespace. Note: some source fields contain
baked-in mojibake (e.g. `Perú` stored as `PerÃº`) — that is RemoteOK's own data, left
as-is rather than risk corrupting correctly-encoded records.

## Notes

- No authentication required; one endpoint serves everything.
- Respect rate limits — the CLI backs off on 429/5xx and returns `null` on 404.
- The feed is the latest ~100 postings; there is no deeper pagination server-side.
