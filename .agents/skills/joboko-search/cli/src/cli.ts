#!/usr/bin/env bun
// Self-contained CLI for searching jobs on Joboko (vn.joboko.com), a Vietnamese
// job aggregator. No external CLI framework and no runtime dependencies.
//
// Joboko cross-posts listings from other boards, so it catches postings the
// source-specific CLIs miss — but its index skews stale, and it keeps expired
// postings live. Prefer --open-only, and check the `expired` field on detail.

import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"
import { KNOWN_SLUGS } from "./helpers.js"

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

const HELP = `joboko-cli — search jobs on Joboko (vn.joboko.com), Vietnamese job aggregator

USAGE
  bun run src/cli.ts search [--query "<kw>"] [--location <city>] [flags]
  bun run src/cli.ts detail <url|path> [--format json|plain]
  bun run src/cli.ts slugs

SEARCH FLAGS
  --query, -q <text>      Keyword. Joboko only serves PRE-GENERATED slug pages —
                          broad terms work ("backend developer", "lap trinh vien"),
                          narrow ones 404 ("golang", "nodejs"). Run \`slugs\`.
  --location, -l <city>   City, appended as -tai-<city>. e.g. "ha noi".
  --open-only             Drop postings whose deadline has already passed.
  --page <n>              1-indexed page (20/page). Default 1.
  --limit, -n <n>         Cap results emitted (client-side).
  --format <fmt>          json (default) | table | plain.

EXAMPLES
  bun run src/cli.ts search -q "backend developer" -l "ha noi" --open-only --format table
  bun run src/cli.ts search -q "lap trinh vien" --page 2 --format table
  bun run src/cli.ts search -q "backend developer" --limit 20 --format json
  bun run src/cli.ts detail "https://vn.joboko.com/viec-lam-lap-trinh-vien-java-xvi6610939" --format plain
  bun run src/cli.ts slugs

NOTES
  This is an aggregator: it keeps expired postings live and its index skews old.
  Cards carry the deadline, so --open-only filters without extra fetches, and
  \`detail\` reports an \`expired\` flag. Treat both as required, not optional.
  \`detail\` needs the full URL/path — the slug is part of the route, so a bare
  numeric ID cannot be resolved.
`

async function main(): Promise<number> {
  const argv = process.argv.slice(2)
  const flags = parseFlags(argv)
  const cmd = (flags._ as string[])[0]

  if (!cmd || flags.help || flags.h) {
    process.stdout.write(HELP)
    return cmd ? 0 : 1
  }

  if (cmd === "slugs") {
    process.stdout.write(KNOWN_SLUGS.join("\n") + "\n")
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
      openOnly: flags["open-only"] === true || flags.openOnly === true,
      format: (["json", "table", "plain"].includes(fmt) ? fmt : "json") as SearchOpts["format"],
    }
    return runSearch(opts)
  }

  if (cmd === "detail") {
    const id = (flags._ as string[])[1]
    if (!id) {
      process.stderr.write(JSON.stringify({ error: "detail requires an <url|path>", code: "NO_ID" }) + "\n")
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
