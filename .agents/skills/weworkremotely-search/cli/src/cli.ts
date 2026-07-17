#!/usr/bin/env bun
// Self-contained CLI for searching remote jobs on We Work Remotely
// (weworkremotely.com) via its public RSS category feeds. No external CLI
// framework and zero runtime dependencies, so it runs anywhere `bun` is available
// with just the repo clone.
//
// Personal use only. This reads We Work Remotely's public RSS feeds; keep request
// volume low, do not use it commercially or for bulk data collection. Run it on
// your own responsibility.

import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"

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

const HELP = `weworkremotely-cli — search remote jobs on We Work Remotely (weworkremotely.com)

USAGE
  bun run src/cli.ts search [flags]
  bun run src/cli.ts detail <id|url> [--category <c>] [--format json|plain]

SEARCH FLAGS
  --query, -q <text>      Keywords (title, company, skill). Client-side, case-insensitive.
                          All whitespace-separated words must match. e.g. "backend", "golang".
  --location, -l <text>   Filter by region, client-side & accent-insensitive. Most WWR jobs are
                          "Anywhere in the World"; some list a country/US-state (e.g. "India").
  --jobage <days>         Posted within N days (client-side, on <pubDate>). e.g. 7, 14, 30.
  --category <c>          Comma-separated feeds: backend, fullstack, frontend, devops, all.
                          Default: backend,fullstack,frontend.
  --page <n>              1-indexed page over the merged list (10 results/page). Default 1.
  --limit, -n <n>         Cap results emitted (client-side).
  --format <fmt>          json (default) | table | plain.

EXAMPLES
  bun run src/cli.ts search -q "backend" --limit 5 --format table
  bun run src/cli.ts search -q "golang" --format plain
  bun run src/cli.ts search -q "react" --category frontend,fullstack --format table
  bun run src/cli.ts search --jobage 14 --format table
  bun run src/cli.ts detail proxify-ab-senior-java-backend-developer --format plain
  bun run src/cli.ts detail https://weworkremotely.com/remote-jobs/<slug> --format json

Personal use only — uses We Work Remotely's public RSS feeds; keep volume low.
`

async function main(): Promise<number> {
  const argv = process.argv.slice(2)
  const flags = parseFlags(argv)
  const cmd = (flags._ as string[])[0]

  if (!cmd || flags.help || flags.h) {
    process.stdout.write(HELP)
    return cmd ? 0 : 1
  }

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

  if (cmd === "search") {
    const fmt = (flags.format as string) || "json"

    if (flags.jobage !== undefined && flags.jobage !== true) {
      if (parseIntFlag("jobage", flags.jobage) === null) return 1
    }
    if (flags.page !== undefined && flags.page !== true) {
      if (parseIntFlag("page", flags.page) === null) return 1
    }
    if (flags.limit !== undefined && flags.limit !== true) {
      if (parseIntFlag("limit", flags.limit) === null) return 1
    }

    const opts: SearchOpts = {
      query: typeof flags.query === "string" ? flags.query : undefined,
      location: typeof flags.location === "string" ? flags.location : undefined,
      jobage: typeof flags.jobage === "string" ? parseInt(flags.jobage, 10) : undefined,
      category: typeof flags.category === "string" ? flags.category : undefined,
      page: typeof flags.page === "string" ? Math.max(1, parseInt(flags.page, 10)) : 1,
      limit: typeof flags.limit === "string" ? parseInt(flags.limit, 10) : undefined,
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
      category: typeof flags.category === "string" ? flags.category : undefined,
      format: (fmt === "plain" ? "plain" : "json") as DetailOpts["format"],
    }
    return runDetail(opts)
  }

  process.stderr.write(JSON.stringify({ error: `Unknown command "${cmd}"`, code: "BAD_CMD" }) + "\n")
  return 1
}

main().then((code) => process.exit(code))
