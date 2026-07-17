# VietnamDevs URL & Markup Reference

Maintenance doc for the `vietnamdevs-search` skill. VietnamDevs (vietnamdevs.com) serves
server-rendered HTML (Laravel + Tailwind). `robots.txt` allows `/jobs` (only
`/google/login`, `/google/callback`, `/newsletter/` are disallowed). No authentication, no
Cloudflare challenge, no SPA. Fetch with a browser `User-Agent`; the site is UTF-8 (the
`·` separator is U+00B7 and en/em dashes decode cleanly).

> If parsing breaks, VietnamDevs has changed its markup — re-derive the selectors below
> from a fresh page fetch (`curl -sSL -A "<UA>" "https://vietnamdevs.com/jobs/golang" -o out.html`).

## Search URLs

```
https://vietnamdevs.com/jobs                       # browse all (~60 cards/page)
https://vietnamdevs.com/jobs/<keyword>             # e.g. /jobs/golang, /jobs/back-end
https://vietnamdevs.com/jobs/<keyword>/<city>      # e.g. /jobs/golang/ha-noi
https://vietnamdevs.com/jobs/<city>                # city browse, e.g. /jobs/ha-noi
```

- **No free-text search.** There is no search `<input>`, no `?q=`/`?search=` param, and no `/api/` XHR endpoint. Search is entirely **category-path** based over a fixed taxonomy.
- **Keyword** (`--query`/`-q`): a single path segment from the fixed taxonomy (verified live):
  `back-end`, `front-end`, `full-stack`, `sre-devops`, `mobile-engineer`, `project-manager`,
  `qa-qc`, `data-engineer`, `nodejs`, `php`, `python`, `golang`, `java`, `reactjs`, `vuejs`,
  `machine-learning`. An off-taxonomy slug (e.g. `backend`) returns **HTTP 404** → the CLI
  treats it as empty results. Multi-word input is hyphenated by `hyphenate()`.
- **City** (`--location`/`-l`): a second path segment. Verified slugs: `ha-noi`, `ho-chi-minh`,
  `da-nang`. `/jobs/<keyword>/<city>` genuinely narrows results (e.g. `back-end` 25 → `back-end/ha-noi` 5).
- **Remote**: **not** a URL path. `/jobs/remote` returns HTTP 200 with zero cards, and
  `/jobs/<keyword>/remote` returns **404**. Remote roles are marked by an orange
  "Remote working" card label instead, so `--location remote` is applied as a **client-side
  filter** on `workingModel === "Remote"` (see `search.ts`), not added to the URL.
- **Pagination**: `?page=<n>` (1-indexed), e.g. `/jobs?page=2`. Only appended when `n > 1`.
- **Posting age**: no query param. `--jobage` is a **best-effort client-side filter** that
  parses each card's relative-age label (`relativeAgeToDays`).

## Search card markup

Each job renders as a `.card-hoverable` div. Chunk the page by splitting on the class token
so each chunk holds exactly one card, then parse independently; a chunk with no job-detail
link (e.g. a "Follow us on LinkedIn" promo card) is skipped:

```
html.split("card-hoverable").slice(1)
```

Card shape (abridged live markup):

```html
<div class="card-hoverable ... grid grid-cols-12 ...">
  <div class="col-span-12 md:col-span-11 flex items-start gap-3">
    <div class="shrink-0">
      <img src="...cloudinary..." alt="Binance&#039;s logo" loading="lazy" class="size-12 ...">
    </div>
    <div class="flex flex-col ...">
      <div>
        <h2>
          <a class="... line-clamp-1" href="https://vietnamdevs.com/jobs/941517759796229/senior-frontend-developer-ai" rel="noopener noreferrer">
            <span class="absolute inset-0"></span>
            Senior Frontend Developer (AI)
          </a>
        </h2>
        <p class="font-source-sans ... text-gray-500">Ho Chi Minh City · Full-time</p>
      </div>
    </div>
  </div>
  <div class="hidden md:block md:col-span-1 text-sm text-right text-gray-500"><p>3d</p></div>
  <div class="col-span-12 mt-2 md:mt-4">
    <ul class="list-none ...">
      <li class="orange-label">Remote working</li>
      <li class="green-label">$3k - $4k/month</li>
      <li class="gray-label">JavaScript</li> ...
    </ul>
  </div>
</div>
```

