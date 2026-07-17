import {
  API_URL,
  PAGE_SIZE,
  jsonFetch,
  isJobEntry,
  mapJobCard,
  matchesQuery,
  matchesTag,
  matchesLocation,
  withinJobage,
  writeError,
  type JobCard,
} from "../helpers.js"

export interface SearchOpts {
  query?: string
  tag?: string
  location?: string
  jobage?: number
  page: number
  limit?: number
  format: "json" | "table" | "plain"
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const rows = cards.map((c) => {
    const id = (c.id || "").padEnd(9)
    const title = (c.title || "—").slice(0, 38).padEnd(38)
    const company = (c.company || "—").slice(0, 24).padEnd(24)
    const loc = (c.location || "—").slice(0, 22).padEnd(22)
    const salary = c.salary || "—"
    return `${id} ${title} ${company} ${loc} ${salary}`
  })
  const header =
    "ID".padEnd(9) +
    " " +
    "TITLE".padEnd(38) +
    " " +
    "COMPANY".padEnd(24) +
    " " +
    "LOCATION".padEnd(22) +
    " SALARY"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

function renderPlain(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  return cards
    .map(
      (c) =>
        `${c.title || "—"}\n  ${c.company || "—"} · ${c.location || "—"} · ${c.salary || "—"}` +
        (c.tags && c.tags.length ? `\n  tags: ${c.tags.join(", ")}` : "") +
        `\n  id: ${c.id}\n  ${c.url || "—"}`,
    )
    .join("\n\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    // RemoteOK's /api returns one array: element [0] is legal metadata, the rest
    // are the latest ~100 postings. All filtering is client-side (the API has no
    // reliable keyword, location, or date parameter — see url-reference.md).
    const body = await jsonFetch<unknown[]>(API_URL)
    let raw = (Array.isArray(body) ? body : []).filter(isJobEntry)

    if (opts.query) raw = raw.filter((r) => matchesQuery(r, opts.query as string))
    if (opts.tag) raw = raw.filter((r) => matchesTag(r, opts.tag as string))
    if (opts.location) raw = raw.filter((r) => matchesLocation(r, opts.location as string))
    if (opts.jobage !== undefined && opts.jobage > 0) {
      raw = raw.filter((r) => withinJobage(r, opts.jobage as number))
    }

    let cards = raw.map(mapJobCard)

    // Client-side pagination over the filtered result set (no server paging).
    const page = Math.max(1, opts.page)
    const start = (page - 1) * PAGE_SIZE
    cards = cards.slice(start, start + PAGE_SIZE)

    if (opts.limit !== undefined && opts.limit >= 0) cards = cards.slice(0, opts.limit)

    if (opts.format === "table") {
      process.stdout.write(renderTable(cards) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(renderPlain(cards) + "\n")
    } else {
      process.stdout.write(
        JSON.stringify({ meta: { count: cards.length, page }, results: cards }, null, 2) + "\n",
      )
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
    return 1
  }
}
