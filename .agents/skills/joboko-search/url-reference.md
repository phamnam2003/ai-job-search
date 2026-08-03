# Joboko — endpoint and parsing reference

Recorded 2026-08-04 against live pages. Update when Joboko changes its markup.

Base: `https://vn.joboko.com`

## Access

- `robots.txt`: blocks a list of SEO/commercial crawlers (`BUbiNG`, `MJ12bot`,
  `dotbot`, `Sosospider`, `sitebot`, `LinkedInBot`, `linkdexbot`, `AhrefsBot`,
  `Yandex`, `MauiBot`, `BLEXBot`, `SemrushBot`). No AI-agent prohibition, no
  site-wide `Disallow` for `User-agent: *`.
- Plain `fetch` with a browser User-Agent works. No Cloudflare challenge.
- Server-rendered HTML; no JS execution required.

## Search

```
/tim-viec-lam-<keyword-slug>                  keyword
/tim-viec-lam-<keyword-slug>-tai-<city-slug>  keyword + city
?p=<n>                                        pagination
```

20 listings per page.

### Two traps

1. **Pagination is `?p=`, not `?page=`.** `?page=2` returns HTTP 200 with
   *page 1 content* — a silent no-op. Verified: `?p=2` changes the first
   `data-jid` (6610939 → 6607326); `?page=2` and `?page=3` do not.
   `/tim-viec-lam-<slug>/2`, `-p2` and `-trang-2` all 404.
2. **Keyword slugs are pre-generated.** Arbitrary text 404s.

| Slug | Status (2026-08-04) |
|------|---------------------|
| `backend-developer` | 200, 2,137 total |
| `lap-trinh-vien` | 200 |
| `developer` | 200 |
| `frontend-developer` | 200 |
| `golang` | **404** |
| `nodejs` | **404** |
| `lap-trinh-vien-backend` | **404** |
| `it-phan-mem` | **404** |

City slugs seen in the site's own filter links: `ha-noi`, `ho-chi-minh`,
`da-nang`, plus others in the same `-tai-<city>` form.

## Listing card parsing anchors

```html
<div class="item item-up" data-jid="6610939" data-cid="760438" …>
  <div class="item-head">
    <h2 class="item-title"><a href="/viec-lam-lap-trinh-vien-java-xvi6610939">Lập trình viên Java</a></h2>
  </div>
  <div class="item-wrapper">
    <div class="item-logo"><img …></div>
    <div class="item-info">
      <div class="item-company line-clamp-2"><span class="text-capitalize">CÔNG TY …</span></div>
      <div class="item-address"><span …>Hà Nội</span></div>
      <div class="item-rate"><span …>8TR-12TR</span></div>
    </div>
  </div>
  <div class="fz-13 item-text"><ul><li>…</li></ul></div>
  <div class="item-new-footer">
    <div class="item-date-v2">
      <span class="… item-date" data-value="2026-08-31T18:25:00">31/08/2026</span>
    </div>
  </div>
```

| Field | Anchor |
|-------|--------|
| Split marker | `<div class="item…" data-jid="` |
| id | `data-jid` |
| title / url | `<h2 class="item-title">` → inner `<a href>` |
| company | `<div class="item-company…">` |
| companyUrl | first `<a href="/…-xci<cid>">` in the chunk |
| location | `<div class="item-address">` |
| salary | `<div class="item-rate">` |
| snippet | `<div class="…item-text">` |
| deadline | `<span … item-date" data-value="<ISO timestamp>">` |

**The `item-date` element is the application deadline, not the posting date**,
despite the class name. `data-value` is already an ISO timestamp — prefer it over
the DD/MM/YYYY text node. The posting date exists only on the detail page.

## Detail

```
/viec-lam-<slug>-xvi<ID>
```

The slug is part of the route — there is **no bare-ID form**, unlike most portals.
The CLI rejects a bare numeric ID rather than fetching a wrong page.

### Preferred source: JSON-LD

Exactly one `ld+json` block, `@type: JobPosting`, with:
`title`, `description`, `datePosted`, `validThrough`, `employmentType`,
`hiringOrganization`, `identifier`, `baseSalary`, `jobLocation`, `industry`.

(Unlike CareerViet, there is only one block here, but still select by `@type`
rather than taking the first.)

### Expired postings

Joboko does **not** remove closed listings. A posting fetched in testing had been
closed since 2023 and still rendered as a normal page. The detail page carries a
"hết hạn nộp hồ sơ" banner; the parser matches that (diacritic-tolerant) and
exposes it as `expired: boolean`.

`employmentType` from JSON-LD comes through as the schema.org enum (`FULL_TIME`),
not a human-readable Vietnamese string.
