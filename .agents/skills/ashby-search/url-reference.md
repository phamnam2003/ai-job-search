# Ashby Posting API — endpoint reference

Reconnaissance performed 2026-07-20. This is what a future maintainer needs when
Ashby changes its API or a field stops populating.

## Access terms

- **Two different hosts, two different rules.**
  - `https://jobs.ashbyhq.com/robots.txt` — `Disallow: /meeting/`, `/b/`, **`/api/`**.
    That disallow applies to `jobs.ashbyhq.com/api/`, which this skill never touches.
  - `https://api.ashbyhq.com/` — the documented Posting API host. Its `/robots.txt`
    returns `401 Unauthorized` (the host serves only the API), so there is no
    applicable crawl directive.
- The Posting API is public and documented by Ashby for employers to embed their board
  in their own careers site. No authentication, no API key, no login wall.
- No personal-use warning required in `SKILL.md`.

## The core constraint

**There is no global search endpoint.** Ashby is an ATS: every employer gets its own
board addressed by a *job-board name* (the slug in `jobs.ashbyhq.com/<name>`). Any
"search Ashby" feature has to be a client-side fan-out across a known list of boards.
That list is [`companies.json`](companies.json).

## Endpoints

| Purpose | Method + URL |
|---------|--------------|
| List all postings on a board | `GET https://api.ashbyhq.com/posting-api/job-board/{board}` |
| Same, with pay ranges | `GET https://api.ashbyhq.com/posting-api/job-board/{board}?includeCompensation=true` |

### Parameters

| Parameter | Effect |
|-----------|--------|
| `includeCompensation=true` | Adds a `compensation` object to each job. Used by `detail`. |

There are **no** query, location, pagination, or date parameters. Every filter this CLI
offers (`--query`, `--location`, `--remote`, `--jobage`, `--page`) is applied client-side
after fetch.

**There is no by-id endpoint.** The board is the only entry point, so `detail` fetches the
whole board and picks the job out of the array. Because descriptions ride along in that
same response, this is still a single request.

## Response structure

```json
{ "jobs": [ { ...job } ] }
```

Job object keys (verified against the `skymavis` board):

```
id, title, department, team, employmentType, location, secondaryLocations,
publishedAt, isListed, isRemote, workplaceType, address, jobUrl, applyUrl,
descriptionHtml, descriptionPlain
```

| Field | Maps to | Notes |
|-------|---------|-------|
| `id` | `id` (as `{board}/{id}`) | UUID. Namespaced because there is no by-id lookup. |
| `title` | `title` | May carry a leading space on some boards — trimmed. |
| `location` | `location` | Free text, **primary location only**. |
| `secondaryLocations[].location` | `secondaryLocations` | The other places the role is open. See the quirk below. |
| `publishedAt` | `date` | **Already ISO 8601** — no conversion needed, unlike Lever's epoch ms. |
| `isListed` | — | `false` means unlisted on the employer's own board; those are skipped. |
| `isRemote` | `isRemote` | Employer-set boolean, backing `--remote`. |
| `workplaceType` | `workplaceType` | `Remote` / `Onsite` / `Hybrid`. |
| `jobUrl` | `url` | `jobs.ashbyhq.com/<board>/<uuid>`. |
| `applyUrl` | `applyUrl` | |
| `descriptionPlain` | `description` | **Present in the list response** — full-text search is free. |
| `descriptionHtml` | `description` (fallback) | Used when `descriptionPlain` is empty. |

## Quirks worth remembering

1. **`secondaryLocations` is where most locations hide.** A Sky Mavis posting lists `location: "Vietnam"` and thirteen more countries in `secondaryLocations`. Filtering only on `location` silently drops matches — `locationMatches()` in `cli/src/helpers.ts` searches both.
2. **No by-id endpoint.** `detail` has to fetch the whole board. A job id that is not on the board means it was closed, not that the id was malformed — reported as `NOT_FOUND`.
3. **`isListed: false` postings exist in the response.** They are hidden on the employer's own board; this CLI skips them rather than surfacing something the employer unlisted.
4. **Descriptions come in both flavours.** `descriptionPlain` is usually populated, but fall back to stripping `descriptionHtml` — some boards leave the plain field empty.
5. **Descriptions can contain emoji.** Entity decoding must use `String.fromCodePoint`, not `fromCharCode`, or supplementary-plane characters break.
6. **Board names are not guessable.** `1password` (leading digit), `skymavis` not `sky-mavis`, `influxdata` not `influxdb`. Verify before adding.
7. **An unknown board 404s** — cleaner than Lever, which returns 200 with an error body.

## Verifying a new board name

```bash
curl -s https://api.ashbyhq.com/posting-api/job-board/<board> | head -c 300
```

A `200` with a non-empty `jobs` array means the board name is good; a `404` means it is not.
Find candidate names in a company's careers-page URL (`jobs.ashbyhq.com/<board>`).
