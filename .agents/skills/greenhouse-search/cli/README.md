# greenhouse-cli

Search jobs across Greenhouse-hosted company boards via Greenhouse's public Job Board API.

- **No authentication**, no API key.
- **Zero runtime dependencies** — plain `bun` + `fetch`. `bun install` pulls dev types only.

## Install

```bash
cd .agents/skills/greenhouse-search/cli && bun install
```

`bun install` is only needed for `typecheck`; the CLI itself runs from a fresh clone.

## Usage

```bash
bun run src/cli.ts search -q "backend engineer" --tag go --format table
bun run src/cli.ts search -q golang --match full --jobage 30
bun run src/cli.ts detail tailscale/4707636005 --format plain
bun run src/cli.ts companies
```

See `bun run src/cli.ts --help` for the full flag reference, and
[`../SKILL.md`](../SKILL.md) for usage guidance.

## Coverage is a config file

Greenhouse has no global search — each employer hosts its own board. `search` fans out
across the tokens in [`../companies.json`](../companies.json). **Editing that file is how
you change what this CLI can find.** Its header comment explains how to find and verify a
new board token.

One search costs one HTTP request per board, so use `--tag` or `--company` to keep the
fan-out small.

## Scripts

| Script | Does |
|--------|------|
| `bun run start` | Run the CLI |
| `bun run test` | Live test suite (hits the real API against one small board) |
| `bun run typecheck` | `tsc --noEmit` |

## Layout

```
src/cli.ts              Arg parsing, flag validation, command dispatch
src/helpers.ts          Fetch with backoff, companies.json loader, normalizers, HTML decoding
src/commands/search.ts  Fan-out, client-side filtering, aggregation, output rendering
src/commands/detail.ts  Single-posting lookup
```

Endpoint documentation and response quirks live in [`../url-reference.md`](../url-reference.md).
