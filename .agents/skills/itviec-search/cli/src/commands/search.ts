import {
  SEARCH_BASE,
  htmlFetch,
  hyphenate,
  parseJobCards,
  writeError,
  type JobCard,
} from "../helpers.js"

export interface SearchOpts {
  query?: string
  location?: string // ITviec city slug path segment, e.g. "ha-noi"
  jobage: number // accepted but best-effort/unsupported (no reliable ITviec param)
  page: number
  limit?: number
  format: "json" | "table" | "plain"
}

/**
 * ITviec search URLs are path-based:
 *   /it-jobs/<keyword>            /it-jobs/<keyword>/<city>
 *   /it-jobs                      /it-jobs/<city>            (browse)
 * Pagination is `?page=<n>`. There is no reliable posting-age query param.
 */
export function buildUrl(opts: SearchOpts): string {
  const segments: string[] = []
  if (opts.query) segments.push(hyphenate(opts.query))
  if (opts.location) segments.push(hyphenate(opts.location))
  let url = SEARCH_BASE + (segments.length ? "/" + segments.join("/") : "")
  if (opts.page > 1) url += `?page=${opts.page}`
  return url
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const rows = cards.map((c) => {
    const title = (c.title || "").slice(0, 40).padEnd(40)
    const company = (c.company || "—").slice(0, 24).padEnd(24)
    const loc = (c.location || "—").slice(0, 22).padEnd(22)
    const date = c.date || "—"
    return `${c.id.padEnd(6)} ${title} ${company} ${loc} ${date}`
  })
  const header =
    "ID".padEnd(6) +
    " " +
    "TITLE".padEnd(40) +
    " " +
    "COMPANY".padEnd(24) +
    " " +
    "LOCATION".padEnd(22) +
    " DATE"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const html = await htmlFetch(buildUrl(opts))
    let cards = parseJobCards(html)
    if (opts.limit !== undefined && opts.limit >= 0) cards = cards.slice(0, opts.limit)

    if (opts.format === "table") {
      process.stdout.write(renderTable(cards) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(
        cards
          .map(
            (c) =>
              `${c.title}\n  ${c.company || "—"} · ${c.location || "—"} · ${c.date || "—"}` +
              `${c.salary ? " · " + c.salary : ""}\n  id: ${c.id}\n  ${c.url}`,
          )
          .join("\n\n") + "\n",
      )
    } else {
      process.stdout.write(
        JSON.stringify(
          { meta: { count: cards.length, page: opts.page }, results: cards },
          null,
          2,
        ) + "\n",
      )
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
    return 1
  }
}
