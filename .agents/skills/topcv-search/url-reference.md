# TopCV URL & Markup Reference

Maintenance doc for the `topcv-search` skill. TopCV (topcv.vn) serves
server-rendered HTML. `robots.txt` allows the search and job-detail paths (only
CV/account paths like `/xem-cv/`, `/viet-cv/`, `/private/`, `/p/` are disallowed).
No authentication, no Cloudflare challenge.

> **Fetch via `curl`, not native `fetch`.** TopCV's WAF fingerprints the TLS/HTTP
> client: Bun/undici's `fetch` gets **403 on every path** (even the homepage, even
> with a full browser header set and a curl User-Agent), while `curl` from the same
> machine/IP gets 200. `htmlFetch` therefore shells out to `curl` (via `Bun.spawn`)
> with a browser `User-Agent` and `Accept-Language: vi,en;q=0.9`, and falls back to
> native `fetch` only if curl can't be spawned. This is a TLS-fingerprint block, not
> an IP or header block — adding headers to `fetch` does not help.

> If parsing breaks, TopCV has changed its markup — re-derive the selectors below
> from a fresh page fetch:
> `curl -sSL -A "<UA>" -H "Accept-Language: vi,en;q=0.9" "https://www.topcv.vn/tim-viec-lam-backend" -o out.html`

## Search URLs

```
https://www.topcv.vn/tim-viec-lam-<keyword>                          # keyword search
https://www.topcv.vn/tim-viec-lam-<keyword>-tai-<city-slug>-kl<id>   # keyword + city
```

- **Keyword**: multi-word input is hyphenated (`backend developer` → `backend-developer`). The CLI does this in `hyphenate()`. With no query the CLI defaults the keyword to `it`.
- **City** (`--location`/`-l`): encoded in the slug as `-tai-<city-slug>-kl<id>`. This is the **only** form that filters server-side — the `?city_id=`/`?locations=` query params are **silently ignored** (verified live: they return the same unfiltered result set). The `<id>` is a TopCV city id; the CLI maps 68 provinces in `CITY_MAP`. Verified ids: `ha-noi`=1, `ho-chi-minh`=2, `binh-duong`=3, `bac-ninh`=4, `da-nang`=8, `hai-phong`=9. Unknown `--location` values are filtered client-side on the card's `.city-text`.
- **Pagination**: `?page=<n>` (1-indexed), combines with the city slug (`…-kl1?page=2`). ~50 cards per page.
- **Posting age**: no reliable query param (only `sba=1` appears, unrelated). `--jobage` is applied **client-side** by parsing each card's "Đăng … trước" freshness into approximate days.

## Search page — `.job-item-search-result` cards

Each job renders as a `<div class="job-item-search-result …" data-job-id="…">`.
Chunk the page by splitting on the container class so each chunk holds exactly one
card, then parse independently:

```
html.split(/class="job-item-search-result/).slice(1)
```

### Final selectors (per card chunk)

| Field | Selector / rule |
|-------|-----------------|
| `id` | `data-job-id="(\d+)"` — the authoritative per-card id (matches the detail-link id) |
| `url` | first `href="(https://www.topcv.vn/(?:brand\|viec-lam)/[^"]+?\.html)"` — the detail link; tracking `?…` query is dropped |
| `title` | `<h3 class="title …">` inner, with the `<div class="box-label-top">…</div>` badge block removed, then tag-stripped (the title is a tooltip `<span>`); fallback = the avatar anchor's `aria-label` |
| `company` | `<span class="company-name" … title="COMPANY">` (attr, or text) |
| `companyUrl` | the wrapping `<a class="company …" href="/cong-ty/…" or "/brand/…">` (query stripped) |
| `location` | `<span class="city-text">CITY</span>` (e.g. `Hà Nội`, `Hồ Chí Minh (mới)`, `Hà Nội, Hồ Chí Minh`) |
| `salary` | `<label class="salary"><span>SALARY</span>` (e.g. `Thoả thuận`, `20 - 30 triệu`) |
| `date` | `<label class="… label-update …">` inner → `Đăng <X> trước` (the per-job *posted* freshness; NOT the `title="Cập nhật …"` bulk-refresh attr, which is mostly identical across a page) |

There are ~50 cards per page. Both detail-link shapes appear among the cards.

## Detail URLs

```
https://www.topcv.vn/viec-lam/<slug>/<ID>.html                       # id-based shape
https://www.topcv.vn/brand/<company>/tuyen-dung/<slug>-j<ID>.html     # branded/employer shape
```

- **Job id** = the digits after `-j` (brand shape) or the trailing `/<ID>.html` (viec-lam shape). Captured by `idFromUrl()`.
- **Both shapes render identical detail markup** — the same parser handles both.
- **Bare-id reconstruction works**: `https://www.topcv.vn/viec-lam/j/<ID>.html` (any slug segment, even a placeholder) resolves to the correct job by its trailing id — verified live, the canonical `<link>` points back to the real URL. So `detail <id>` reconstructs this URL. If the id no longer maps to a live posting the reconstructed page carries no job sections → `NEED_URL`.

### Detail selectors

| Field | Selector / rule |
|-------|-----------------|
| `title` | `<h1 class="box-header-job__title">` inner, **cut at** `<span class="icon-verified-employer…>` (the verified-employer badge otherwise leaks a tooltip into the title); fallback = the `<title>` tag (`Tuyển <JOB> làm việc tại …`) |
| `company` | first `/cong-ty/…` or `/brand/…` anchor with real text (skip Vue `{{ … }}` templates and the `Xem trang công ty` / `Tuyển dụng` call-to-action links) |
| `salary` | `class="box-header-job__salary">SALARY` |
| `location` | the `.box-header-job-list-info__item` whose text starts with `Địa điểm` |
| `deadline` | the `.box-header-job-list-info__item` whose text starts with `Hạn ứng tuyển` (e.g. `08/08/2026`) |
| `description` | zone from the `Mô tả công việc` section heading to the next section heading, block-formatted |
| `requirements` | zone from the `Yêu cầu ứng viên` section heading, block-formatted |
| `benefits` | zone from the `Quyền lợi ứng viên` (or `Quyền lợi`) section heading, block-formatted |

Section headings live in `<h2 class="box-job-information-detail-item__title--title">`.
The page also has non-content sections (`Tổng quan`, `Địa điểm và thời gian`,
`Việc làm liên quan`, `Thông tin chung`) that have no `__text` body — extraction is
**zone-based between headings** (not per `__text` block) so a heading with no body
(e.g. `Tổng quan`) does not shift the pairing.

## Etiquette

Personal use. `robots.txt` permits the search/detail paths, but TopCV is large and
may rate-limit — keep volume low and polite. Under rapid back-to-back requests the
WAF returns a **transient 403** (the same URL returns 200 when spaced out), so the
CLI backs off on **403**/429/5xx with exponential backoff + jitter (max 6 retries)
and treats 404 as empty.
