#!/usr/bin/env bun
// Self-contained CLI for searching jobs on JoyWork (joywork.vn), a Vietnamese job
// board, through the public JSON API its own frontend uses. No external CLI
// framework, so it runs anywhere `bun` is available with zero install.
//
// Personal use only. joywork.vn's terms forbid scraping other users' data and
// reverse engineering the platform; this reads public job postings only. Keep
// volume low and do not use it commercially. Run it on your own responsibility.

import { runSearch, type SearchOpts } from "./commands/search.js"
import { runDetail, type DetailOpts } from "./commands/detail.js"
import { PAGE_SIZE, PROVINCES, resolveLocation, writeError } from "./helpers.js"

interface Flags {
  _: string[]
  [k: string]: string | boolean | string[]
}

// Flags that never take a value, so `--strict golang` cannot swallow a word.
const BOOLEAN_FLAGS = new Set(["include-expired", "strict", "help", "h"])

function parseFlags(argv: string[]): Flags {
  const flags: Flags = { _: [] }
  const alias: Record<string, string> = { q: "query", l: "location", n: "limit" }
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a.startsWith("-")) {
      const key = alias[a.replace(/^-+/, "")] ?? a.replace(/^-+/, "")
      const next = argv[i + 1]
      if (BOOLEAN_FLAGS.has(key) || next === undefined || next.startsWith("-")) {
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

const HELP = `joywork-cli — search jobs on JoyWork (joywork.vn), Vietnam

USAGE
  bun run src/cli.ts search [flags]
  bun run src/cli.ts detail <id|url> [--format json|plain]

SEARCH FLAGS
  --query, -q <text>      Keywords (title, skill, role). Fuzzy, similarity-ranked.
  --location, -l <text>   Province: a code ("ha-noi") or name, accents optional
                          ("Hà Nội", "ha noi", "hanoi", "HCM", "Da Nang").
  --jobage <days>         Posted within N days (client-side, on the posting date).
  --strict                Keep only postings whose text contains every --query word.
  --include-expired       Keep closed and past-deadline postings (dropped by default).
  --page <n>              1-indexed page (${PAGE_SIZE} results/page before filtering). Default 1.
  --limit, -n <n>         Cap results emitted (client-side).
  --format <fmt>          json (default) | table | plain.

EXAMPLES
  bun run src/cli.ts search -q "golang" -l "Hà Nội" --strict --format table
  bun run src/cli.ts search -q "backend developer" -l ha-noi --jobage 30 --format table
  bun run src/cli.ts search -l "ha noi" --jobage 7 --format plain
  bun run src/cli.ts detail cmvaaz25x08uhp066wlvmmh9d --format plain

Personal use only — keep volume low (joywork.vn terms, Điều D1).
`

// Long-form flag names each command accepts (parseFlags resolves the short
// aliases q/l/n first). Unknown flags are rejected rather than ignored: a
// discarded filter silently changes what the search returns.
const KNOWN_FLAGS: Record<string, Set<string>> = {
  search: new Set([
    "query", "location", "jobage", "strict", "include-expired", "page", "limit", "format", "help", "h",
  ]),
  detail: new Set(["format", "help", "h"]),
}

function parsePositiveInt(name: string, raw: string | boolean | string[]): number | null {
  // Number(), not parseInt(): parseInt truncates "0.5" to 0 and "7days" to 7.
  const val = typeof raw === "string" ? Number(raw.trim()) : NaN
  if (!Number.isInteger(val) || val < 1) {
    writeError(`--${name} must be a whole number of at least 1, got "${raw}"`, "BAD_ARG")
    return null
  }
  return val
}

async function main(): Promise<number> {
  const flags = parseFlags(process.argv.slice(2))
  const cmd = (flags._ as string[])[0]

  if (!cmd || flags.help || flags.h) {
    process.stdout.write(HELP)
    return cmd ? 0 : 1
  }

  const knownFlags = KNOWN_FLAGS[cmd]
  if (knownFlags) {
    for (const key of Object.keys(flags)) {
      if (key === "_" || knownFlags.has(key)) continue
      writeError(
        `unknown flag --${key} for '${cmd}' - flags are never silently ignored, because a discarded filter changes what the search returns; see --help for the supported flags`,
        "UNKNOWN_FLAG",
      )
      return 1
    }
  }

  if (cmd === "search") {
    for (const name of ["query", "location", "format"]) {
      if (flags[name] === true) {
        writeError(`--${name} needs a value`, "BAD_ARG")
        return 1
      }
    }

    let location: string | undefined
    if (typeof flags.location === "string") {
      const code = resolveLocation(flags.location)
      if (!code) {
        writeError(
          `unknown location "${flags.location}" - use one of the ${Object.keys(PROVINCES).length} province codes or names, e.g. ha-noi, tp-ho-chi-minh, da-nang, hai-phong (full list in SKILL.md)`,
          "BAD_LOCATION",
        )
        return 1
      }
      location = code
    }

    const ints: Record<string, number | undefined> = {}
    for (const name of ["jobage", "page", "limit"]) {
      if (flags[name] === undefined) continue
      const v = parsePositiveInt(name, flags[name])
      if (v === null) return 1
      ints[name] = v
    }

    const fmt = (flags.format as string) || "json"
    if (!["json", "table", "plain"].includes(fmt)) {
      writeError(`--format must be json, table or plain, got "${fmt}"`, "BAD_ARG")
      return 1
    }

    const opts: SearchOpts = {
      query: typeof flags.query === "string" ? flags.query : undefined,
      location,
      jobage: ints.jobage,
      page: ints.page ?? 1,
      limit: ints.limit,
      includeExpired: flags["include-expired"] === true,
      strict: flags.strict === true,
      format: fmt as SearchOpts["format"],
    }
    return runSearch(opts)
  }

  if (cmd === "detail") {
    const id = (flags._ as string[])[1]
    if (!id) {
      writeError("detail requires an <id|url>", "NO_ID")
      return 1
    }
    const fmt = (flags.format as string) || "json"
    if (!["json", "plain"].includes(fmt)) {
      writeError(`--format must be json or plain for detail, got "${fmt}"`, "BAD_ARG")
      return 1
    }
    const opts: DetailOpts = { id, format: fmt as DetailOpts["format"] }
    return runDetail(opts)
  }

  writeError(`Unknown command "${cmd}"`, "BAD_CMD")
  return 1
}

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    writeError(e instanceof Error ? e.message : String(e), "INTERNAL_ERROR")
    process.exit(1)
  })
