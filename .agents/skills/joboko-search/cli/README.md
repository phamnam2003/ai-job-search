# joboko-cli

Zero-dependency CLI for searching jobs on [Joboko](https://vn.joboko.com), a
Vietnamese job aggregator (formerly GoodCV). Reads the site's public,
server-rendered pages — no authentication, no API key, no headless browser.

## Install

```bash
cd .agents/skills/joboko-search/cli && bun install
```

`bun install` only pulls dev types. There are no runtime dependencies.

## Usage

```bash
bun run src/cli.ts search -q "backend developer" -l "ha noi" --open-only --format table
bun run src/cli.ts search -q "lap trinh vien" --page 2 --format json
bun run src/cli.ts detail "https://vn.joboko.com/viec-lam-lap-trinh-vien-java-xvi6610939" --format plain
bun run src/cli.ts slugs
bun run src/cli.ts --help
```

## Use `--open-only`

Joboko is an aggregator and **keeps expired postings live**. Cards carry the
deadline, so `--open-only` costs nothing; `detail` also returns an `expired`
boolean. Treat both as required rather than optional — see `../SKILL.md`.

## Tests

```bash
bun run test        # live smoke tests against vn.joboko.com
bun run typecheck
```

The suite asserts populated `id`/`title`/`url`, ISO deadlines, that `--open-only`
never returns a past deadline, that `--page` actually returns different jobs
(guarding the `?p=` vs `?page=` trap), that an unsupported keyword slug exits 1
with `NO_SLUG`, that `detail` yields decoded text plus the `expired` flag, and
that a bare numeric ID is rejected with a useful message.

## Design notes

- **Pagination is `?p=`, not `?page=`.** The latter silently returns page 1. There
  is a regression test for this specifically.
- **Pre-generated keyword slugs.** `golang` and `nodejs` 404; `backend developer`
  and `lap trinh vien` work. The CLI surfaces a `NO_SLUG` error naming working
  alternatives instead of returning an empty result set.
- **JSON-LD first for detail.** One `JobPosting` block supplies title, description,
  dates, employer, location, industry and employment type.
- **Chunked card parsing.** `parseJobCards` splits on the `data-jid` marker and
  parses each card independently.
- **The card's `item-date` is the deadline, not the posting date** — the class name
  is misleading. `data-value` holds an ISO timestamp; prefer it over the text node.
