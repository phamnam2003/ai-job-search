#!/usr/bin/env bun
// Self-contained CLI for searching jobs on Devwork (devwork.vn), a Hanoi-based
// IT recruitment / referral network. No external CLI framework and no runtime
// dependencies, so it runs anywhere `bun` is available.
//
// Devwork serves its listings and full job descriptions as public,
// server-rendered HTML; this reads those pages. Keep volume reasonable.

import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"
import { KNOWN_TAGS } from "./helpers.js"

interface Flags {
  _: string[]
  [k: string]: string | boolean | string[]
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { _: [] }
  const alias: Record<string, string> = { q: "query", l: "location", n: "limit" }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith("--") || a.startsWith("-")) {
      const key = alias[a.replace(/^-+/, "")] ?? a.replace(/^-+/, "")
      const next = argv[i + 1]
      if (next === undefined || next.startsWith("-")) {
        flags[key] = true
      } else {
        flags[key] = next
        i++
      }
    } else {
      ;(flags._ as string[]).push(a)
    }
  }
  return flags
}

const HELP = `devwork-cli — search jobs on Devwork (devwork.vn), Hanoi IT recruitment network

USAGE
  bun run src/cli.ts search [--query "<tag>"] [--location <city>] [flags]
  bun run src/cli.ts detail <id|url> [--format json|plain]
  bun run src/cli.ts tags

SEARCH FLAGS
  --query, -q <tag>       Technology tag, NOT free text. Devwork browses by fixed
                          skill slugs — run \`tags\` to list the known ones.
                          Omit to list all current openings.
  --location, -l <city>   Client-side substring filter on the card's location
                          (diacritic-insensitive, so "ha noi" matches "Hà Nội").
  --page <n>              1-indexed page (20 listings/page). Default 1.
  --limit, -n <n>         Cap results emitted (client-side).
  --format <fmt>          json (default) | table | plain.

EXAMPLES
  bun run src/cli.ts search -q "golang" --format table
  bun run src/cli.ts search -q "nodejs" -l "ha noi" --format table
  bun run src/cli.ts search --limit 20 --format json
  bun run src/cli.ts search -q "java" --page 2 --format table
  bun run src/cli.ts detail 13758 --format plain
  bun run src/cli.ts tags

NOTES
  Salary bands are published on most Devwork cards, which is unusual for the
  Vietnamese market. The deadline is only on the detail page, not the card.
`

async function main(): Promise<number> {
  const argv = process.argv.slice(2)
  const flags = parseFlags(argv)
  const cmd = (flags._ as string[])[0]

  if (!cmd || flags.help || flags.h) {
    process.stdout.write(HELP)
    return cmd ? 0 : 1
  }

  if (cmd === "tags") {
    process.stdout.write(KNOWN_TAGS.join("\n") + "\n")
    return 0
  }

  if (cmd === "search") {
    const fmt = (flags.format as string) || "json"

    const parseIntFlag = (name: string, raw: string | boolean | string[]): number | null => {
      const val = parseInt(raw as string, 10)
      if (isNaN(val)) {
        process.stderr.write(
          JSON.stringify({ error: `--${name} must be a number, got "${raw}"`, code: "BAD_ARG" }) + "\n",
        )
        return null
      }
      return val
    }

    for (const name of ["page", "limit"]) {
      if (flags[name] !== undefined) {
        const v = parseIntFlag(name, flags[name])
        if (v === null) return 1
        flags[name] = String(v)
      }
    }

    const opts: SearchOpts = {
      query: typeof flags.query === "string" ? flags.query : undefined,
      location: typeof flags.location === "string" ? flags.location : undefined,
      page: flags.page ? Math.max(1, parseInt(flags.page as string, 10)) : 1,
      limit: flags.limit ? parseInt(flags.limit as string, 10) : undefined,
      format: (["json", "table", "plain"].includes(fmt) ? fmt : "json") as SearchOpts["format"],
    }
    return runSearch(opts)
  }

  if (cmd === "detail") {
    const id = (flags._ as string[])[1]
    if (!id) {
      process.stderr.write(JSON.stringify({ error: "detail requires an <id|url>", code: "NO_ID" }) + "\n")
      return 1
    }
    const fmt = (flags.format as string) || "json"
    const opts: DetailOpts = {
      id,
      format: (fmt === "plain" ? "plain" : "json") as DetailOpts["format"],
    }
    return runDetail(opts)
  }

  process.stderr.write(JSON.stringify({ error: `Unknown command "${cmd}"`, code: "BAD_CMD" }) + "\n")
  return 1
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    process.stderr.write(
      JSON.stringify({
        error: e instanceof Error ? e.message : String(e),
        code: "INTERNAL_ERROR",
      }) + "\n",
    )
    process.exit(1)
  })
