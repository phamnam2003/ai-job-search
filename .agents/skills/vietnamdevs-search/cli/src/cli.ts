#!/usr/bin/env bun
// Self-contained CLI for searching IT jobs on VietnamDevs (vietnamdevs.com), a
// curated, English-friendly IT job board for the Vietnamese market with many
// remote/offshore-friendly roles. Server-rendered public pages, no auth, no API
// key, and zero runtime dependencies — runs anywhere `bun` is available.
//
// Personal use only. VietnamDevs' robots.txt allows /jobs; still keep request
// volume low and polite.

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

const HELP = `vietnamdevs-cli — search IT jobs on VietnamDevs (vietnamdevs.com, Vietnam)

USAGE
  bun run src/cli.ts search [--query "<kw>"] [--location <slug>] [flags]
  bun run src/cli.ts detail <id|url> [--format json|plain]

SEARCH FLAGS
  --query, -q <text>      Category keyword mapped to a URL path segment. Must be a
                          VietnamDevs category slug: golang, java, python, php,
                          nodejs, reactjs, vuejs, back-end, front-end, full-stack,
                          sre-devops, mobile-engineer, data-engineer,
                          machine-learning, qa-qc, project-manager.
  --location, -l <slug>   City slug: ha-noi, ho-chi-minh, da-nang. Special value
                          "remote" filters cards labelled "Remote working"
                          (VietnamDevs has no remote URL path).
  --jobage <days>         Best-effort: filters on the card's relative posted-age
                          label ("3d", "1w", "2mos"). Cards with an unparseable age
                          are kept.
  --page <n>              1-indexed page. Default 1.
  --limit, -n <n>         Cap results emitted (client-side).
  --format <fmt>          json (default) | table | plain.

EXAMPLES
  bun run src/cli.ts search -q "golang" --format table
  bun run src/cli.ts search -q "golang" -l "ha-noi" --format table
  bun run src/cli.ts search -q "back-end" -l "remote" --limit 10 --format table
  bun run src/cli.ts search -l "ho-chi-minh" --jobage 14 --format json
  bun run src/cli.ts detail 928767371223434 --format plain

Personal use only — uses VietnamDevs' public pages; keep volume low and polite.
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
      format: (["json", "table", "plain"].includes(fmt) ? fmt : "json") as SearchOpts["format"],
    }
    return runSearch(opts)
  }

  if (cmd === "detail") {
    const id = (flags._ as string[])[1]
    if (!id) {
      process.stderr.write(
        JSON.stringify({ error: "detail requires a <id|url>", code: "NO_ID" }) + "\n",
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
