# vietnamworks-cli

Zero-dependency `bun` CLI that searches jobs on **VietnamWorks** (vietnamworks.com), a major
Vietnamese general job board, via its public job-search microservice. Part of the repo's
job-portal-skill pattern; see `../SKILL.md` for the skill definition and `../url-reference.md`
for the endpoint documentation.

## Install

```bash
cd .agents/skills/vietnamworks-search/cli && bun install
```

`bun install` only pulls dev types (`typescript`, `@types/bun`) — there are **no runtime
dependencies**. The CLI runs on a fresh clone with just `bun`.

## Usage

```bash
# Search (json | table | plain)
bun run src/cli.ts search -q "golang" -l "Ha Noi" --limit 5 --format table
bun run src/cli.ts search -q "backend developer" --jobage 14 --format plain

# Detail by id or URL
bun run src/cli.ts detail 2076956 --format plain
bun run src/cli.ts detail https://www.vietnamworks.com/backend-developer-2076956-jv
```

Run `bun run src/cli.ts` with no args for full help.

### Flags

| Flag | Meaning |
|------|---------|
| `--query`, `-q` | keyword (title/skill/role) |
| `--location`, `-l` | client-side, accent-insensitive city filter (`"Ha Noi"` = `"Hà Nội"`) |
| `--jobage <days>` | client-side filter on each posting's `approvedOn` date |
| `--page <n>` | 1-indexed page (up to 50 results/page) |
| `--limit`, `-n <n>` | cap results emitted |
| `--format` | `json` (default) \| `table` \| `plain` |

## Output contract

- Search JSON: `{ "meta": { "count", "page" }, "results": [ { id, title, company, location, date, url, salary, skills } ] }`
- Missing values are `null`, never omitted.
- Errors → **stderr** as `{ "error", "code" }`, exit code `1`.

## Dev

```bash
bun run typecheck   # tsc --noEmit
bun run test        # bun test (offline parser tests + live smoke tests)
```

Live smoke tests hit the public microservice, so they need network access. Keep volume low.

## Data source & terms

Reads VietnamWorks' public data via `ms.vietnamworks.com/job-search/v1.0/search`. **Personal use
only** — keep request volume low; no commercial or bulk use. robots.txt permits the paths this
CLI touches. Run on your own responsibility.
