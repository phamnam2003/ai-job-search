#!/usr/bin/env bun
// Self-contained CLI for searching IT jobs on ITNavi (itnavi.com.vn), a Vietnamese
// IT job board. Server-rendered public search pages plus a public get-job-by-id
// JSON endpoint, no auth, no API key, and zero runtime dependencies — runs anywhere
// `bun` is available.
//
// Personal use only. robots.txt only disallows /admin and /blog/search. Keep
// request volume low and polite.

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

const HELP = `itnavi-cli — search IT jobs on ITNavi (itnavi.com.vn, Vietnam)

USAGE
  bun run src/cli.ts search [--query "<kw>"] [--location <city-slug>] [flags]
  bun run src/cli.ts detail <id|slug|url> [--format json|plain]

SEARCH FLAGS
  --query, -q <text>      Keywords (title / skill / role), e.g. "golang",
                          "backend developer". Hyphenated into the URL path.
  --location, -l <slug>   City slug path segment: ha-noi, ho-chi-minh, da-nang, khac.
  --jobage <days>         Best-effort: client-side filter on each card's posted-age
                          label (e.g. "5 d"). Rows with an unparseable age are kept.
  --page <n>              1-indexed page. Default 1.
  --limit, -n <n>         Cap results emitted (client-side).
  --no-enrich             Skip the per-result get-job-by-id lookup that fills each
                          job's authoritative detail URL. Faster / fewer requests,
                          but "url"/"slug"/"salary"/"posted" come back null.
  --format <fmt>          json (default) | table | plain.

DETAIL
  Accepts a numeric job id (resolved via the get-job-by-id JSON endpoint) OR a job
  slug / full /job-detail/<slug> URL (scraped from the job page).

EXAMPLES
  bun run src/cli.ts search -q "golang" --limit 5 --format table
  bun run src/cli.ts search -q "backend" -l "ha-noi" --limit 10 --format table
  bun run src/cli.ts search -q "reactjs" --format json
  bun run src/cli.ts detail 24005 --format plain
  bun run src/cli.ts detail golang-backend-developer-bnpl-project --format plain

Personal use only — uses ITNavi's public pages; keep volume low and polite.
`

async function main(): Promise<number> {
  const argv = process.argv.slice(2)
  const flags = parseFlags(argv)
  const cmd = (flags._ as string[])[0]

  if (!cmd || flags.help || flags.h) {
    process.stdout.write(HELP)
    return cmd ? 0 : 1
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

    if (flags.jobage !== undefined) {
      const v = parseIntFlag("jobage", flags.jobage)
      if (v === null) return 1
      flags.jobage = String(v)
    }
    if (flags.page !== undefined) {
      const v = parseIntFlag("page", flags.page)
      if (v === null) return 1
      flags.page = String(v)
    }
    if (flags.limit !== undefined) {
      const v = parseIntFlag("limit", flags.limit)
      if (v === null) return 1
      flags.limit = String(v)
    }

    const opts: SearchOpts = {
      query: typeof flags.query === "string" ? flags.query : undefined,
      location: typeof flags.location === "string" ? flags.location : undefined,
      jobage: flags.jobage ? parseInt(flags.jobage as string, 10) : 9999,
      page: flags.page ? Math.max(1, parseInt(flags.page as string, 10)) : 1,
      limit: flags.limit ? parseInt(flags.limit as string, 10) : undefined,
      enrich: flags["no-enrich"] !== true,
      format: (["json", "table", "plain"].includes(fmt) ? fmt : "json") as SearchOpts["format"],
    }
    return runSearch(opts)
  }

  if (cmd === "detail") {
    const id = (flags._ as string[])[1]
    if (!id) {
      process.stderr.write(
        JSON.stringify({ error: "detail requires an <id|slug|url>", code: "NO_ID" }) + "\n",
      )
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

main().then((code) => process.exit(code))
