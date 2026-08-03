# Devwork — endpoint and parsing reference

Recorded 2026-08-04 against live pages. Update this file when Devwork changes its
markup.

Base: `https://devwork.vn`

## Access

- `robots.txt`: `User-agent: *` with no site-wide `Disallow`. No AI-agent or
  crawler prohibitions. No login wall on listings or descriptions.
- Plain `fetch` with a browser User-Agent works — no Cloudflare challenge.
- Nuxt/Vue app, but listings and descriptions are server-rendered into the initial
  HTML, so no JS execution is needed. Markup carries `data-v-<hash>` scoped-style
  attributes; **do not anchor regexes on those hashes**, they change on every
  frontend build.

## Search / browse

```
/viec-lam                    all current listings
/viec-lam/<tag>              one technology tag
/viec-lam/<tag>?page=<n>     pagination
```

20 listings per page. `?page=` is the only working pagination form —
`/viec-lam/<tag>/trang-2` 404s.

Tags are a **fixed vocabulary**, not free text. An unknown slug renders an empty
listing page (HTTP 200, zero cards), it does not 404 — so a typo is
indistinguishable from "no openings" unless you check the tag.

Known-good tags: `golang`, `java`, `javascript`, `nodejs`, `reactjs`, `vuejs`,
`angular`, `php`, `laravel`, `python`, `ruby`, `dotnet`, `android`, `ios`,
`flutter`, `devops`, `tester`, `business-analyst`.

`?keyword=<text>` on `/viec-lam` exists but returns an inconsistent subset; the
tag paths are the reliable interface.

Volumes observed 2026-08-04: `golang` 5 · `java` 22.

## Listing card parsing anchors

```html
<a href="/viec-lam/13972/software-engineer-salary-up-to-dollar3000">
  <div class="listing-body application border-yellow">
    <div class="listing-logo">…<img alt="<COMPANY>" …></div>
    <div class="listing-title">
      <h4>Software Engineer [Salary up to $3000]</h4>
      <ul class="listing-icons listing-icons-skills">
        <li class="salaryVip"><i class="icon-dollar"></i><span class="text-red">50-70 triệu</span></li>
        <li class="location"><i class="icon-map"></i> Hà Nội</li>
      </ul>
      <div class="skillVip"><a href="/viec-lam/golang">Golang</a>…</div>
```

| Field | Anchor |
|-------|--------|
| Split marker | `<a href="/viec-lam/` followed by `<digits>/` |
| id / slug | The two path segments in that href |
| title | `<div class="listing-title">` → first `<h4>` |
| company | `<div class="listing-logo">` → `<img alt="…">` (only source) |
| salary | `<li class="salary…">` (class is `salaryVip` on promoted listings) |
| location | `<li class="location">` |
| skills | `<a href="/viec-lam/<tag>">` chips inside the card chunk |

No posting date is rendered anywhere on the card or the detail page.

## Detail

```
/viec-lam/<id>/<slug>
```

**A slug segment is required.** `/viec-lam/13758` returns the listing shell with
no job content (HTTP 200, zero `block-title` elements); `/viec-lam/13758/x`
returns the posting. The slug is not validated, so any placeholder works.
`/tuyen-dung/<id>` 404s.

No schema.org `JobPosting` JSON-LD — the page has `Organization`, `Person`,
`WebSite` and `LocalBusiness` blocks only, none of which describe the job.

### Anchors

| Field | Anchor |
|-------|--------|
| title | First `<h1>` **with non-empty text** — an empty `<h1>` precedes it in the header shell |
| salary | `<h4>Mức lương</h4>` → next `<div class="salary-amount">` |
| sections | `<h2 class="block-title">HEADING</h2><div class="block-desc">…</div>` |
| sidebar fields | `<strong>LABEL</strong> <span>VALUE</span>` |
| skills | `<a href="/viec-lam/<tag>">` chips in the ~1200 chars **before** the "Mô tả công việc" heading |

Section headings: `Mô tả công việc`, `Yêu cầu`, `Quyền lợi`.

Sidebar labels: `Kinh nghiệm` (e.g. "4 năm"), `Trình độ` ("Đại học"),
`Vị trí` ("Senior"), `Hình thức` ("Full-time"), `Hạn nộp hồ sơ` (**already ISO**,
e.g. `2026-12-31`), `Số lượng`, `Phỏng vấn`.

There is **no location row** in the sidebar — the city exists only on the listing
card, which is why `detail` returns `location: null`.

### Two traps

1. **Salary:** there are two `salary-amount` divs. The first is the referral bonus
   under `Tiền thưởng` and is usually login-gated ("Đăng nhập để xem"). Anchoring
   on the first match reports the login prompt as the salary.
2. **Skills:** `/viec-lam/<tag>` anchors also appear in the site-wide search box's
   suggestion list, which would yield a constant bogus set
   (Laravel/Java/NodeJS/ReactJS/VueJS) on every job. Scope to the segment
   preceding the description heading.
