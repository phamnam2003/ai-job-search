# lever-cli

Search jobs across Lever-hosted company boards via Lever's public v0 postings API.

- **No authentication**, no API key.
- **Zero runtime dependencies** — plain `bun` + `fetch`. `bun install` pulls dev types only.

## Install

```bash
cd .agents/skills/lever-search/cli && bun install
```

`bun install` is only needed for `typecheck`; the CLI itself runs from a fresh clone.

## Usage

```bash
bun run src/cli.ts search -l vietnam --format table
bun run src/cli.ts search -q "backend engineer" --tag apac --format table
bun run src/cli.ts detail amanotes/9c9416dd-bff1-4cf8-a4a7-b11150e37526 --format plain
bun run src/cli.ts companies
```

See `bun run src/cli.ts --help` for the full flag reference, and
[`../SKILL.md`](../SKILL.md) for usage guidance.

## Coverage is a config file

Lever has no global search — each employer hosts its own board. `search` fans out across
the tokens in [`../companies.json`](../companies.json). **Editing that file is how you
change what this CLI can find.** Its header comment explains how to find and verify a new
board token.

One search costs one HTTP request per board, so use `--tag` or `--company` to keep the
fan-out small.

## `--match full` is the default here

Unlike the Greenhouse skill, Lever returns full descriptions inside the list response, so
full-text search costs no extra requests. The trade-off is noise on common words — pass
`--match title` to match titles only.

## Scripts

| Script | Does |
|--------|------|
| `bun run start` | Run the CLI |
| `bun run test` | Live test suite (hits the real API against one small board) |
| `bun run typecheck` | `tsc --noEmit` |

## Layout

```
src/cli.ts              Arg parsing, flag validation, command dispatch
src/helpers.ts          Fetch with backoff, companies.json loader, normalizers, description composer
src/commands/search.ts  Fan-out, client-side filtering, aggregation, output rendering
src/commands/detail.ts  Single-posting lookup
```

Endpoint documentation and response quirks — including why the description needs
composing from five separate fields — live in [`../url-reference.md`](../url-reference.md).
