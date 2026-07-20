// Data source: Lever's public postings API (v0). No authentication required.
//
// Lever is an ATS, not a job board: there is no global search endpoint. Each
// employer publishes its own board under a token, so `search` fans out across the
// tokens in companies.json and filters client-side.
//
// Unlike Greenhouse, Lever returns the full description inside the *list*
// response, so full-text matching costs nothing extra and is the default.

import { readFileSync } from "node:fs"
import { join } from "node:path"

export const API_BASE = "https://api.lever.co/v0/postings"

/** Results per page for the aggregated, client-side-paginated result set. */
export const PAGE_SIZE = 25

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"

/** Fetch JSON with exponential backoff on 429/5xx. Returns null on 404. */
export async function jsonFetch<T>(url: string): Promise<T | null> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      redirect: "follow",
    })
    if (response.status === 429 || response.status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(`Request failed: ${response.status} ${response.statusText}`)
      }
      const jitter = Math.floor(Math.random() * 500)
      await new Promise((r) => setTimeout(r, delay + jitter))
      delay = Math.min(delay * 2, 8000)
      continue
    }
    if (response.status === 404) return null
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }
    return (await response.json()) as T
  }
  throw new Error("Request failed after max retries")
}

export interface Company {
  token: string
  name: string
  region?: string
  tags?: string[]
  note?: string
}

/** Load the fan-out list. Lives at the skill root so it is easy to hand-edit. */
export function loadCompanies(): Company[] {
  const path = join(import.meta.dir, "..", "..", "companies.json")
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as { companies?: Company[] }
    if (!Array.isArray(parsed.companies)) {
      throw new Error("companies.json must contain a `companies` array")
    }
    return parsed.companies.filter((c) => c && typeof c.token === "string" && c.token.length > 0)
  } catch (e) {
    if (e instanceof Error && "code" in e && (e as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`companies.json not found at ${path}`)
    }
    throw e
  }
}

/** Raw shape of a posting in the Lever v0 API. */
export interface LeverPosting {
  id: string
  text?: string
  createdAt?: number
  country?: string | null
  workplaceType?: string | null
  hostedUrl?: string
  applyUrl?: string
  categories?: {
    commitment?: string | null
    department?: string | null
    location?: string | null
    team?: string | null
    allLocations?: string[]
  } | null
  descriptionPlain?: string
  descriptionBodyPlain?: string
  openingPlain?: string
  additionalPlain?: string
  lists?: Array<{ text?: string; content?: string }>
}

export interface JobCard {
  id: string
  title: string
  company: string | null
  companyToken: string
  location: string | null
  date: string | null
  url: string
  department: string | null
  team: string | null
  commitment: string | null
  workplaceType: string | null
  region: string | null
  tags: string[]
}

export interface JobDetail extends JobCard {
  description: string | null
  allLocations: string[]
  applyUrl: string | null
}

function numericEntity(cp: number): string {
  return cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : ""
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => numericEntity(parseInt(dec, 10)))
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, hex) => numericEntity(parseInt(hex, 16)))
    .replace(/&nbsp;/g, " ")
}

/** Strip HTML to readable text, keeping paragraph and list breaks as newlines. */
export function htmlToText(html: string): string {
  const withBreaks = html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|ul|ol|div|h\d|tr)>/gi, "\n")
  return decodeHtmlEntities(withBreaks.replace(/<[^>]+>/g, ""))
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^[ \t]+/gm, "")
    .trim()
}

/**
 * Lever splits a posting across several fields and any of them can be empty on a
 * given board (amanotes, for example, leaves `descriptionPlain` blank and puts the
 * body in `openingPlain`). Compose whatever is present, in reading order:
 * opening → description body → the `lists` sections → additional.
 */
