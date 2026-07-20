// Data source: Greenhouse's public Job Board API. No authentication required.
//
// Greenhouse is an ATS, not a job board: there is no global search endpoint. Each
// employer publishes its own board under a token, so `search` fans out across the
// tokens in companies.json and filters client-side.
//
// Responses are JSON, so no HTML parsing is needed for the listing — only the
// `content` field (when requested) is HTML and gets stripped for text matching.

import { readFileSync } from "node:fs"
import { join } from "node:path"

export const API_BASE = "https://boards-api.greenhouse.io/v1/boards"

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

/** Raw shape of a job in the Greenhouse board API. */
export interface GhJob {
  id: number
  title?: string
  absolute_url?: string
  location?: { name?: string } | null
  updated_at?: string
  first_published?: string
  company_name?: string
  content?: string
  departments?: Array<{ name?: string }>
  metadata?: unknown
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
  region: string | null
  tags: string[]
}

export interface JobDetail extends JobCard {
  description: string | null
  updatedAt: string | null
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
 * Greenhouse double-encodes `content`: the field is an HTML-escaped HTML
 * document, so it needs one entity decode before the tags are even visible.
 */
export function decodeContent(content: string): string {
  return htmlToText(decodeHtmlEntities(content))
}

/**
 * Build a stable job id. Greenhouse job ids are only unique per board, and the
 * detail endpoint needs the board token, so the id carries both: `token/jobId`.
 */
export function makeId(token: string, jobId: number | string): string {
  return `${token}/${jobId}`
}

/** Split a `token/jobId` id, a board URL, or a `gh_jid=` apply link. */
export function parseId(input: string): { token: string; jobId: string } | null {
  const slash = input.match(/^([A-Za-z0-9_-]+)\/(\d+)$/)
  if (slash) return { token: slash[1], jobId: slash[2] }

  // https://boards.greenhouse.io/<token>/jobs/<id> (also job-boards.greenhouse.io)
  const boardUrl = input.match(/greenhouse\.io\/(?:embed\/job_app\?for=)?([A-Za-z0-9_-]+)\/jobs\/(\d+)/)
  if (boardUrl) return { token: boardUrl[1], jobId: boardUrl[2] }

  // Company careers page carrying ?gh_jid=<id> — the token must come from --company.
  const ghJid = input.match(/[?&]gh_jid=(\d+)/)
  if (ghJid) return { token: "", jobId: ghJid[1] }

  return null
}

export function normalizeJob(job: GhJob, company: Company): JobCard {
  const date = job.first_published || job.updated_at || null
  return {
    id: makeId(company.token, job.id),
    title: job.title ? decodeHtmlEntities(job.title).trim() : "(untitled)",
    company: company.name || job.company_name || null,
    companyToken: company.token,
    location: job.location?.name ? decodeHtmlEntities(job.location.name).trim() : null,
    date,
    url: job.absolute_url || `https://job-boards.greenhouse.io/${company.token}/jobs/${job.id}`,
    department: job.departments?.[0]?.name ? String(job.departments[0].name) : null,
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
