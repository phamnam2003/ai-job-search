import {
  BASE,
  htmlFetch,
  parseJobCards,
  slugify,
  resolveLocationSlug,
  writeError,
  type JobCard,
} from "../helpers.js"

export interface SearchOpts {
  query?: string
  location?: string
  page: number
  limit?: number
  /** Drop postings whose application deadline has already passed. */
  openOnly: boolean
  format: "json" | "table" | "plain"
}

/**
 * Joboko search paths are pre-generated keyword slugs:
 *   /tim-viec-lam-<keyword-slug>                 keyword
 *   /tim-viec-lam-<keyword-slug>-tai-<city>      keyword + city
 *   ?p=<n>                                       pagination (20/page)
 *
 * Note `?p=`, NOT `?page=` — the latter is accepted but silently returns page 1.
 * An unrecognised keyword slug returns HTTP 404 rather than an empty page.
 */
export function buildUrl(opts: SearchOpts): string {
  const kw = opts.query ? slugify(opts.query) : "developer"
  const city = resolveLocationSlug(opts.location)
  const path = city ? `tim-viec-lam-${kw}-tai-${city}` : `tim-viec-lam-${kw}`
  return opts.page > 1 ? `${BASE}/${path}?p=${opts.page}` : `${BASE}/${path}`
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const rows = cards.map((c) => {
    const title = (c.title || "").slice(0, 40).padEnd(40)
    const company = (c.company || "—").slice(0, 28).padEnd(28)
    const loc = (c.location || "—").slice(0, 16).padEnd(16)
    const sal = (c.salary || "—").slice(0, 14).padEnd(14)
    return `${c.id.padEnd(9)} ${title} ${company} ${loc} ${sal} ${c.deadline || "—"}`
  })
  const header =
    "ID".padEnd(9) +
    " " +
    "TITLE".padEnd(40) +
    " " +
    "COMPANY".padEnd(28) +
    " " +
    "LOCATION".padEnd(16) +
    " " +
    "SALARY".padEnd(14) +
    " DEADLINE"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const html = await htmlFetch(buildUrl(opts))
    if (!html) {
      writeError(
        `No Joboko page for that keyword — the site only serves pre-generated slugs. ` +
          `Try a broader term such as "backend developer" or "lap trinh vien".`,
        "NO_SLUG",
      )
      return 1
    }

    let cards = parseJobCards(html)

    if (opts.openOnly) {
      const today = new Date().toISOString().slice(0, 10)
      cards = cards.filter((c) => c.deadline === null || c.deadline >= today)
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
              `  deadline: ${c.deadline || "—"}\n  id: ${c.id}\n  ${c.url}`,
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
