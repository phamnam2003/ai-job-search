# ITNavi URL & Markup Reference

Maintenance doc for the `itnavi-search` skill. ITNavi (itnavi.com.vn) serves
server-rendered HTML (Laravel/Blade). `robots.txt` disallows only `/admin` and
`/blog/search` — the `/job/*` and `/job-detail/*` pages used here are permitted.
No authentication, no Cloudflare challenge. Fetch with a browser `User-Agent` and
`Accept-Language: vi,en;q=0.9`.

> If parsing breaks, ITNavi has changed its markup — re-derive the selectors below
> from a fresh page fetch (`curl -sSL -A "<UA>" "https://itnavi.com.vn/job/golang" -o out.html`).

## Search URLs (path-based; ITNavi recognises the city slugs directly)

```
https://itnavi.com.vn/job                          # browse all
https://itnavi.com.vn/job/<keyword>                # e.g. /job/golang
https://itnavi.com.vn/job/<keyword>/<city>         # e.g. /job/backend/ha-noi
https://itnavi.com.vn/job/<city>                   # city browse (no keyword)
```

- **Keyword**: multi-word input is hyphenated (`backend developer` → `backend-developer`). The CLI does this in `hyphenate()`. `?keyword=<kw>` also works but the path form is canonical.
- **City** (`--location`/`-l`): a path segment. Verified slugs: `ha-noi`, `ho-chi-minh`, `da-nang`, `khac` (from the `#location` `<select>` on the search page).
- **Pagination**: `?page=<n>` (1-indexed). ~10 cards per page. (`?location=<slug>` is also accepted by the server, but the CLI uses the path form.)
- **Posting age**: no query param exists. `--jobage` is a **client-side** filter on the card's relative age label.

## Search results — the `.jsl-item` card

The results list lives in the left column. Each job is:

```html
<div class="jsl-item jsl_item " data-id="23677">
  <div class="jsl-item__logo"><img src="…" alt=""></div>
  <div class="jsl-item--right">
    <div class="jsl-item--line">
      <h2 class="jsl-item__name">Senior Backend Developer (Python)</h2>
      <a href="…/login" class="jsl-item__save"><i class="far fa-heart"></i></a>
    </div>
    <div class="jsl-item--line"><p class="jsl-item__cpn">DIGI-TEXX VIETNAM</p></div>
    <div class="jsl-item--line">
      <p class="jsl-item__location">Hồ Chí Minh</p>
      <p class="jsl-item__sm">1 d</p>
    </div>
  </div>
</div>
```

Chunk the page by splitting on the per-card `data-id=` attribute, then parse each
chunk independently:

```
html.split(/data-id=['"]/).slice(1)
```

| Field | Selector / rule |
|-------|-----------------|
| `id` | chunk starts with the quoted value: `^(\d+)` — the numeric ITNavi job id |
| `title` | `<h2 ... jsl-item__name ...>TITLE</h2>` (required; a chunk without it is skipped) |
| `company` | `<p ... jsl-item__cpn ...>COMPANY</p>` |
| `location` | `<p ... jsl-item__location ...>CITY</p>` |
| `date` | `<p ... jsl-item__sm ...>N u</p>` → relative age (e.g. `1 d`), humanized to `1 day ago` |
| `url` / `slug` / `posted` / `salary` | **not on the card** — filled by enrichment (see below) |

> **Critical:** the card has **no detail hyperlink**. Clicking a card fires an AJAX
> panel swap (`$(".jsl-item").on("click", …)` → `get-job-by-id`), it does not navigate.
> The only `/job-detail/<slug>` string on the listing page is the *share* button
> (`data-copy=…`) of the one featured job. Do not try to grep per-card links.

## Resolving a card id → detail URL: `get-job-by-id`

```
GET https://itnavi.com.vn/ajax/get-job-by-id/<id>        (Accept: application/json)
```

Returns JSON `{ "success": true, "data": { … } }`. Relevant `data` fields:

| Field | Meaning |
|-------|---------|
| `job_id` | numeric id (echoed) |
| `job_name` | title |
| `job_slug` | **the authoritative full detail URL** — `https://itnavi.com.vn/job-detail/<slug>` |
| `company_name` | company |
| `job_addresses` | location |
| `job_published_at` | absolute posted date, e.g. `Jul 16, 2026` |
| `job_salary` | e.g. `Thương lượng` (negotiable) — may be a login placeholder → treated as `null` |
| `job_content` | description HTML (`<p>`, `<ul><li>`, `<h2>`, `<br>`) |
| `skill` | array of `{ name, slug }` |

The `search` command calls this once per **emitted** result (post `--jobage`/`--limit`)
to fill `url`, `slug`, `posted`, and `salary`. An unknown id **302-redirects to the
homepage** (whose body is not JSON), so a parse failure means "not found".

> **Why enrichment is required:** the slug cannot be derived from the title. ITNavi
> transliterates Vietnamese diacritics *and* appends a random uniqueness suffix to
> some slugs (`game-developer-O8qvL`, `chuyen-vien-…-Wfo4Y`). Only `get-job-by-id`
> returns the real slug.

## Detail URLs

```
https://itnavi.com.vn/job-detail/<slug>            # standalone job page (~65–70 KB)
https://itnavi.com.vn/ajax/get-job-by-id/<id>      # JSON (used for a numeric id)
```

`detail <input>` routes by shape:
- **numeric id** → `get-job-by-id` JSON → `parseJobDetailJson` (clean, complete, includes skills + real salary).
- **slug or full URL** → fetch `/job-detail/<slug>` → `parseJobDetailHtml`. A bare id
  passed as a path (`/job-detail/24005`) redirects to the homepage and yields no job
  sections → `NOT_FOUND`.

### Standalone page selectors (`/job-detail/<slug>`)

| Field | Selector / rule |
|-------|-----------------|
| `title` | `<div … hot-jobs-content …>` → first `<h3>TITLE</h3>` |
| `company` | `<p … sub-title …>COMPANY</p>` |
| `id` | next to the qr-code icon: `fa-qrcode … <p>ID: 23677</p>` |
| `date` | first `MMM D, YYYY` string on the page (e.g. `Jul 16, 2026`) |
| `location` | `<li class="location "> … <p>CITY , CITY</p>` → duplicate comma-parts collapsed |
| `salary` | `fa-wallet … <p>…</p>` — usually the login placeholder → `null` |
| `skills` | `<div class="job-details-tags"> <a href="…/job/<skill>">NAME</a> …` |
| `description` | slice from `<div class="content-strip">` up to `<h4>Tags:` / `jobs-company-area` / `job-details-sidebar`, then block-format (`<li>`→bullet, `<p>/<h2>/<div>/<ul>`→newline) |

## Etiquette

Personal use. `robots.txt` permits these paths, but keep volume low and polite — the
CLI backs off on 429/5xx with exponential backoff + jitter (max 6 retries), treats
404 as empty, and enriches only the results it actually emits.
