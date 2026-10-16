import {
  API_URL,
  PAGE_SIZE,
  jsonFetch,
  mapJobCard,
  matchesAllTerms,
  writeError,
  type JobCard,
  type RawJob,
} from "../helpers.js"

export interface SearchOpts {
  query?: string
  /** An API location code, already resolved by cli.ts (e.g. "ha-noi"). */
  location?: string
  jobage?: number
  page: number
  limit?: number
  includeExpired: boolean
  strict: boolean
  format: "json" | "table" | "plain"
}

interface SearchResponse {
  data?: {
    jobs?: RawJob[]
    pagination?: { page?: number; limit?: number; total?: number; totalPages?: number }
  }
}

export function buildSearchUrl(opts: SearchOpts): string {
  const params = new URLSearchParams({ limit: String(PAGE_SIZE), page: String(opts.page) })
  if (opts.query) params.set("q", opts.query)
  if (opts.location) params.set("location", opts.location)
  return `${API_URL}?${params.toString()}`
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  const rows = cards.map((c) => {
    const id = c.id.padEnd(25)
    const title = (c.title || "—").slice(0, 40).padEnd(40)
    const company = (c.company || "—").slice(0, 24).padEnd(24)
    const loc = (c.location || "—").slice(0, 16).padEnd(16)
    const date = (c.date || "—").slice(0, 10).padEnd(10)
    const salary = (c.salary || "—").slice(0, 30)
    return `${id} ${title} ${company} ${loc} ${date} ${salary}`
  })
  const header = [
    "ID".padEnd(25),
    "TITLE".padEnd(40),
    "COMPANY".padEnd(24),
    "LOCATION".padEnd(16),
    "POSTED".padEnd(10),
    "SALARY",
  ].join(" ")
  return [header, "-".repeat(header.length + 10), ...rows].join("\n")
}

function renderPlain(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  return cards
    .map((c) => {
      const facts = [c.level, c.experience, c.employmentType].filter(Boolean).join(" · ")
      return (
        `${c.title || "—"}${c.expired ? "  [EXPIRED]" : ""}\n` +
        `  ${c.company || "—"} · ${c.location || "—"} · ${c.salary || "—"}` +
        (facts ? `\n  ${facts}` : "") +
        `\n  posted: ${c.date?.slice(0, 10) || "—"} · deadline: ${c.deadline?.slice(0, 10) || "—"}` +
        `\n  id: ${c.id}\n  ${c.url || "—"}`
      )
    })
    .join("\n\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  try {
    const body = await jsonFetch<SearchResponse>(buildSearchUrl(opts))
    const raw = Array.isArray(body?.data?.jobs) ? body.data.jobs : []
    const pagination = body?.data?.pagination ?? {}
    const now = Date.now()

    // Keyword search mixes closed and past-deadline postings in with open ones,
    // and there is no server-side filter for it, so drop them here by default.
    let kept = raw.map((r) => ({ raw: r, card: mapJobCard(r, now) }))
    const before = kept.length
    if (!opts.includeExpired) kept = kept.filter((k) => !k.card.expired)
    const expiredDropped = before - kept.length

    // The search is fuzzy (similarity-ranked): "golang" also returns "Giảng viên"
    // postings. --strict keeps only postings whose own text contains every term.
    if (opts.strict && opts.query) kept = kept.filter((k) => matchesAllTerms(k.raw, opts.query as string))

    // No posting-age parameter exists server-side; filter on createdAt.
    if (opts.jobage !== undefined) {
      const cutoff = now - opts.jobage * 24 * 60 * 60 * 1000
      kept = kept.filter((k) => {
        const t = k.card.date ? Date.parse(k.card.date) : NaN
        return !Number.isNaN(t) && t >= cutoff
      })
    }

    let cards = kept.map((k) => k.card)
    if (opts.limit !== undefined) cards = cards.slice(0, opts.limit)

    if (opts.format === "table") {
      process.stdout.write(renderTable(cards) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(renderPlain(cards) + "\n")
    } else {
      const meta = {
        count: cards.length,
        page: opts.page,
        totalPages: pagination.totalPages ?? null,
        total: pagination.total ?? null,
        expiredDropped,
      }
      process.stdout.write(JSON.stringify({ meta, results: cards }, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
    return 1
  }
}