export function composeDescription(p: LeverPosting): string | null {
  const parts: string[] = []
  const push = (s: string | undefined | null) => {
    const t = (s ?? "").trim()
    if (t) parts.push(t)
  }

  push(p.openingPlain)
  // descriptionPlain usually repeats openingPlain; keep it only when it adds text.
  if (p.descriptionPlain && !parts.some((x) => x.includes(p.descriptionPlain!.trim().slice(0, 80)))) {
    push(p.descriptionPlain)
  }
  push(p.descriptionBodyPlain)

  for (const list of p.lists ?? []) {
    const heading = (list.text ?? "").trim()
    const body = list.content ? htmlToText(list.content) : ""
    if (heading || body) parts.push([heading, body].filter(Boolean).join("\n"))
  }

  push(p.additionalPlain)

  const out = parts.join("\n\n").replace(/\n{3,}/g, "\n\n").trim()
  return out || null
}

/**
 * Build a stable job id. Lever posting ids are UUIDs, but the detail endpoint
 * still needs the board token, so the id carries both: `token/uuid`.
 */
export function makeId(token: string, postingId: string): string {
  return `${token}/${postingId}`
}

const UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"

/** Split a `token/uuid` id or a jobs.lever.co board URL. */
export function parseId(input: string): { token: string; postingId: string } | null {
  const slash = input.match(new RegExp(`^([A-Za-z0-9_-]+)/(${UUID})$`))
  if (slash) return { token: slash[1], postingId: slash[2] }

  // https://jobs.lever.co/<token>/<uuid> (optionally /apply or a trailing slug)
  const url = input.match(new RegExp(`lever\\.co/([A-Za-z0-9_-]+)/(${UUID})`))
  if (url) return { token: url[1], postingId: url[2] }

  // A bare UUID — the board token has to come from --company.
  const bare = input.match(new RegExp(`^${UUID}$`))
  if (bare) return { token: "", postingId: input }

  return null
}

export function normalizeJob(p: LeverPosting, company: Company): JobCard {
  const cats = p.categories ?? {}
  return {
    id: makeId(company.token, p.id),
    title: p.text ? decodeHtmlEntities(p.text).trim() : "(untitled)",
    company: company.name || company.token,
    companyToken: company.token,
    location: cats.location ? decodeHtmlEntities(cats.location).trim() : null,
    // createdAt is epoch milliseconds; normalize to ISO 8601 like the other skills.
    date: typeof p.createdAt === "number" ? new Date(p.createdAt).toISOString() : null,
    url: p.hostedUrl || `https://jobs.lever.co/${company.token}/${p.id}`,
    department: cats.department ?? null,
    team: cats.team ?? null,
    commitment: cats.commitment ?? null,
    workplaceType: p.workplaceType ?? null,
    region: company.region ?? null,
    tags: company.tags ?? [],
  }
}

/**
 * All terms must appear (AND), case-insensitive, matched as substrings.
 * A quoted phrase is kept whole so `-q '"site reliability"'` works.
 */
export function tokenizeQuery(query: string): string[] {
  const terms: string[] = []
  const re = /"([^"]+)"|(\S+)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(query)) !== null) {
    const term = (m[1] ?? m[2] ?? "").trim().toLowerCase()
    if (term) terms.push(term)
  }
  return terms
}

export function matchesQuery(haystack: string, terms: string[]): boolean {
  if (terms.length === 0) return true
  const hay = haystack.toLowerCase()
  return terms.every((t) => hay.includes(t))
}

/** True when the posting date is within `days` of now. Undated jobs are kept. */
export function withinAge(date: string | null, days: number): boolean {
  if (!days || days <= 0 || days >= 9999) return true
  if (!date) return true
  const ts = Date.parse(date)
  if (isNaN(ts)) return true
  return Date.now() - ts <= days * 86400_000
}

/** Run `fn` over `items` with bounded concurrency, preserving input order. */
export async function pool<T, R>(items: T[], fn: (item: T) => Promise<R>, size = 6): Promise<R[]> {
  const out = new Array<R>(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) {
      const idx = next++
      out[idx] = await fn(items[idx])
    }
  })
  await Promise.all(workers)
  return out
}
