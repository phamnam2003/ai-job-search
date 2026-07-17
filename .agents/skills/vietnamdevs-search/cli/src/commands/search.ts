import {
  SEARCH_BASE,
  htmlFetch,
  hyphenate,
  isRemoteLocation,
  parseJobCards,
  relativeAgeToDays,
  writeError,
  type JobCard,
} from "../helpers.js"

export interface SearchOpts {
  query?: string
  location?: string // VietnamDevs category slug: a city (ha-noi, ho-chi-minh, da-nang) or "remote"
  jobage: number // best-effort: filters on the card's relative posted-age label
  page: number
  limit?: number
  format: "json" | "table" | "plain"
}

/**
 * VietnamDevs search URLs are path-based over its fixed category taxonomy:
 *   /jobs                              browse all
 *   /jobs/<keyword>                    e.g. /jobs/golang, /jobs/back-end
 *   /jobs/<keyword>/<city>             e.g. /jobs/golang/ha-noi
 *   /jobs/<city>                       e.g. /jobs/ha-noi   (city only)
 * Pagination is `?page=<n>` (1-indexed). "remote" is NOT a path segment — it is a
 * per-card label, so it is applied as a client-side filter (see runSearch), not
 * added to the URL.
 */
export function buildUrl(opts: SearchOpts): string {
  const segments: string[] = []
  if (opts.query) segments.push(hyphenate(opts.query))
  if (opts.location && !isRemoteLocation(opts.location)) segments.push(hyphenate(opts.location))
  let url = SEARCH_BASE + (segments.length ? "/" + segments.join("/") : "")
  if (opts.page > 1) url += `?page=${opts.page}`
  return url
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const rows = cards.map((c) => {
    const id = c.id.slice(0, 15).padEnd(15)
    const title = (c.title || "").slice(0, 38).padEnd(38)
    const company = (c.company || "—").slice(0, 22).padEnd(22)
    const loc = (c.location || "—").slice(0, 16).padEnd(16)
    const date = c.date || "—"
    return `${id} ${title} ${company} ${loc} ${date}`
  })
  const header =
    "ID".padEnd(15) +
    " " +
    "TITLE".padEnd(38) +
    " " +
    "COMPANY".padEnd(22) +
    " " +
    "LOCATION".padEnd(16) +
    " AGE"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const html = await htmlFetch(buildUrl(opts))
    let cards = parseJobCards(html)

    // "remote" is a card label, not a URL path — filter client-side.
    if (isRemoteLocation(opts.location)) {
      cards = cards.filter((c) => c.workingModel === "Remote")
    }

    // Best-effort posting-age filter using the card's relative-age label. Cards
    // whose age can't be parsed are kept (never silently dropped).
    if (opts.jobage < 9999) {
      cards = cards.filter((c) => {
        const days = relativeAgeToDays(c.date)
        return days === null || days <= opts.jobage
      })
    }

    if (opts.limit !== undefined && opts.limit >= 0) cards = cards.slice(0, opts.limit)

    if (opts.format === "table") {
      process.stdout.write(renderTable(cards) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(
        cards
          .map(
            (c) =>
              `${c.title}\n  ${c.company || "—"} · ${c.location || "—"} · ${c.date || "—"}` +
              `${c.workingModel ? " · " + c.workingModel : ""}` +
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
