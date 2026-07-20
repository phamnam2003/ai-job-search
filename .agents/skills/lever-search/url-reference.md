# Lever v0 postings API — endpoint reference

Reconnaissance performed 2026-07-20. This is what a future maintainer needs when
Lever changes its API or a field stops populating.

## Access terms

- `https://jobs.lever.co/robots.txt` carries Cloudflare content signals:
  `Content-Signal: search=yes, ai-train=no, use=reference`.
  Indexing and reference use are permitted; training models on the content is not.
  This skill reads and displays postings only, which stays inside those signals.
- No authentication, no API key, no login wall.
- No personal-use warning required in `SKILL.md`.

## The core constraint

**There is no global search endpoint.** Lever is an ATS: every employer gets its own
board addressed by a *company token* (the slug in `jobs.lever.co/<token>`). Any "search
Lever" feature has to be a client-side fan-out across a known list of tokens. That list
is [`companies.json`](companies.json).

## Endpoints

| Purpose | Method + URL |
|---------|--------------|
| List postings on a board | `GET https://api.lever.co/v0/postings/{token}?mode=json` |
| Single posting detail | `GET https://api.lever.co/v0/postings/{token}/{postingId}` |

### Parameters (list endpoint)

All verified working against the `amanotes` board:

| Parameter | Effect |
|-----------|--------|
| `mode=json` | Return JSON rather than rendered HTML. **Required.** |
| `limit=<n>` | Server-side cap on postings returned. |
| `skip=<n>` | Server-side offset — real pagination, unlike Greenhouse. |
| `location=<exact>` | Exact-match filter on `categories.location`. |
| `team=<exact>` | Exact-match filter on `categories.team`. |
| `commitment=<exact>` | Exact-match filter on `categories.commitment`. |
| `department=<exact>` | Exact-match filter on `categories.department`. |

**This CLI deliberately does not use `limit`/`skip` server-side.** Keyword filtering
happens client-side across the whole fan-out, so truncating server-side would drop
matches before they were ever tested. The filters are exact-match only, which is too
brittle for the substring semantics `--location` offers.

## Response structure

### List (`?mode=json`)

Returns a **bare JSON array** of postings — not an object wrapper.

Posting object keys (verified against `amanotes`):

```
additionalPlain, additional, categories, createdAt, description, descriptionPlain,
id, lists, text, country, workplaceType, opening, openingPlain, descriptionBody,
descriptionBodyPlain, hostedUrl, applyUrl
```

| Field | Maps to | Notes |
|-------|---------|-------|
| `id` | `id` (as `{token}/{id}`) | UUID. The detail endpoint still needs the token, hence the namespaced id. |
| `text` | `title` | |
| `createdAt` | `date` | **Epoch milliseconds**, not a string. Normalized to ISO 8601 on output. |
| `categories.location` | `location` | Free text (`"Ho Chi Minh City, Vietnam"`, `"Remote"`). |
| `categories.allLocations` | `allLocations` | Array; a posting can be open in several places. |
| `categories.department` / `.team` / `.commitment` | `department` / `team` / `commitment` | |
| `workplaceType` | `workplaceType` | `onsite` / `remote` / `hybrid`. |
| `hostedUrl` | `url` | `jobs.lever.co/<token>/<uuid>`. |
| `applyUrl` | `applyUrl` | |
| description fields | `description` | See below — this is the fiddly part. |

### The description is split across five fields

Lever does not have one description field. It has:

- `openingPlain` — the intro paragraph
- `descriptionPlain` — usually repeats the opening
- `descriptionBodyPlain` — the body
- `lists[]` — an array of `{ text: heading, content: HTML list }` sections
- `additionalPlain` — trailing notes

**Different boards leave different fields empty.** On `amanotes`, `descriptionPlain` is
an empty string and the real text lives in `openingPlain` plus `lists[]`. Reading only
`descriptionPlain` would return nothing for that board.

`composeDescription()` in `cli/src/helpers.ts` assembles whatever is present in reading
order (opening → body → lists → additional) and de-duplicates `descriptionPlain` when it
merely repeats `openingPlain`. The `lists[].content` values are HTML and get stripped.

## Quirks worth remembering

1. **An unknown token returns HTTP 200, not 404.** The body is `{"ok":false,"error":"Document not found"}`. Detecting a bad token means checking that the response is an array — a status check alone will silently treat it as success.
2. **A real board with no open roles returns `[]`.** Distinct from the above; not an error.
3. **`createdAt` is epoch milliseconds.** Passing it straight into `Date.parse` gives nonsense.
4. **`leverdemo` is Lever's demo board.** It returns ~388 fake postings and will pollute any result set. Excluded from `companies.json` on purpose.
5. **Board tokens are not guessable.** `sonarsource` not `sonar`, `coins` not `coinsph`. Verify before adding.
6. **Coverage skews to gaming, crypto, and SEA logistics.** Lever's public API has noticeably fewer infra/Go employers than Ashby does.

## Verifying a new board token

```bash
curl -s 'https://api.lever.co/v0/postings/<token>?mode=json&limit=1' | head -c 300
```

A `200` with a non-empty JSON **array** means the token is good.
`{"ok":false,...}` means it is not.
