import {
  SEARCH_BASE,
  htmlFetch,
  parseJobCards,
  slugifyTag,
  writeError,
  type JobCard,
} from "../helpers.js"

export interface SearchOpts {
  query?: string
  location?: string
  page: number
  limit?: number
  format: "json" | "table" | "plain"
}

/**
 * Devwork browse URLs are fixed technology-tag paths:
 *   /viec-lam            all listings
 *   /viec-lam/<tag>      one technology, e.g. golang, nodejs, reactjs
 *   ?page=<n>            pagination (20 listings/page)
 */
export function buildUrl(opts: SearchOpts): string {
  const path = opts.query ? `${SEARCH_BASE}/${slugifyTag(opts.query)}` : SEARCH_BASE
  return opts.page > 1 ? `${path}?page=${opts.page}` : path
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const rows = cards.map((c) => {
    const title = (c.title || "").slice(0, 42).padEnd(42)
    const company = (c.company || "—").slice(0, 26).padEnd(26)
    const loc = (c.location || "—").slice(0, 16).padEnd(16)
    const sal = (c.salary || "—").slice(0, 16).padEnd(16)
    return `${c.id.padEnd(7)} ${title} ${company} ${loc} ${sal} ${c.skills.slice(0, 3).join("/")}`
  })
  const header =
    "ID".padEnd(7) +
    " " +
    "TITLE".padEnd(42) +
    " " +
    "COMPANY".padEnd(26) +
    " " +
    "LOCATION".padEnd(16) +
    " " +
    "SALARY".padEnd(16) +
    " SKILLS"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const html = await htmlFetch(buildUrl(opts))
    let cards = parseJobCards(html)

    // Devwork has no location parameter, so -l is a client-side substring match
    // over the card's location text (diacritic-insensitive).
    if (opts.location) {
      const needle = fold(opts.location)
      cards = cards.filter((c) => c.location && fold(c.location).includes(needle))
    }

    if (opts.limit !== undefined && opts.limit >= 0) cards = cards.slice(0, opts.limit)

    if (opts.format === "table") {
      process.stdout.write(renderTable(cards) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(
        cards
          .map(
            (c) =>
              `${c.title}\n  ${c.company || "—"} · ${c.location || "—"} · ${c.salary || "—"}\n` +
              `  skills: ${c.skills.join(", ") || "—"}\n  id: ${c.id}\n  ${c.url}`,
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

/** Lowercase and strip Vietnamese diacritics so "ha noi" matches "Hà Nội". */
function fold(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim()
}
