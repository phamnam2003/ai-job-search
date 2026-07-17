import {
  SEARCH_URL,
  SEARCH_FIELDS_JOB,
  SEARCH_FIELDS_COMPANY,
  PAGE_SIZE,
  jsonFetch,
  mapJobCard,
  foldDiacritics,
  writeError,
  type JobCard,
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
  meta?: { total?: number; current_page?: number; last_page?: number }
  data?: unknown[]
}

/**
 * Build the search URL with LITERAL `fields[...]` brackets. URLSearchParams would
 * percent-encode the brackets, which makes the API return an empty payload — so
 * we assemble the query string by hand and only encode the free-text keyword.
 */
export function buildSearchUrl(opts: SearchOpts): string {
  const parts = [
    `fields[job]=${SEARCH_FIELDS_JOB}`,
    `fields[company]=${SEARCH_FIELDS_COMPANY}`,
    "include=company",
    `page=${opts.page}`,
    `per_page=${PAGE_SIZE}`,
  ]
  if (opts.query) parts.push(`keyword=${encodeURIComponent(opts.query)}`)
  return `${SEARCH_URL}?${parts.join("&")}`
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
    const body = await jsonFetch<SearchResponse>(buildSearchUrl(opts))
    const raw = body && Array.isArray(body.data) ? body.data : []
    let cards = raw.map((r) => mapJobCard(r as Record<string, unknown>))

    // Location filtering is not supported server-side (the API ignores region
    // params), so filter the fetched page client-side, diacritics-insensitively.
    if (opts.location) {
      const needle = foldDiacritics(opts.location)
      cards = cards.filter((c) => c.location && foldDiacritics(c.location).includes(needle))
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
