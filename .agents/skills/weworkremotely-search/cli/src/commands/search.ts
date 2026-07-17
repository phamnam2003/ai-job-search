import {
  fetchText,
  feedUrls,
  resolveCategories,
  mergeFeeds,
  dateMs,
  foldDiacritics,
  toCard,
  writeError,
  type FeedItem,
  type JobCard,
} from "../helpers.js"

export interface SearchOpts {
  query?: string
  location?: string
  jobage?: number
  category?: string
  page: number
  limit?: number
  format: "json" | "table" | "plain"
}

const PAGE_SIZE = 10

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const rows = cards.map((c) => {
    const id = (c.id || "").slice(0, 40).padEnd(40)
    const title = (c.title || "—").slice(0, 38).padEnd(38)
    const company = (c.company || "—").slice(0, 24).padEnd(24)
    const loc = (c.location || "—").slice(0, 22).padEnd(22)
    const type = c.type || "—"
    return `${id} ${title} ${company} ${loc} ${type}`
  })
  const header =
    "ID".padEnd(40) +
    " " +
    "TITLE".padEnd(38) +
    " " +
    "COMPANY".padEnd(24) +
    " " +
    "LOCATION".padEnd(22) +
    " TYPE"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

function renderPlain(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  return cards
    .map(
      (c) =>
        `${c.title || "—"}\n  ${c.company || "—"} · ${c.location || "—"} · ${c.type || "—"} · ${c.date || "—"}` +
        (c.skills ? `\n  skills: ${c.skills}` : "") +
        `\n  id: ${c.id}\n  ${c.url}`,
    )
    .join("\n\n")
}

/** All the client-side filters, applied to the merged + date-sorted item list. */
function applyFilters(items: FeedItem[], opts: SearchOpts): FeedItem[] {
  let out = items

  if (opts.query) {
    const tokens = opts.query.toLowerCase().split(/\s+/).filter(Boolean)
    out = out.filter((it) => {
      const hay = `${it.title ?? ""} ${it.company ?? ""} ${it.skills ?? ""} ${it.category ?? ""} ${it.descriptionHtml}`.toLowerCase()
      return tokens.every((t) => hay.includes(t))
    })
  }

  if (opts.location) {
    const needle = foldDiacritics(opts.location)
    out = out.filter((it) => it.location && foldDiacritics(it.location).includes(needle))
  }

  if (opts.jobage !== undefined && opts.jobage > 0 && opts.jobage < 9999) {
    const cutoff = Date.now() - opts.jobage * 86400000
    // Strict: WWR items always carry a pubDate, so drop anything we can't date.
    out = out.filter((it) => dateMs(it.date) >= cutoff && dateMs(it.date) > 0)
  }

  return out
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  const keys = resolveCategories(opts.category)
  if (keys.length === 0) {
    writeError(
      `--category "${opts.category}" matched no feeds (valid: backend, fullstack, frontend, devops, all)`,
      "BAD_CATEGORY",
    )
    return 1
  }

  try {
    const xmls = await Promise.all(feedUrls(keys).map((u) => fetchText(u)))
    let items = mergeFeeds(xmls)
    // Newest first across the merged feeds.
    items.sort((a, b) => dateMs(b.date) - dateMs(a.date))
    items = applyFilters(items, opts)

    const start = (opts.page - 1) * PAGE_SIZE
    let pageItems = items.slice(start, start + PAGE_SIZE)
    if (opts.limit !== undefined && opts.limit >= 0) pageItems = pageItems.slice(0, opts.limit)
    const cards = pageItems.map(toCard)

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
