# Greenhouse Job Board API — endpoint reference

Reconnaissance performed 2026-07-20. This is what a future maintainer needs when
Greenhouse changes its API or a parser stops returning fields.

## Access terms

- `https://boards.greenhouse.io/robots.txt` — `User-agent: *` / `Disallow: /embed/` only.
  The API host and the board paths used here are not disallowed.
- The Job Board API is public and documented; employers embed it in their own careers
  pages. No authentication, no API key, no login wall.
- No personal-use warning required in `SKILL.md`.

## The core constraint

**There is no global search endpoint.** Greenhouse is an ATS: every employer gets its own
board addressed by a *board token* (the slug in `boards.greenhouse.io/<token>`). Any
"search Greenhouse" feature has to be a client-side fan-out across a known list of tokens.
That list is [`companies.json`](companies.json).

## Endpoints

| Purpose | Method + URL |
|---------|--------------|
| List jobs on a board | `GET https://boards-api.greenhouse.io/v1/boards/{token}/jobs` |
| List jobs **with descriptions** | `GET https://boards-api.greenhouse.io/v1/boards/{token}/jobs?content=true` |
| Single job detail | `GET https://boards-api.greenhouse.io/v1/boards/{token}/jobs/{jobId}?questions=false` |

### Parameters

| Parameter | Applies to | Notes |
|-----------|-----------|-------|
| `content=true` | list | Includes the full description in every job. **Heavy** — Stripe's board is ~3.9 MB with content vs a few hundred KB without. |
| `questions=false` | detail | Omits the application-form question schema, which we never use. |

There are **no** query, location, pagination, or date parameters. Every filter this CLI
offers (`--query`, `--location`, `--jobage`, `--page`) is applied client-side after fetch.

## Response structure

### List (`/jobs`)

```json
{ "jobs": [ { ...job } ] }
```

Job object keys (verified against the `tailscale` board):

```
absolute_url, data_compliance, internal_job_id, location, metadata, id,
updated_at, requisition_id, title, company_name, first_published, language,
application_deadline
```

With `?content=true` the object also carries `content`, and `departments` /
`offices` appear on the detail endpoint.

| Field | Maps to | Notes |
|-------|---------|-------|
| `id` | `id` (as `{token}/{id}`) | Numeric, **unique per board only** — hence the namespaced id. |
| `title` | `title` | May contain HTML entities; decoded. |
| `location.name` | `location` | Free text (`"Paris;Geneva"`, `"Home based - Worldwide"`). No structured country field. |
| `first_published` | `date` | ISO 8601. Falls back to `updated_at` when absent. |
| `absolute_url` | `url` | Often points at the company's own careers page, not `greenhouse.io`. |
| `company_name` | `company` | Overridden by the display name in `companies.json` when known. |
| `content` | `description` | **Double-encoded**: an HTML-escaped HTML document. Needs one entity decode *before* tag stripping — see `decodeContent()` in `cli/src/helpers.ts`. |
| `departments[0].name` | `department` | Detail endpoint only. |

### Detail (`/jobs/{id}`)

Same job shape, always including `content`, plus `departments` and `offices`.
A missing job returns **404** (handled as `NOT_FOUND`, exit 1).

## Quirks worth remembering

1. **`content` is double-encoded.** `&lt;p&gt;Text&lt;/p&gt;` — decode entities first, then strip tags, or you get literal `<p>` in the output.
2. **Job ids collide across boards.** Two companies can both have job `4707636005`. The board token must travel with the id.
3. **`absolute_url` is not always a greenhouse.io URL.** Companies with custom careers domains return their own URL. Do not assume the host.
4. **Board tokens are not guessable.** `grafanalabs` not `grafana`, `temporaltechnologies` not `temporal`, `remotecom` not `remote`. Always verify a new token with a live request before adding it.
5. **404 vs empty.** A wrong token 404s; a real board with no open roles returns `{"jobs":[]}`. The CLI distinguishes these — 404 lands in `meta.errors`.

## Verifying a new board token

```bash
curl -s https://boards-api.greenhouse.io/v1/boards/<token>/jobs | head -c 300
```

A `200` with a non-empty `jobs` array means the token is good. Find candidate tokens in
a company careers-page URL (`boards.greenhouse.io/<token>`, `job-boards.greenhouse.io/<token>`)
or in an apply link carrying `gh_jid`.
