import {
  SEARCH_BASE,
  clean,
  fetchJobJson,
  htmlFetch,
  hyphenate,
  parseJobCards,
  slugSegment,
  writeError,
  type JobCard,
} from "../helpers.js"

export interface SearchOpts {
  query?: string
  location?: string // ITNavi city slug: ha-noi, ho-chi-minh, da-nang, khac
  jobage: number // best-effort client-side filter on the card's posted-age label
  page: number
  limit?: number
  enrich: boolean // fetch each emitted card's authoritative URL via get-job-by-id
  format: "json" | "table" | "plain"
}

/**
 * ITNavi search URLs are path-based (keyword + city are path segments; ITNavi
 * recognises the city slugs directly), with `?page=<n>` for pagination:
 *   /job                         browse all
 *   /job/<keyword>               e.g. /job/golang
 *   /job/<keyword>/<city>        e.g. /job/backend/ha-noi
 *   /job/<city>                  city browse (no keyword)
 */
export function buildUrl(opts: SearchOpts): string {
  const segments: string[] = []
  if (opts.query) segments.push(hyphenate(opts.query))
  if (opts.location) segments.push(hyphenate(opts.location))
  let url = SEARCH_BASE + (segments.length ? "/" + segments.join("/") : "")
  if (opts.page > 1) url += `?page=${opts.page}`
  return url
}

/**
 * Enrich the emitted cards with their authoritative detail URL (and posted date /
 * salary) via the get-job-by-id JSON endpoint. Done only for the cards actually
 * returned (post --jobage / --limit) to keep request volume low. Each card is
 * enriched independently — one failure leaves that card's url null but never
 * aborts the search.
 */
async function enrichCards(cards: JobCard[]): Promise<void> {
  for (const c of cards) {
    try {
      const data = await fetchJobJson(c.id)
      if (!data) continue
      if (typeof data.job_slug === "string") {
        c.url = data.job_slug
        c.slug = slugSegment(data.job_slug)
      }
      if (typeof data.job_published_at === "string") c.posted = clean(data.job_published_at) || null
      if (typeof data.job_salary === "string") {
        const s = clean(data.job_salary)
        c.salary = s && !/đăng nhập|dang nhap|log ?in|sign ?in/i.test(s) ? s : null
      }
    } catch {
      // Independent per-card: leave this card's enriched fields null.
    }
  }
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const rows = cards.map((c) => {
    const title = (c.title || "").slice(0, 40).padEnd(40)
    const company = (c.company || "—").slice(0, 22).padEnd(22)
    const loc = (c.location || "—").slice(0, 16).padEnd(16)
    const date = c.date || "—"
    return `${c.id.padEnd(6)} ${title} ${company} ${loc} ${date}`
  })
  const header =
    "ID".padEnd(6) +
    " " +
    "TITLE".padEnd(40) +
    " " +
    "COMPANY".padEnd(22) +
    " " +
    "LOCATION".padEnd(16) +
    " POSTED"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const html = await htmlFetch(buildUrl(opts))
    let cards = parseJobCards(html)

    // --jobage: best-effort client-side filter using the card's posted-age label.
    // Rows whose age could not be parsed are kept (never silently dropped).
    if (opts.jobage < 9999) {
      cards = cards.filter((c) => c.ageDays === null || c.ageDays <= opts.jobage)
    }

    if (opts.limit !== undefined && opts.limit >= 0) cards = cards.slice(0, opts.limit)

    if (opts.enrich) await enrichCards(cards)

    if (opts.format === "table") {
      process.stdout.write(renderTable(cards) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(
        cards
          .map(
            (c) =>
              `${c.title}\n  ${c.company || "—"} · ${c.location || "—"} · ${c.date || "—"}` +
              `${c.salary ? " · " + c.salary : ""}\n  id: ${c.id}\n  ${c.url || "(run: detail " + c.id + ")"}`,
          )
          .join("\n\n") + "\n",
      )
    } else {
      process.stdout.write(
        JSON.stringify({ meta: { count: cards.length, page: opts.page }, results: cards }, null, 2) + "\n",
      )
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
    return 1
  }
}
