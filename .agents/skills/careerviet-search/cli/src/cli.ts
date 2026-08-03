#!/usr/bin/env bun
// Self-contained CLI for searching jobs on CareerViet Vietnam (careerviet.vn).
// No external CLI framework and no runtime dependencies, so it runs anywhere
// `bun` is available with nothing installed beyond the repo clone.
//
// CareerViet serves its search results and full job descriptions as plain
// server-rendered HTML on public URLs; this reads those pages. Keep volume
// reasonable and use it for your own job search.

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

const HELP = `careerviet-cli — search jobs on CareerViet Vietnam (careerviet.vn)

USAGE
  bun run src/cli.ts search [--query "<kw>"] [--location <city>] [flags]
  bun run src/cli.ts detail <id|url> [--format json|plain]

SEARCH FLAGS
  --query, -q <text>      Keywords (job title or skill), e.g. "backend", "golang".
  --location, -l <city>   City name or raw CareerViet code. Known names:
                          "ha noi" (4), "ho chi minh" (8), "da nang" (20),
                          "binh duong" (13), "dong nai" (19), "hai phong" (6),
                          "can tho" (17). Any numeric code also works.
  --jobage <days>         Keep postings updated within N days (client-side —
                          CareerViet has no posting-age URL parameter).
  --open-only             Drop postings whose application deadline has passed.
  --sort date             Newest first (adds CareerViet's "sortdv" segment).
  --page <n>              1-indexed page (50 results/page). Default 1.
  --limit, -n <n>         Cap results emitted (client-side).
  --format <fmt>          json (default) | table | plain.

EXAMPLES
  bun run src/cli.ts search -q "backend" -l "ha noi" --format table
  bun run src/cli.ts search -q "golang" --sort date --format table
  bun run src/cli.ts search -q "nodejs" -l "ha noi" --open-only --limit 20 --format json
  bun run src/cli.ts search -q "lập trình" -l "ha noi" --page 2 --format table
  bun run src/cli.ts detail 35C7E79E --format plain
  bun run src/cli.ts detail "https://careerviet.vn/vi/tim-viec-lam/software-engineer-golang-python-java-net.35C7E79E.html" --format plain

NOTES
  Search results carry the application deadline ("Hạn nộp") directly, so
  --open-only filters without needing a detail fetch per job.
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

    for (const name of ["jobage", "page", "limit"]) {
      if (flags[name] !== undefined) {
        const v = parseIntFlag(name, flags[name])
        if (v === null) return 1
        flags[name] = String(v)
      }
    }

    const sortRaw = typeof flags.sort === "string" ? flags.sort.toLowerCase() : undefined
    if (sortRaw !== undefined && sortRaw !== "date") {
      process.stderr.write(
        JSON.stringify({ error: `--sort only supports "date", got "${sortRaw}"`, code: "BAD_ARG" }) + "\n",
      )
      return 1
    }

    const opts: SearchOpts = {
      query: typeof flags.query === "string" ? flags.query : undefined,
      location: typeof flags.location === "string" ? flags.location : undefined,
      jobage: flags.jobage ? parseInt(flags.jobage as string, 10) : 9999,
      page: flags.page ? Math.max(1, parseInt(flags.page as string, 10)) : 1,
      limit: flags.limit ? parseInt(flags.limit as string, 10) : undefined,
      openOnly: flags["open-only"] === true || flags.openOnly === true,
      sort: sortRaw === "date" ? "date" : undefined,
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
