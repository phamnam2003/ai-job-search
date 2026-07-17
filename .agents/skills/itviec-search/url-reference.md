# ITviec URL & Markup Reference

Maintenance doc for the `itviec-search` skill. ITviec (itviec.com) serves
server-rendered HTML (Rails + Stimulus). `robots.txt` allows crawling (only
`/subscriptions/new` is disallowed). No authentication, no Cloudflare challenge.
Fetch with a browser `User-Agent` and `Accept-Language: vi,en;q=0.9`.

> If parsing breaks, ITviec has changed its markup — re-derive the selectors below
> from a fresh page fetch (`curl -sSL -A "<UA>" "https://itviec.com/it-jobs/golang" -o out.html`).

## Search URLs

```
https://itviec.com/it-jobs                          # browse all
https://itviec.com/it-jobs/<keyword>                # e.g. /it-jobs/golang
https://itviec.com/it-jobs/<keyword>/<city>         # e.g. /it-jobs/backend-developer/ha-noi
https://itviec.com/it-jobs/<city>                   # city browse (no keyword)
```

- **Keyword**: multi-word input is hyphenated (`backend developer` → `backend-developer`). The CLI does this in `hyphenate()`.
- **City** (`--location`/`-l`): a path segment. Verified slugs: `ha-noi`, `ho-chi-minh`, `da-nang`.
- **Pagination**: `?page=<n>` (1-indexed). ~20 cards per page.
- **Posting age**: no reliable query param exists (ITviec has only "lab" freshness experiments). `--jobage` is accepted but **not applied**.
- **Salary**: usually gated behind sign-in for anonymous requests.

## Structure 1 — Authoritative ItemList (ld+json)

Each search page has a `<script type='application/ld+json'>` block of `@type: "ItemList"`
(note: script tags use **single quotes**). Its `itemListElement` is ~20 `ListItem`s:

```json
{ "@context":"https://schema.org/", "@type":"ItemList",
  "itemListElement":[
    { "@type":"ListItem", "position":1,
      "url":"https://itviec.com/it-jobs/senior-backend-engineer-golang-...-masan-group-5734" } ] }
```

- Parsed by `parseItemList()` — the reliable id/url list, used as a fallback if card parsing yields nothing.
- **Job id** = trailing number of the slug: `/-(\d+)$/`. Ids can have **leading zeros** (e.g. `0422`, `0004`) so keep them as strings.

## Structure 2 — Rich `.job-card` markup

Each job renders as a `.job-card` div. Chunk the page by splitting on the per-card
attribute so each chunk holds exactly one card, then parse independently:

```
html.split(/data-search--job-selection-job-slug-value=/).slice(1)
```

Card opening tag (attribute order in the live HTML):

```html
<div class='job-card ...' data-controller='search--job-selection'
     data-job-key='<uuid>'
     data-search--job-selection-job-slug-value='<slug>-<id>'
     data-search--job-selection-job-url-value='/it-jobs/<slug>/content?...'>
```

### Final selectors (per card chunk)

| Field | Selector / rule |
|-------|-----------------|
| `slug` | Chunk starts with the quoted value: `^\s*['"]([^'"]+)['"]` |
| `id` | `slug.match(/-(\d+)$/)` — trailing digits, kept as string |
| `url` | `https://itviec.com/it-jobs/<slug>` |
| `title` | `<h3 ... data-search--job-selection-target='jobTitle' ...>TITLE</h3>` |
| `company` | first `<a href='/companies/<slug>'>TEXT</a>` with non-empty text (the logo anchor to the same href wraps only an image → cleans to empty and is skipped) |
| `companyUrl` | `https://itviec.com` + that `/companies/<slug>` href (query stripped) |
| `location` | after the map-pin icon: `#map-pin[\s\S]*?<div ... title='LOCATION'>` — captures multi-city strings like `Ho Chi Minh - Ha Noi` |
| `date` | `>\s*Posted\b(...)</span>` → `"Posted X ago"` |
| `salary` | `class='... salary ...'>(...)</div>` — `null` if it contains `sign-in-view-salary`, else the cleaned text |
| `skills` | all `<a ... href='/it-jobs/<skill>?click_source=Skill+tag'>SKILL</a>` |
| `workingModel`* | `<div class='text-rich-grey flex-shrink-0'>At office\|Remote\|Hybrid</div>` (in card; exposed on the detail page) |

\* Working model is surfaced on the detail output; the search card also carries it near the location.

## Detail URLs

```
https://itviec.com/it-jobs/<slug>                   # full public page (~340 KB, related-jobs noise)
https://itviec.com/it-jobs/<slug>/content           # lightweight partial (~18 KB, clean JD) ← used
```

The CLI uses the **`/content`** partial. A **bare id does not resolve**:
`/it-jobs/4853` → 404; `/it-jobs/4853/content` and `/it-jobs/<wrong-slug>-4853/content`
return HTTP 200 but an **"Oops! This page has found a better job."** fallback (no job
sections). Hence `detail` requires the full slug/url and guards on the presence of a
`job-description`/`job-experiences` section (returns `NOT_FOUND` otherwise).

### Detail selectors (`/content` partial)

Sections (all siblings, in order):
`preview-job-overview` · `reasons-join-us` · `job-description` · `job-experiences` · `job-why-love-working` · `company-infos`.

| Field | Selector / rule |
|-------|-----------------|
| `title` | first `<h2>...</h2>` on the page |
| `company` | `<h2>` inside `<section class='company-infos'>`; fallback = first `/companies/` anchor text |
| `location` | first `<span class='small-text text-rich-grey'>` in `preview-job-overview` (full address) |
| `workingModel` | `<span class='small-text text-rich-grey ms-1'>` in the overview (e.g. `At office`) |
| `date` | overview span matching `([^<]*\bago)` (e.g. `2 days ago`) |
| `skills` | same `?click_source=Skill+tag` anchors as the card |
| `description` | slice from `<section class='reasons-join-us'>` (or `job-description`) up to `<section class='company-infos'>`, then block-format: `<li>`→bullet, `<p>/<h2>/<ul>`→newline. Note the "Top 3 reasons" bullets are a `<ul>` **sibling** of the (heading-only) `reasons-join-us` section, so a span (not per-section) extraction is required. |

## Etiquette

Personal use. `robots.txt` permits crawling, but keep volume low and polite — the CLI
backs off on 429/5xx with exponential backoff + jitter (max 6 retries) and treats 404 as empty.
