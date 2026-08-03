import {
  SEARCH_BASE,
  htmlFetch,
  parseJobCards,
  slugifyQuery,
  resolveLocation,
  daysAgo,
  writeError,
  type JobCard,
} from "../helpers.js"

export interface SearchOpts {
  query?: string
  location?: string
  jobage: number
  page: number
  limit?: number
  /** Drop postings whose application deadline has already passed. */
  openOnly: boolean
  sort?: "date"
  format: "json" | "table" | "plain"
}

/**
 * CareerViet search is path-based, not query-string based:
 *   /viec-lam/<keyword-slug>-k-vi.html                keyword only
 *   /viec-lam/<keyword-slug>-kl<code>-vi.html         keyword + location
 *   /viec-lam/<keyword-slug>-k-trang-<n>-vi.html      page 2+
 *   /viec-lam/<keyword-slug>-k-sortdv-vi.html         newest first
 * 50 results per page.
 */
export function buildUrl(opts: SearchOpts): string {
  const slug = opts.query ? slugifyQuery(opts.query) : "viec-lam"
  const code = resolveLocation(opts.location)
  const segments: string[] = [slug, code ? `kl${code}` : "k"]
  if (opts.page > 1) segments.push(`trang-${opts.page}`)
  if (opts.sort === "date") segments.push("sortdv")
  return `${SEARCH_BASE}/${segments.join("-")}-vi.html`
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const rows = cards.map((c) => {
    const title = (c.title || "").slice(0, 40).padEnd(40)
    const company = (c.company || "—").slice(0, 26).padEnd(26)
    const loc = (c.location || "—").slice(0, 18).padEnd(18)
    const dl = (c.deadline || "—").padEnd(10)
    return `${c.id.padEnd(10)} ${title} ${company} ${loc} ${dl} ${c.date || "—"}`
  })
  const header =
    "ID".padEnd(10) +
    " " +
    "TITLE".padEnd(40) +
    " " +
    "COMPANY".padEnd(26) +
    " " +
    "LOCATION".padEnd(18) +
    " " +
    "DEADLINE".padEnd(10) +
    " UPDATED"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const html = await htmlFetch(buildUrl(opts))
    let cards = parseJobCards(html)

    // CareerViet has no posting-age URL parameter, so --jobage is applied
    // client-side against the card's "Cập nhật" (last-updated) date. Cards with
    // no parsable date are kept rather than silently dropped.
    if (opts.jobage > 0 && opts.jobage < 9999) {
      cards = cards.filter((c) => {
        const age = daysAgo(c.date)
        return age === null || age <= opts.jobage
      })
    }

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
              `  deadline: ${c.deadline || "—"} · updated: ${c.date || "—"}\n` +
              `  id: ${c.id}\n  ${c.url}`,
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
