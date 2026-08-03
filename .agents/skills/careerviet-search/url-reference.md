# CareerViet — endpoint and parsing reference

Recorded 2026-08-04 against live pages. This is the file to update when
CareerViet changes its markup.

Base: `https://careerviet.vn`

## Access

- `robots.txt`: no AI-agent or crawler prohibitions affecting `/viec-lam/` or
  `/vi/tim-viec-lam/`. No login wall — search and detail pages are public and
  server-rendered.
- Plain `fetch` with a browser User-Agent works. No Cloudflare challenge, no WAF
  workaround needed (unlike TopCV, JobsGO or Glints).
- The site is a Next.js app, but job cards and full descriptions are present in
  the initial HTML, not only in the RSC payload, so no JS execution is required.

## Search

Path-based. Query-string parameters (`?q=`, `?page=`) are **ignored** — they
return page 1 unchanged.

```
/viec-lam/<keyword-slug>-<loc>[-trang-<n>][-sortdv]-vi.html
```

| Segment | Meaning |
|---------|---------|
| `<keyword-slug>` | Keyword, spaces → `-`, Vietnamese chars percent-encoded |
| `k` | No location filter |
| `kl<code>` | Location filter (replaces `k`) |
| `trang-<n>` | Page n (omit for page 1) |
| `sortdv` | Sort newest first |

50 results per page.

### Verified examples

| URL | Result |
|-----|--------|
| `/viec-lam/backend-k-vi.html` | 85 total, 50 on page 1 |
| `/viec-lam/backend-kl4-vi.html` | 49 (Hà Nội only) |
| `/viec-lam/backend-k-trang-2-vi.html` | 35 (the remainder) |
| `/viec-lam/golang-k-sortdv-vi.html` | 3, newest first |
| `/viec-lam/developer-kl4-trang-3-vi.html` | location + pagination combined |

### Location codes (`kl<code>`)

| Code | City |
|------|------|
| 4 | Hà Nội |
| 6 | Hải Phòng |
| 8 | Hồ Chí Minh |
| 13 | Bình Dương |
| 17 | Cần Thơ |
| 19 | Đồng Nai |
| 20 | Đà Nẵng |
| 54 | Thừa Thiên Huế |

Codes also appear in the site's own filter links as `/viec-lam/ha-noi-l<code>-vi.html`
(note: `-l<code>-`, singular, on the browse pages — the search filter uses `-kl<code>-`).

Approximate result volumes observed 2026-08-04: `golang` 3 · `reactjs` 10 ·
`backend-developer` 16 · `nodejs` 32 · `backend` 85 · `lap-trinh` 2,213 ·
`developer` 2,363.

## Search result parsing anchors

Each card:

```html
<div class="job-item  has-badge" id="job-item-35C7E79E">
  <a class="company-name" title="<COMPANY>" href="/vi/nha-tuyen-dung/<slug>.<ID>.html">
  <a class="job_link" data-id="35C7E79E" title="<TITLE>" href="/vi/tim-viec-lam/<slug>.<ID>.html">
  <div class="salary"><p>...Lương<!-- -->: <!-- --><VALUE></p></div>
  <div class="location">...<ul><li>Hà Nội</li></ul></div>
  <div class="time">
    <li>...<span>Hạn nộp<!-- -->: </span><time>30-08-2026</time></li>
    <li>...<span>Cập nhật<!-- -->:</span> <time>31-07-2026</time></li>
  </div>
</div>
```

| Field | Anchor |
|-------|--------|
| Split marker | `<div class="job-item...` + `id="job-item-` |
| id | The `id` attribute suffix; also `data-id` on `job_link` |
| title / url | `<a class="job_link" ... title="..." href="...">` |
| company | `<a class="company-name" title="..." href="...">` |
| salary | `<div class="salary">` → strip the `Lương:` prefix |
| location | `<div class="location">` → `<li>` items, comma-joined |
| deadline | `<div class="time">` → `<li>` whose label matches `Hạn nộp` → `<time>` |
| updated | same block, label matches `Cập nhật` |

Dates print as `DD-MM-YYYY`; the CLI normalises to ISO `YYYY-MM-DD`.

**Next.js quirk:** server-rendered strings contain literal `<!-- -->` separators
between text nodes. Strip them before `stripTags`, or they leave stray whitespace
mid-word.

## Detail

```
/vi/tim-viec-lam/<slug>.<ID>.html
```

A bare ID resolves via `/vi/tim-viec-lam/j.<ID>.html` (the slug is not validated).
IDs are **alphanumeric** (`35C7FB4F`), not decimal.

### Preferred source: JSON-LD

Every detail page embeds a schema.org `JobPosting` block:

```html
<script type="application/ld+json">{"@type":"JobPosting", ...}</script>
```

Fields used: `title`, `description`, `datePosted`, `validThrough` (deadline),
`industry`, `jobBenefits`, `employmentType`, `hiringOrganization.{name,url}`,
`jobLocation.address.{addressLocality,addressRegion,streetAddress}`.

There are three `ld+json` blocks on the page (`WebSite`, `BreadcrumbList`,
`JobPosting`) — select by `@type`, do not take the first.

### HTML fallback anchors

| Field | Anchor |
|-------|--------|
| Description | `<div class="detail-row reset-bullet"><h2 class="detail-title">Mô tả Công việc</h2>` |
| Benefits | same structure, heading `Phúc lợi` |
| Labelled fields | `<strong>[<em/>]LABEL</strong><p>VALUE</p>` |

Labels seen: `Địa điểm`, `Ngày cập nhật`, `Ngành nghề`, `Hình thức`, `Lương`,
`Kinh nghiệm`, `Cấp bậc`, `Hết hạn nộp` (this one wraps the label in `<span>`).

**Important:** anchor labelled-field regexes on the `<strong>` wrapper. Searching
for the bare label text matches navigation elements earlier in the document —
`Ngành nghề` in particular will otherwise capture the site's mega-menu.
