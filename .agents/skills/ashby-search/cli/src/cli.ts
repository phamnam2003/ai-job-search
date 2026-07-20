#!/usr/bin/env bun
// Self-contained CLI for searching jobs across Ashby-hosted company boards via
// Ashby's public Posting API. No authentication, no API key, and zero runtime
// dependencies — it runs with just `bun`.
//
// Ashby is an ATS, not a job board: there is no global search. `search` fans out
// across the boards in ../../companies.json (or --company) and filters
// client-side. Ashby returns full descriptions in the list response, so
// --match full is the default here.

import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"

interface Flags {
  _: string[]
  [k: string]: string | boolean | string[]
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { _: [] }
  const alias: Record<string, string> = {
    q: "query",
    n: "limit",
    l: "location",
    c: "company",
    t: "tag",
  }
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

const KNOWN_SEARCH_FLAGS = new Set([
  "query", "company", "tag", "location", "remote", "match", "jobage", "page", "limit", "format", "help", "h",
])
const KNOWN_DETAIL_FLAGS = new Set(["company", "format", "help", "h"])

const HELP = `ashby-cli — search jobs across Ashby-hosted company boards

Ashby has no global search: each employer hosts its own board. This CLI fans out
across the boards listed in companies.json (edit that file to change coverage).

USAGE
  bun run src/cli.ts search [flags]
  bun run src/cli.ts detail <board>/<uuid> [--format json|plain]
  bun run src/cli.ts companies

SEARCH FLAGS
  --query, -q <text>      Keywords. All terms must match (AND); "quote a phrase".
  --company, -c <boards>  Comma-separated board names to search instead of companies.json.
  --tag, -t <tag>         Only search companies.json entries carrying this tag
                          (e.g. go, remote-first, database, kubernetes, fintech, vietnam).
  --location, -l <text>   Client-side substring filter, searching both the primary
                          location and secondaryLocations.
  --remote                Only postings flagged isRemote by the employer.
  --match <mode>          full (default) | title. Ashby returns descriptions in the
                          list response, so full-text search is free here.
  --jobage <days>         Only postings published within N days. Default: all.
  --page <n>              1-indexed page over the aggregated results (25/page).
  --limit, -n <n>         Cap results emitted (client-side).
  --format <fmt>          json (default) | table | plain.

DETAIL FLAGS
  --company, -c <board>   Board name, when the id is a bare job UUID.
  --format <fmt>          json (default) | plain.

EXAMPLES
  bun run src/cli.ts search -q "backend engineer" --tag go --format table
  bun run src/cli.ts search -q golang --remote --jobage 30 --format table
  bun run src/cli.ts search -l vietnam --format table
  bun run src/cli.ts search -q kubernetes -c coder,kong,temporal
  bun run src/cli.ts detail skymavis/a4dc737a-1893-4981-844c-2153ad06be75 --format plain
  bun run src/cli.ts companies
`

function parseIntFlag(name: string, raw: string | boolean | string[]): number | null {
  const val = parseInt(raw as string, 10)
  if (isNaN(val)) {
    process.stderr.write(JSON.stringify({ error: `--${name} must be a number, got "${raw}"`, code: "BAD_ARG" }) + "\n")
    return null
  }
  return val
}

function rejectUnknown(flags: Flags, known: Set<string>): boolean {
  for (const key of Object.keys(flags)) {
    if (key === "_") continue
    if (!known.has(key)) {
      process.stderr.write(JSON.stringify({ error: `Unknown flag "--${key}"`, code: "BAD_FLAG" }) + "\n")
      return true
    }
  }
  return false
}

async function main(): Promise<number> {
  const argv = process.argv.slice(2)
  const flags = parseFlags(argv)
  const cmd = (flags._ as string[])[0]

  if (!cmd || flags.help || flags.h) {
    process.stdout.write(HELP)
    return cmd ? 0 : 1
  }

  if (cmd === "companies") {
    const { loadCompanies } = await import("./helpers.js")
    try {
      const list = loadCompanies()
      const rows = list.map(
        (c) =>
          `${c.token.padEnd(14)} ${(c.name || "").slice(0, 22).padEnd(22)} ${(c.region || "—").slice(0, 34).padEnd(34)} ${(c.tags ?? []).join(",")}`,
      )
      const header = "BOARD".padEnd(14) + " " + "NAME".padEnd(22) + " " + "REGION".padEnd(34) + " TAGS"
      process.stdout.write([header, "-".repeat(header.length), ...rows].join("\n") + "\n")
      return 0
    } catch (e) {
      process.stderr.write(
        JSON.stringify({ error: e instanceof Error ? e.message : String(e), code: "COMPANIES_FAILED" }) + "\n",
      )
      return 1
    }
  }

  if (cmd === "search") {
    if (rejectUnknown(flags, KNOWN_SEARCH_FLAGS)) return 1

    for (const numeric of ["jobage", "page", "limit"]) {
      if (flags[numeric] !== undefined) {
        const v = parseIntFlag(numeric, flags[numeric])
        if (v === null) return 1
        flags[numeric] = String(v)
      }
    }

    // Descriptions ride along in the list response, so full-text is the default.
    const rawMatch = typeof flags.match === "string" ? flags.match.toLowerCase() : "full"
    if (!["title", "full"].includes(rawMatch)) {
      process.stderr.write(
        JSON.stringify({ error: `--match must be "title" or "full", got "${rawMatch}"`, code: "BAD_ARG" }) + "\n",
      )
      return 1
    }

    const fmt = (flags.format as string) || "json"
    const opts: SearchOpts = {
      query: typeof flags.query === "string" ? flags.query : undefined,
      companies: typeof flags.company === "string" ? flags.company : undefined,
      tag: typeof flags.tag === "string" ? flags.tag : undefined,
      location: typeof flags.location === "string" ? flags.location : undefined,
      remoteOnly: flags.remote === true || flags.remote === "true",
      match: rawMatch as SearchOpts["match"],
      jobage: flags.jobage ? parseInt(flags.jobage as string, 10) : 9999,
      page: flags.page ? Math.max(1, parseInt(flags.page as string, 10)) : 1,
      limit: flags.limit ? parseInt(flags.limit as string, 10) : undefined,
      format: (["json", "table", "plain"].includes(fmt) ? fmt : "json") as SearchOpts["format"],
    }
    return runSearch(opts)
  }

  if (cmd === "detail") {
    if (rejectUnknown(flags, KNOWN_DETAIL_FLAGS)) return 1
    const id = (flags._ as string[])[1]
    if (!id) {
      process.stderr.write(
        JSON.stringify({
          error: "detail requires an <id|url>, e.g. skymavis/a4dc737a-1893-4981-844c-2153ad06be75",
          code: "NO_ID",
        }) + "\n",
      )
      return 1
    }
    const fmt = (flags.format as string) || "json"
    const opts: DetailOpts = {
      id,
      company: typeof flags.company === "string" ? flags.company : undefined,
      format: (fmt === "plain" ? "plain" : "json") as DetailOpts["format"],
    }
    return runDetail(opts)
  }

  process.stderr.write(JSON.stringify({ error: `Unknown command "${cmd}"`, code: "BAD_CMD" }) + "\n")
  return 1
}

main().then((code) => process.exit(code))
