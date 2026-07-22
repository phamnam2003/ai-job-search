import {
  SEARCH_URL,
  jsonPost,
  mapJobCard,
  foldDiacritics,
  ageInDays,
  writeError,
  type JobCard,
  type RawJob,
} from "../helpers.js"

export interface SearchOpts {
  query?: string
  location?: string
  jobage?: number
  page: number
  limit?: number
  format: "json" | "table" | "plain"
}

interface SearchResponse {
  meta?: { code?: number; nbHits?: number; page?: number; nbPages?: number }
  data?: RawJob[]
  errors?: { detail?: string }
}

// The API accepts up to a large hitsPerPage; we request a generous page so the
// client-side location/jobage filters have material to work with, then cap to
// --limit. Kept bounded to stay a single request per page.
const HITS_PER_PAGE = 50

/** Build the POST body for the search microservice. `page` is 0-indexed there. */
export function buildSearchBody(opts: SearchOpts): Record<string, unknown> {
  return {
    userId: 0,
    query: opts.query ?? "",
    filter: [],
    ranges: [],
    order: [{ field: "approvedOn", value: "desc" }],
    hitsPerPage: HITS_PER_PAGE,
    page: Math.max(0, opts.page - 1),
  }
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const rows = cards.map((c) => {
    const id = (c.id || "").padEnd(9)
    const title = (c.title || "—").slice(0, 40).padEnd(40)
    const company = (c.company || "—").slice(0, 26).padEnd(26)
    const loc = (c.location || "—").slice(0, 22).padEnd(22)
    const salary = c.salary || "—"
    return `${id} ${title} ${company} ${loc} ${salary}`
  })
  const header =
    "ID".padEnd(9) +
    " " +
    "TITLE".padEnd(40) +
    " " +
    "COMPANY".padEnd(26) +
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
        (c.skills ? `\n  skills: ${c.skills}` : "") +
        `\n  id: ${c.id}\n  ${c.url || "—"}`,
    )
    .join("\n\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const body = await jsonPost<SearchResponse>(SEARCH_URL, buildSearchBody(opts))
    if (body?.errors) {
      writeError(body.errors.detail || "API returned an error", "SEARCH_FAILED")
      return 1
    }
    const raw = body && Array.isArray(body.data) ? body.data : []
    let cards = raw.map(mapJobCard)

    // Location filtering is done client-side (the microservice's own location
    // filter field is undocumented and unreliable), diacritics-insensitively
    // against the working-location city names.
    if (opts.location) {
      const needle = foldDiacritics(opts.location)
      cards = cards.filter((c) => c.location && foldDiacritics(c.location).includes(needle))
    }

    // Posting-age filter, client-side against the ISO approvedOn we stored as `date`.
    if (opts.jobage !== undefined && opts.jobage > 0) {
      cards = cards.filter((c) => {
        const age = ageInDays(c.date)
        return age === null ? true : age <= opts.jobage!
      })
    }

    if (opts.limit !== undefined && opts.limit >= 0) cards = cards.slice(0, opts.limit)

    if (opts.format === "table") {
      process.stdout.write(renderTable(cards) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(renderPlain(cards) + "\n")
    } else {
      process.stdout.write(
        JSON.stringify({ meta: { count: cards.length, page: opts.page }, results: cards }, null, 2) +
          "\n",
      )
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
    return 1
  }
}
