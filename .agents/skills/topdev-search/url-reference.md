# TopDev API URL Reference

Public, unauthenticated JSON:API endpoints on `api.topdev.vn` used by this skill. This is the
maintenance doc — if TopDev changes its API, update the field paths and params here.

> Personal use only — keep volume low; topdev.vn disallows named AI crawlers in robots.txt.
> The `api.topdev.vn` subdomain served plain requests (HTTP 200, no Cloudflare challenge) with a
> browser `User-Agent` + `Accept: application/json`.

## Request headers

| Header | Value |
|--------|-------|
| `User-Agent` | A normal desktop Chrome UA string |
| `Accept` | `application/json` |

## Search

```
GET https://api.topdev.vn/td/v2/jobs
```

Query params (**the `fields[...]` brackets MUST be literal `[` `]`** — percent-encoding them to
`%5B`/`%5D` makes the API return an empty payload; the CLI builds the query string by hand):

| Param | Meaning | Example |
|-------|---------|---------|
| `fields[job]` | Sparse-fieldset selector for the job resource. **Required** — without it the API returns only boolean flag fields (no title/company/etc.). | `id,title,slug,detail_url,salary,addresses,skills_str,company,refreshed_at,published_until` |
| `fields[company]` | Sparse-fieldset selector for the included company | `id,display_name,slug,image_logo` |
| `include` | JSON:API relationship include | `company` |
| `keyword` | Free-text query (literal/tag-based; recall can be low) | `golang`, `backend`, `python` |
| `page` | 1-indexed page number | `1`, `2`, … |
| `per_page` | Requested page size — **ignored**; the API always returns 10/page | `10` |

Params that do **not** work (verified live — each returns the full unfiltered result set, so they
are silently ignored): `address_region_ids`, `address_region_ids[]`, `province_id`, `city_id`,
`locations`. There is no discoverable server-side location filter, so `--location` is applied
client-side. There is likewise no posting-age / date param.

### Search response structure

```jsonc
{
  "meta": { "total": 31, "per_page": 10, "current_page": 1, "last_page": 4, "from": 1, "to": 10 },
  "data": [
    {
      "id": 2118052,                       // number -> String(id)
      "title": "Tech Lead (MDM, Golang, ...)",
      "slug": "tech-lead-mdm-golang-...",
      "detail_url": "https://topdev.vn/detail-jobs/tech-lead-...-2118052",
      "company": {                          // via include=company
        "display_name": "CÔNG TY TNHH CÔNG NGHỆ RONTECH"
      },
      "addresses": {
        "address_region_array": ["Thành phố Hồ Chí Minh"],
        "full_addresses": ["Tầng 1, ..., Thành phố Hồ Chí Minh"]
      },
      "salary": {
        "min_filter": 60000000, "max_filter": 90000000,   // VND-normalized, reliable
        "currency": "VND", "unit": "MONTH",
        "is_negotiable": "0",                              // STRING "0"/"1"
        "value": "6******* - 9******* VND"                 // masked when salary hidden
      },
      "skills_str": "Java, NodeJS, Golang, ReactJS, TypeScript, CI/CD",
      "refreshed_at": null, "published_until": null        // absent in practice -> date is null
    }
  ]
}
```

### Field mapping (search → JobCard)

| JobCard field | Source path |
|---------------|-------------|
| `id` | `String(data.id)` |
| `title` | `data.title` |
| `company` | `data.company?.display_name ?? null` |
| `location` | `data.addresses?.address_region_array?.join(", ")` → else `data.addresses?.full_addresses?.[0]` → else `null` |
| `date` | `data.refreshed_at ?? data.published_until ?? null` (effectively always `null`) |
| `url` | `data.detail_url` (fallback: `https://topdev.vn/detail-jobs/<slug>-<id>`) |
| `salary` (extra) | formatted from `salary` — see below |
| `skills` (extra) | `data.skills_str` |

**Salary formatting:** `is_negotiable` truthy (`"1"`) → `"Negotiable"`. Else for `currency=VND`
use `min_filter`/`max_filter` (they are VND-normalized and reliable) → e.g. `"60,000,000 -
90,000,000 VND/month"`. `value` is only used when it isn't asterisk-masked; otherwise `null`.
Note: for non-VND jobs `min_filter`/`max_filter` are still VND-normalized, so they are not used
as the displayed currency amount.

## Detail

```
GET https://api.topdev.vn/td/v2/jobs/<id>?fields[job]=title,content,responsibilities_original,requirements_original,benefits_original,salary,addresses,company,skills_str,detail_url,slug&include=company
```

`<id>` is the trailing numeric id, extracted from a bare id, a slug, or a `detail_url` with the
regex `/-(\d{5,})(?:$|[?#])/` (plus `/(\d{5,})/` fallbacks).

### Detail response structure

```jsonc
{
  "data": {
    "title": "Tech Lead (MDM, Golang, ...)",
    "content": "<p>...GENERAL INFORMATION / job purpose...</p>",   // HTML — overview only
    "responsibilities_original": "<ul><li>...</li></ul>",           // HTML string
    "requirements_original": "<p>...</p>",                          // HTML string
    "benefits_original": [ { "icon": null, "value": "<ul>...</ul>" } ], // ARRAY of {value}
    "salary": { ... }, "addresses": { ... }, "skills_str": "...",
    "company": { "display_name": "..." }
  }
}
```

The full description is assembled from `content` (overview) + `responsibilities_original` +
`requirements_original` + `benefits_original`, in that order, each converted from HTML to text.
Note the shape inconsistency: `content` / `responsibilities_original` / `requirements_original`
are HTML **strings**, but `benefits_original` is an **array of `{ icon, value }`** objects (the
CLI coerces both shapes to HTML before cleaning).

### HTML cleaning

Bodies mix numeric character references, named Latin-1 entities (`&ocirc;`, `&eacute;`,
`&ndash;`, `&nbsp;`, …), and real Unicode (Vietnamese combining marks arrive pre-decoded via
JSON `\u` escapes). The CLI decodes named + numeric entities, converts `<br>`/`</p>`/`</li>`/…
to line breaks (list items get a `•` bullet), strips remaining tags, and collapses whitespace.

## Notes

- No authentication required.
- Respect rate limits — the CLI backs off on 429/5xx and returns `null` on 404.
- Keyword matching is literal/tag-based; recall varies widely by term.
