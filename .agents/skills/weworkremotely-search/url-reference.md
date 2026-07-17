# We Work Remotely RSS URL Reference

Public, unauthenticated **RSS 2.0** category feeds on `weworkremotely.com` used by this skill.
This is the maintenance doc — if We Work Remotely changes its feed markup, update the tag names
and the field map here.

> Personal use only — keep volume low. The feeds returned HTTP 200 with a normal browser
> `User-Agent`. Individual job **pages** (`/remote-jobs/<slug>`) are Cloudflare-fronted and return
> **403 ("Just a moment…")** to automated fetches, so `detail` reads the description from the feeds.

## Request headers

| Header | Value |
|--------|-------|
| `User-Agent` | A normal desktop Chrome UA string (required — a bare/default UA can be blocked) |
| `Accept` | `application/rss+xml,application/xml,text/xml,*/*` |

## Category feeds

```
GET https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss
GET https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss
GET https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss
GET https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss     (optional)
```

| `--category` key | Aliases | Feed |
|------------------|---------|------|
| `backend` | `back-end`, `be` | `remote-back-end-programming-jobs.rss` |
| `fullstack` | `full-stack`, `fs`, `full` | `remote-full-stack-programming-jobs.rss` |
| `frontend` | `front-end`, `fe` | `remote-front-end-programming-jobs.rss` |
| `devops` | `sysadmin`, `ops` | `remote-devops-sysadmin-jobs.rss` |
| `all` | — | all four of the above |

Default when `--category` is omitted: `backend,fullstack,frontend` (the programming feeds).
Feeds are fetched in parallel, merged, sorted newest-first by `<pubDate>`, and **de-duplicated by
job slug**. Each feed carries the latest ~10–40 active postings for its category.

## Feed / item structure

```xml
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss">
  <channel>
    <title>We Work Remotely: Back-End Programming Jobs</title>
    <link>https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss</link>
    <item>
      <media:content url="https://wwr-pro.s3.amazonaws.com/logos/0084/0935/logo.gif" type="image/png"/>
      <title>Proxify AB: Senior Java Backend Developer</title>   <!-- "Company: Role" -->
      <region>Anywhere in the World</region>                     <!-- or a country / US state; may be empty -->
      <country></country>
      <state>Stockholm</state>
      <skills>Java and Back-End Dev</skills>
      <category>Back-End Programming</category>
      <type>Full-Time</type>
      <description>&lt;p&gt;...XML-escaped HTML job body...&lt;/p&gt;</description>
      <pubDate>Mon, 13 Jul 2026 13:41:15 +0000</pubDate>         <!-- RFC-822 -->
      <expires_at>Wed, 12 Aug 2026 13:41:15 +0000</expires_at>
      <guid>https://weworkremotely.com/remote-jobs/proxify-ab-senior-java-backend-developer</guid>
      <link>https://weworkremotely.com/remote-jobs/proxify-ab-senior-java-backend-developer</link>
    </item>
    ...
  </channel>
</rss>
```

Parsing: split the XML on `<item>`, truncate each chunk at `</item>`, and read each block
independently with per-tag regex (no XML library). A block with no `<link>`/`<guid>` is skipped.

## Field mapping (item → result)

| Result field | Source | Notes |
|--------------|--------|-------|
| `id` | last path segment of `<link>` (or `<guid>`) | the job **slug**, e.g. `proxify-ab-senior-java-backend-developer` |
| `title` | `<title>` after the first `": "` | split `"Company: Role"` on the **first** `": "` |
| `company` | `<title>` before the first `": "` | `null` if the title has no `": "` |
| `location` | `<region>` text, else `"Remote"` | empty `<region>` → `"Remote"` |
| `date` | `<pubDate>` | RFC-822; used by `--jobage` |
| `url` | `<link>` | falls back to `<guid>` |
| `type` (extra) | `<type>` | Full-Time / Contract / … |
| `category` (extra) | `<category>` | e.g. `Back-End Programming` |
| `skills` (extra) | `<skills>` | free-text skills string |
| `logo` (extra) | `<media:content url="…">` | company logo image URL |
| *(internal)* | `<description>` | XML-escaped HTML; kept for `-q` filtering and for `detail` |

## `<description>` decoding

The `<description>` is **HTML that has been XML-escaped**, so it is effectively double-encoded:
a non-breaking space appears as `&amp;nbsp;` and a literal ampersand as `&amp;amp;`. Recovering
readable text is therefore two passes:

1. Decode XML entities once → real HTML (`&lt;p&gt;` → `<p>`, `&amp;nbsp;` → `&nbsp;`).
2. Convert HTML to text: `<br>`/`</p>`/`</li>`/… → line breaks (list items get a `•` bullet),
   strip remaining tags, and decode the inner HTML entities (`&nbsp;` → space, `&amp;` → `&`).

## Detail

```
GET https://weworkremotely.com/remote-jobs/<slug>
```

The `<slug>` is extracted from a bare slug, a `remote-jobs/<slug>` path, or a full
`weworkremotely.com` URL (last path segment, minus query/hash). The page is Cloudflare-protected
(**403** for automated clients), so `detail`:

1. attempts the page (returns empty on 403/404), then
2. fetches the category feeds and finds the item whose slug matches, using its full
   `<description>` (decoded as above) plus title/company/location/date/type/skills.

If the slug isn't in the default feeds, `--category all` widens the search (it may be a DevOps
posting or may have expired out of the feed).

## Notes

- No authentication required. A browser `User-Agent` is required for the feeds.
- Respect rate limits — the CLI backs off on 429/5xx and returns empty on 403/404.
- Feeds only contain **currently active** postings, so an old slug may 404/expire.
