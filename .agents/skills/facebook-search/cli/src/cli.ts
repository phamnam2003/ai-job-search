#!/usr/bin/env bun
// Self-contained CLI for turning Facebook recruitment posts into structured jobs.
//
// IMPORTANT: this CLI NEVER contacts Facebook. It does not log in, fetch, or
// scrape. Facebook is login-walled with aggressive anti-bot measures and its
// ToS forbids automated access, so this skill is deliberately zero-network:
//   * `links`  builds Facebook search URLs for you to open and browse yourself.
//   * `search`/`detail`/`parse` read posts YOU paste into the inbox folder.
// No credentials, no automation, no account-ban risk. See SKILL.md.

import { readFileSync } from "fs"
import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"
import { runLinks, type LinksOpts } from "./commands/links.js"
import { defaultInbox, defaultGroupsPath, parsePost, writeError } from "./helpers.js"

interface Flags {
  _: string[]
  [k: string]: string | boolean | string[]
}

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { _: [] }
  const alias: Record<string, string> = { q: "query", l: "location", n: "limit" }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith("-")) {
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

const HELP = `facebook-cli — turn Facebook recruitment posts into structured jobs (zero-network)

This CLI never contacts Facebook. It builds search links for you to browse, and
parses posts you paste into the inbox folder. See SKILL.md for the workflow.

USAGE
  bun run src/cli.ts links  --query "<kw>" [--location <city>] [--format json|table|plain]
  bun run src/cli.ts search [--query "<kw>"] [--location <city>] [flags]
  bun run src/cli.ts detail <id|file.txt> [--format json|plain]
  bun run src/cli.ts parse  <file.txt> [--format json|plain]

LINKS FLAGS
  --query, -q <text>   Keywords to search Facebook for. REQUIRED.
  --location, -l <c>   Optional city appended to the query (e.g. "Hà Nội").
  --groups <path>      Groups whitelist JSON (default: <skill>/groups.json).
  --format <fmt>       json (default) | table | plain.

SEARCH FLAGS  (reads the inbox folder of pasted posts)
  --query, -q <text>   Filter inbox posts by keyword (title/company/tags/body).
  --location, -l <c>   Filter by detected location.
  --inbox <dir>        Inbox folder (default: <skill>/inbox).
  --jobage <days>      Accepted for /scrape compatibility; posts rarely carry a
                       parseable post-date, so this is a no-op (see SKILL.md).
  --limit, -n <n>      Cap results emitted.
  --format <fmt>       json (default) | table | plain.

EXAMPLES
  bun run src/cli.ts links -q "tuyển Golang backend" -l "Hà Nội" --format plain
  bun run src/cli.ts search -q "golang" -l "Hà Nội" --format table
  bun run src/cli.ts detail fb-1234567890123456 --format plain
  bun run src/cli.ts parse ../inbox/abc-backend.txt --format json

Zero-network by design — no Facebook login, fetch, or scraping (Facebook ToS).
`

function parseIntFlag(name: string, raw: string | boolean | string[]): number | null {
  const val = parseInt(raw as string, 10)
  if (isNaN(val)) {
    writeError(`--${name} must be a number, got "${String(raw)}"`, "BAD_ARG")
    return null
  }
  return val
}

function pickFormat(fmt: string, allowTable: boolean): "json" | "table" | "plain" {
  const allowed = allowTable ? ["json", "table", "plain"] : ["json", "plain"]
  return (allowed.includes(fmt) ? fmt : "json") as "json" | "table" | "plain"
}

function main(): number {
  const argv = process.argv.slice(2)
  const flags = parseFlags(argv)
  const cmd = (flags._ as string[])[0]

  if (!cmd || flags.help || flags.h) {
    process.stdout.write(HELP)
    return cmd ? 0 : 1
  }

  const fmt = typeof flags.format === "string" ? flags.format : "json"

  if (cmd === "links") {
    const query = typeof flags.query === "string" ? flags.query : undefined
    if (!query) {
      writeError('the --query/-q flag is required (e.g. -q "tuyển Golang backend")', "NO_QUERY")
      return 1
    }
    const opts: LinksOpts = {
      query,
      location: typeof flags.location === "string" ? flags.location : undefined,
      groupsPath: typeof flags.groups === "string" ? flags.groups : defaultGroupsPath(),
      format: pickFormat(fmt, true),
    }
    return runLinks(opts)
  }

  if (cmd === "search") {
    if (flags.limit !== undefined) {
      const v = parseIntFlag("limit", flags.limit)
      if (v === null) return 1
      flags.limit = String(v)
    }
    if (flags.jobage !== undefined) {
      const v = parseIntFlag("jobage", flags.jobage)
      if (v === null) return 1
    }
    const opts: SearchOpts = {
      query: typeof flags.query === "string" ? flags.query : undefined,
      location: typeof flags.location === "string" ? flags.location : undefined,
      inbox: typeof flags.inbox === "string" ? flags.inbox : defaultInbox(),
      limit: flags.limit ? parseInt(flags.limit as string, 10) : undefined,
      format: pickFormat(fmt, true),
    }
    return runSearch(opts)
  }

  if (cmd === "detail") {
    const idOrFile = (flags._ as string[])[1]
    if (!idOrFile) {
      writeError("detail requires an <id|file.txt>", "NO_ID")
      return 1
    }
    const opts: DetailOpts = {
      idOrFile,
      inbox: typeof flags.inbox === "string" ? flags.inbox : defaultInbox(),
      format: fmt === "plain" ? "plain" : "json",
    }
    return runDetail(opts)
  }

  if (cmd === "parse") {
    const file = (flags._ as string[])[1]
    if (!file) {
      writeError("parse requires a <file.txt>", "NO_FILE")
      return 1
    }
    try {
      const job = parsePost(readFileSync(file, "utf8"), file)
      if (fmt === "plain") {
        process.stdout.write(
          `${job.title}\n${job.company || "—"} · ${job.location || "—"} · ${job.salary || "—"}\n${job.url || "(no link)"}\n`,
        )
      } else {
        process.stdout.write(JSON.stringify(job, null, 2) + "\n")
      }
      return 0
    } catch (e) {
      writeError(e instanceof Error ? e.message : String(e), "PARSE_FAILED")
      return 1
    }
  }

  writeError(`Unknown command "${cmd}"`, "BAD_CMD")
  return 1
}

process.exit(main())
