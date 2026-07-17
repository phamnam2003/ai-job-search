#!/usr/bin/env bun
// Self-contained CLI for searching remote / offshore jobs on RemoteOK
// (remoteok.com) via its public JSON API. No external CLI framework and zero
// runtime dependencies, so it runs anywhere `bun` is available with just the
// repo clone.
//
// Personal use only. This reads RemoteOK's public job feed; keep request volume
// low, do not use it commercially or for bulk data collection, and credit
// RemoteOK as a source per their API terms. Run it on your own responsibility.

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

const HELP = `remoteok-cli — search remote / offshore jobs on RemoteOK (remoteok.com)

USAGE
  bun run src/cli.ts search [flags]
  bun run src/cli.ts detail <id|url> [--format json|plain]

SEARCH FLAGS
  --query, -q <text>      Keywords matched against the job TITLE only, client-side,
                          case- & accent-insensitive; all words must match. e.g. "engineer".
                          (Tags/description are excluded — RemoteOK stuffs tags, so matching
                          them returns false positives. A niche term may return 0 hits.)
  --tag <text>            Opt-in RemoteOK tag filter (noisy — many broad tags per job).
                          e.g. --tag golang. Combine with -q to narrow. Lower precision.
  --location, -l <text>   Filter by location substring, client-side. Most RemoteOK roles
                          are worldwide-remote, so this only narrows the few geo-scoped ones.
  --jobage <days>         Only postings from the last <days> days (client-side, on epoch).
  --page <n>              1-indexed page (20 results/page, client-side). Default 1.
  --limit, -n <n>         Cap results emitted (client-side).
  --format <fmt>          json (default) | table | plain.

EXAMPLES
  bun run src/cli.ts search -q "engineer" --limit 5 --format table
  bun run src/cli.ts search -q "backend" --jobage 7 --format table
  bun run src/cli.ts search --tag golang --format table
  bun run src/cli.ts search --format table          # browse the whole feed
  bun run src/cli.ts detail 1134900 --format plain

Personal use only — uses RemoteOK's public feed (latest ~100 postings); keep volume low.
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
      tag: typeof flags.tag === "string" ? flags.tag : undefined,
      location: typeof flags.location === "string" ? flags.location : undefined,
      jobage: typeof flags.jobage === "string" ? parseInt(flags.jobage, 10) : undefined,
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
      format: (fmt === "plain" ? "plain" : "json") as DetailOpts["format"],
    }
    return runDetail(opts)
  }

  process.stderr.write(JSON.stringify({ error: `Unknown command "${cmd}"`, code: "BAD_CMD" }) + "\n")
  return 1
}

main().then((code) => process.exit(code))