### Final selectors (per card chunk)

| Field | Selector / rule |
|-------|-----------------|
| `url` | `href="https://vietnamdevs.com/jobs/<id>/<slug>"` (the detail anchor) |
| `id` | the numeric first path segment after `/jobs/` — a large integer, kept as a **string** |
| `title` | text of the `<a>` whose `href` is that detail URL (the inner `<span class="absolute inset-0">` cleans away) |
| `company` | logo `<img ... alt="<Company>&#039;s logo">` → decode entities, strip a trailing `'s logo` / ` logo` (`companyFromAlt`) |
| `location` | first `<p class="... text-gray-500">…</p>`, text before the `·` (U+00B7) |
| `employmentType` | same `<p>`, text after the `·` (e.g. `Full-time`) |
| `date` | `<div class="... text-right text-gray-500"><p>AGE</p>` — relative age (`3d`, `1w`, `1mo`, `2mos`) |
| `workingModel` | `<li class="orange-label">Remote working</li>` → `"Remote"`; `<li class="yellow-label">Hybrid working</li>` → `"Hybrid"`; else `null` |
| `salary` | `<li class="green-label">…</li>` (e.g. `$3k - $4k/month`); usually absent → `null` |
| `tags` | all `<li class="gray-label">…</li>` (skills + seniority) |

## Detail URLs

```
https://vietnamdevs.com/jobs/<id>/<slug>           # full public page (~90 KB)
https://vietnamdevs.com/jobs/<id>                  # HTTP 404 (id alone does NOT resolve)
https://vietnamdevs.com/jobs/<id>/<any-slug>       # HTTP 200 → 301-redirects to canonical <slug>
```

Key quirk: **the slug is not required.** `/jobs/<id>/<anything>` redirects to the canonical
`/jobs/<id>/<real-slug>`, so `detail` can resolve from a **bare numeric id** by appending a
dummy slug (`resolveDetailTarget` builds `/jobs/<id>/job`). An invalid id 404s → the CLI
returns `NOT_FOUND`.

### Detail selectors

Metadata comes from the **`JobPosting` ld+json** block (reliable, structured); the
human-readable description comes from the rendered **`.typography`** block.

```html
<script type="application/ld+json">
{ "@type": "JobPosting", "title": "...", "description": "...",
  "hiringOrganization": { "name": "Oivan", "sameAs": "https://vietnamdevs.com/companies/oivan" },
  "jobLocation": { "address": { "addressLocality": "Ho Chi Minh City", "addressCountry": "VN" } },
  "datePosted": "2026-06-07T09:18:43.000000Z", "validThrough": "2026-08-07T...",
  "employmentType": "FULL_TIME", "url": "https://vietnamdevs.com/jobs/928767371223434/golang-developer",
  "identifier": { "@type": "PropertyValue", "value": "928767371223434" } }
</script>
<div class="typography"><h2>What we need</h2><p>…</p><h2>What you'll do</h2><ul><li><p>…</p></li></ul></div>
```

| Field | Source |
|-------|--------|
| `id` | `identifier.value` (fallback: id in `url`) |
| `title` | `title` |
| `company` / `companyUrl` | `hiringOrganization.name` / `hiringOrganization.sameAs` |
| `location` | `jobLocation.address.addressLocality` (fallback `addressRegion`, `jobLocation.name`) |
| `employmentType` | `employmentType` (`FULL_TIME` → `Full-Time`) |
| `date` | `datePosted` (ISO 8601) |
| `deadline` | `validThrough` (ISO 8601) |
| `tags` | `<li class="gray-label">…</li>` chips on the page |
| `description` | first `<div class="typography">…</div>`, block-formatted (`<h2>`/`<p>`→newlines, `<li>`→bullet). **Do not** use the ld+json `description` — it mashes section headings into the body with no separators. It is only a fallback. |

## Etiquette

Personal use. `robots.txt` permits `/jobs`, but keep volume low and polite — the CLI backs
off on 429/5xx with exponential backoff + jitter (max 6 retries) and treats 404 as empty.
