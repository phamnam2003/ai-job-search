# careerviet-cli

Zero-dependency CLI for searching jobs on [CareerViet Vietnam](https://careerviet.vn)
(the rebrand of CareerBuilder Vietnam). Reads the site's public, server-rendered
search and detail pages — no authentication, no API key, no headless browser.

## Install

```bash
cd .agents/skills/careerviet-search/cli && bun install
```

`bun install` only pulls dev types (`typescript`, `@types/bun`). There are no
runtime dependencies, so the CLI also runs straight from a fresh clone with just
`bun`.

## Usage

```bash
bun run src/cli.ts search -q "backend" -l "ha noi" --format table
bun run src/cli.ts search -q "golang" --sort date --open-only --format json
bun run src/cli.ts detail 35C7FB4F --format plain
bun run src/cli.ts --help
```

See `../SKILL.md` for the full flag reference and `../url-reference.md` for the
endpoint and parsing anchors.

## Tests

```bash
bun run test        # live smoke tests against careerviet.vn
bun run typecheck
```

The suite hits the live site (a handful of requests). It asserts that search
returns populated `id`/`title`/`url`, that dates and deadlines normalise to ISO,
that `--open-only` never returns a past deadline, that `detail` yields decoded
text rather than markup, and that bad flags exit 1 with a JSON error on stderr.

## Design notes

- **Path-based search.** CareerViet ignores query-string parameters; the keyword,
  location, page and sort all live in the URL path. `buildUrl` in
  `src/commands/search.ts` assembles them.
- **JSON-LD first for detail.** Detail pages embed a schema.org `JobPosting`
  block, which is far more stable than the markup. `parseJobDetail` prefers it and
  falls back to HTML anchors per field.
- **Chunked card parsing.** `parseJobCards` splits on the `job-item` marker and
  parses each card independently, so one malformed card cannot break the rest.
- **`--jobage` is client-side** — the portal has no posting-age parameter. Cards
  with no parsable date are kept, not dropped. `--open-only` is the more reliable
  freshness filter because it uses the real `Hạn nộp` deadline.
