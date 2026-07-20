import {
  API_BASE,
  PAGE_SIZE,
  jsonFetch,
  loadCompanies,
  normalizeJob,
  matchesQuery,
  tokenizeQuery,
  withinAge,
  composeDescription,
  pool,
  writeError,
  type Company,
  type LeverPosting,
  type JobCard,
} from "../helpers.js"

export interface SearchOpts {
  query?: string
  companies?: string // comma-separated board tokens, overrides companies.json
  tag?: string // filter companies.json by tag
  location?: string // client-side substring filter on the job's location
  match: "title" | "full"
  jobage: number
  page: number
  limit?: number
  format: "json" | "table" | "plain"
}

/** Resolve which boards to query: explicit --company wins over companies.json. */
export function resolveCompanies(opts: SearchOpts): Company[] {
  if (opts.companies) {
    return opts.companies
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((token) => ({ token, name: token }))
  }
  let list = loadCompanies()
  if (opts.tag) {
    const want = opts.tag.toLowerCase()
    list = list.filter((c) => (c.tags ?? []).some((t) => t.toLowerCase() === want))
  }
  return list
}

function renderTable(cards: JobCard[]): string {
  if (cards.length === 0) return "No results."
  // The id column is never truncated — it is the input to `detail`.
  const idWidth = Math.max(2, ...cards.map((c) => c.id.length))
  const rows = cards.map((c) => {
    const id = c.id.padEnd(idWidth)
    const title = (c.title || "").slice(0, 42).padEnd(42)
    const company = (c.company || "—").slice(0, 18).padEnd(18)
    const loc = (c.location || "—").slice(0, 28).padEnd(28)
    const date = (c.date || "—").slice(0, 10)
    return `${id} ${title} ${company} ${loc} ${date}`
  })
  const header =
    "ID".padEnd(idWidth) + " " + "TITLE".padEnd(42) + " " + "COMPANY".padEnd(18) + " " + "LOCATION".padEnd(28) + " DATE"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export async function runSearch(opts: SearchOpts): Promise<number> {
  let companies: Company[]
  try {
    companies = resolveCompanies(opts)
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "COMPANIES_FAILED")
    return 1
  }

  if (companies.length === 0) {
    writeError(
      opts.tag
        ? `No companies in companies.json carry the tag "${opts.tag}"`
        : "No companies to search — companies.json is empty and no --company was given",
      "NO_COMPANIES",
    )
    return 1
  }

  const terms = tokenizeQuery(opts.query ?? "")
  const errors: Array<{ company: string; error: string }> = []

  try {
    const perBoard = await pool(companies, async (company) => {
      const url = `${API_BASE}/${encodeURIComponent(company.token)}?mode=json`
      let body: LeverPosting[] | { ok?: boolean; error?: string } | null
      try {
        body = await jsonFetch<LeverPosting[] | { ok?: boolean; error?: string }>(url)
      } catch (e) {
        // One dead board must not sink the whole fan-out.
        errors.push({ company: company.token, error: e instanceof Error ? e.message : String(e) })
        return [] as JobCard[]
      }

      // An unknown token returns 200 with {"ok":false,"error":"Document not found"}
      // rather than a 404, so the array check is what distinguishes a bad token.
      if (!Array.isArray(body)) {
        const msg =
          body && typeof body === "object" && "error" in body && body.error
            ? `${body.error} — check the token`
            : "unexpected response shape — check the token"
        errors.push({ company: company.token, error: msg })
        return [] as JobCard[]
      }

      const out: JobCard[] = []
      for (const posting of body) {
        if (!posting || typeof posting.id !== "string") continue
        const card = normalizeJob(posting, company)
        // Lever ships the description in the list response, so full-text
        // matching costs no extra request.
        const haystack =
          opts.match === "full"
            ? `${card.title} ${card.location ?? ""} ${card.team ?? ""} ${card.department ?? ""} ${composeDescription(posting) ?? ""}`
            : `${card.title} ${card.location ?? ""}`
        if (!matchesQuery(haystack, terms)) continue
        if (!withinAge(card.date, opts.jobage)) continue
        if (opts.location && !(card.location ?? "").toLowerCase().includes(opts.location.toLowerCase())) continue
        out.push(card)
      }
      return out
    })

    // Newest first; undated jobs sink to the bottom.
    const all = perBoard.flat().sort((a, b) => {
      const ta = a.date ? Date.parse(a.date) : 0
      const tb = b.date ? Date.parse(b.date) : 0
      return (isNaN(tb) ? 0 : tb) - (isNaN(ta) ? 0 : ta)
    })

    const start = (opts.page - 1) * PAGE_SIZE
    let cards = all.slice(start, start + PAGE_SIZE)
    if (opts.limit !== undefined && opts.limit >= 0) cards = cards.slice(0, opts.limit)

    if (opts.format === "table") {
      process.stdout.write(renderTable(cards) + "\n")
      if (errors.length) {
        process.stderr.write(`(${errors.length} board(s) failed: ${errors.map((e) => e.company).join(", ")})\n`)
      }
    } else if (opts.format === "plain") {
      process.stdout.write(
        cards
          .map(
            (c) =>
              `${c.title}\n  ${c.company || "—"} · ${c.location || "—"} · ${c.date?.slice(0, 10) || "—"}\n  id: ${c.id}\n  ${c.url}`,
          )
          .join("\n\n") + "\n",
      )
    } else {
      process.stdout.write(
        JSON.stringify(
          {
            meta: {
              count: cards.length,
              page: opts.page,
              totalMatched: all.length,
              pageSize: PAGE_SIZE,
              boardsQueried: companies.length,
              match: opts.match,
              ...(errors.length ? { errors } : {}),
            },
            results: cards,
          },
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
