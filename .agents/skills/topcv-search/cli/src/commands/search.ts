import {
  SEARCH_PREFIX,
  estimateDays,
  htmlFetch,
  hyphenate,
  parseJobCards,
  resolveCity,
  stripAccents,
  writeError,
  type JobCard,
} from "../helpers.js"

export interface SearchOpts {
  query?: string
  location?: string // city name/slug; resolved to TopCV's -tai-<slug>-kl<id> filter
  jobage: number // max posting age in days; best-effort, client-side from card text
  page: number
  limit?: number
  format: "json" | "table" | "plain"
}

/**
 * TopCV search URLs are slug-based:
 *   /tim-viec-lam-<keyword>                              (keyword search)
 *   /tim-viec-lam-<keyword>-tai-<city-slug>-kl<id>       (keyword + city)
 * Pagination is `?page=<n>`. With no query we default the keyword to "it"
 * (returns the broad IT listing). The city suffix is only appended when the
 * location resolves to a known TopCV city; otherwise it is filtered client-side.
 */
export function buildUrl(opts: SearchOpts): string {
  const keyword = opts.query ? hyphenate(opts.query) : "it"
  let path = "/tim-viec-lam-" + keyword
  const city = opts.location ? resolveCity(opts.location) : null
  if (city) path += `-tai-${city.slug}-kl${city.id}`
  let url = "https://www.topcv.vn" + path
  if (opts.page > 1) url += `?page=${opts.page}`
  return url
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const rows = cards.map((c) => {
    const title = (c.title || "").slice(0, 40).padEnd(40)
    const company = (c.company || "—").slice(0, 26).padEnd(26)
    const loc = (c.location || "—").slice(0, 18).padEnd(18)
    const sal = (c.salary || "—").slice(0, 16)
    return `${c.id.padEnd(9)} ${title} ${company} ${loc} ${sal}`
  })
  const header =
    "ID".padEnd(9) +
    " " +
    "TITLE".padEnd(40) +
    " " +
    "COMPANY".padEnd(26) +
    " " +
    "LOCATION".padEnd(18) +
    " SALARY"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const html = await htmlFetch(buildUrl(opts))
    let cards = parseJobCards(html)

    // Client-side location filter: only needed when the city was NOT resolvable
    // to a TopCV filter slug (unknown/typo). Match accent- and separator-
    // insensitively so "bacninh" still matches a "Bắc Ninh" card. Note this only
    // filters the current page's cards.
    if (opts.location && !resolveCity(opts.location)) {
      const norm = (s: string) => stripAccents(s.toLowerCase()).replace(/[^a-z0-9]/g, "")
      const needle = norm(opts.location)
      cards = cards.filter((c) => c.location && norm(c.location).includes(needle))
    }

    // Best-effort posting-age filter from the card's freshness text. Cards whose
    // age can't be parsed are kept (never silently dropped).
    if (opts.jobage < 9999) {
      cards = cards.filter((c) => {
        const days = estimateDays(c.date)
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
