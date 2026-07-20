# facebook-search — sources & parsing reference

Unlike the other portal skills, `facebook-search` has **no live data source**. This
file documents why, and records the URL shapes and parsing anchors a future
maintainer needs.

## Why there is no fetch endpoint

Facebook was investigated as a portal on 2026-07-20. It cannot support the
zero-dependency SSR/API pattern the other portals use:

- **Groups** (where most VN recruitment posts live): fully login-walled. No public
  read API since Meta deprecated the Groups API for non-admins.
- **Pages**: only reachable via the official **Graph API** (Page Public Content
  Access), which requires a Meta app + App Review, and does not cover Groups.
- **Facebook Jobs** (the native job-posting product): shut down globally in 2023.
- **Anti-bot**: checkpoints, behavioral rate-limiting, JS challenges, frequent DOM
  changes. Automating a logged-in session violates ToS and risks account bans.

Conclusion: a fetch-based CLI would violate Facebook's ToS, be legally gray, risk
the user's account, and be extremely brittle. The skill is therefore **zero-network**:
it builds browse URLs and parses manually-pasted posts.

## `links` — Facebook search URL shapes (built, never fetched)

| Type | URL template |
|------|--------------|
| `posts` | `https://www.facebook.com/search/posts/?q=<url-encoded query>` |
| `top` | `https://www.facebook.com/search/top/?q=<url-encoded query>` |
| `groups-discover` | `https://www.facebook.com/search/groups/?q=<url-encoded "<query> tuyển dụng">` |
| `group` | `https://www.facebook.com/groups/<GROUP_ID>/search/?q=<url-encoded query>` (one per entry in `groups.json`) |

`<query>` = `--query` plus `--location` joined by a space, URL-encoded.

## `groups.json`

`{ "groups": [ { "id": "<numeric group id>", "name": "<label>" }, ... ] }`. Starts
empty. The numeric id comes from the group URL (`facebook.com/groups/<ID>/`); for
vanity-URL groups, read the id from a post permalink or page source. Only used to
build `group`-type browse URLs.

## Inbox parsing anchors (`helpers.ts` → `parsePost`)

Posts are pasted as `.txt`/`.md` into `inbox/`. Heuristics over Vietnamese
free-text (all best-effort; update these when common post formats drift):

| Field | Heuristic |
|-------|-----------|
| `title` | line after a cue (`tuyển dụng`/`vị trí`/`position`/`hiring`/…) containing a role keyword, else first line with a role keyword, else first line. Role keywords in `ROLE_RE`. |
| `company` | line matching `Công ty/Cty/Company [:-] <name>` (cut at `tuyển`/`cần`/… and decoration), else an `@Name` mention. |
| `location` | accent-insensitive city match (Hà Nội, Hồ Chí Minh, Đà Nẵng, Bắc Ninh, Hưng Yên, Hải Phòng, Cần Thơ) + `remote`/`WFH`/`từ xa`. |
| `salary` | a line mentioning `lương`/`salary`/`thu nhập` with a money phrase (`triệu`/`tr`/`M`/`k`/`$`/`USD`/`VND`) or `thoả thuận`/`negotiable`; else first money phrase anywhere. |
| `date` | `Hạn nộp`/`deadline`/`hạn` + `dd/mm[/yyyy]`. |
| `url` | first `facebook.com` URL, else first http(s) URL. |
| `id` | `fb-<postid>` from the URL if present (`/groups/<g>/posts/<id>`, `/posts/<id>`, `permalink/<id>`, `story_fbid=<id>`, `fbid=<id>`), else FNV-1a hash of company+title+first 120 chars → `fb-<base36>`. |
| `tags` | word-boundary match against `TAG_KEYWORDS` (Go, Golang, Java, React, Node, Kafka, Docker, K8s, …). |

## Contract compatibility

Honors the portal-skill contract so `/scrape` treats it like any other portal:
`search` returns `{ meta: { count, page }, results: [...] }` with `id`/`title`/
`company`/`location`/`date`/`url` (plus `salary`/`tags`/`source`); `detail <id>`
returns one post; errors go to stderr as `{ error, code }` with exit 1. Extra
commands: `links` (URL generation) and `parse` (single-file). `--jobage` is a
documented no-op.
