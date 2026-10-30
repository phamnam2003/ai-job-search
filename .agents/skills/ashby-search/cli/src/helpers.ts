// Data source: Ashby's public Posting API. No authentication required.
//
// Ashby is an ATS, not a job board: there is no global search endpoint. Each
// employer publishes its own board under a name, so `search` fans out across the
// boards in companies.json and filters client-side.
//
// Like Lever (and unlike Greenhouse), Ashby returns the full description inside
// the *list* response, so full-text matching costs nothing extra and is default.

import { readFileSync } from "node:fs"
import { join } from "node:path"

export const API_BASE = "https://api.ashbyhq.com/posting-api/job-board"

/** Results per page for the aggregated, client-side-paginated result set. */
export const PAGE_SIZE = 25

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA = "Mozilla/5.0 (compatible; ashby-cli/1.0)"

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

/** Raw shape of a job in the Ashby posting API. */
export interface AshbyJob {
  id: string
  title?: string
  department?: string | null
  team?: string | null
  employmentType?: string | null
  location?: string | null
  secondaryLocations?: Array<{ location?: string }>
  publishedAt?: string
  isListed?: boolean
  isRemote?: boolean
  workplaceType?: string | null
  jobUrl?: string
  applyUrl?: string
  descriptionHtml?: string
  descriptionPlain?: string
  compensation?: unknown
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
  employmentType: string | null
  workplaceType: string | null
  isRemote: boolean | null
  secondaryLocations: string[]
  region: string | null
  tags: string[]
}

export interface JobDetail extends JobCard {
  description: string | null
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

/**
 * Characters a reader of the posting never sees but a model reading this
 * output does: C0/C1 controls other than tab, newline and carriage return, the
 * soft hyphen, bidi marks/embeddings/overrides/isolates, zero-width characters
 * and invisible operators, the BOM, variation selectors, and Unicode tag
 * characters (U+E0000-E007F), which can spell out a whole hidden instruction.
 * Listing text is third-party data, and these arrive raw in a portal's JSON or
 * markup as easily as through a numeric entity.
 */
const INVISIBLE_CHARS =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F­؜᠎​-‏‪-‮⁠-⁯︀-️﻿\u{E0000}-\u{E007F}\u{E0100}-\u{E01EF}]/gu

/** Strip INVISIBLE_CHARS from every string in a result, recursively: the CLI's output boundary. */
export function stripInvisible<T>(value: T): T {
  if (typeof value === "string") return value.replace(INVISIBLE_CHARS, "") as T
  if (Array.isArray(value)) return value.map(stripInvisible) as T
  if (value !== null && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, stripInvisible(v)])) as T
  }
  return value
}

const VOID_TAGS = new Set(["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"])

/** Whether an opening tag's attributes keep it from rendering: `hidden`, or an inline style that hides it. */
function isHiddenTag(attrs: string): boolean {
  for (const m of attrs.matchAll(/([^\s"'=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g)) {
    const name = m[1].toLowerCase()
    const value = m[2] ?? m[3] ?? m[4] ?? ""
    if (name === "hidden") return true
    if (name === "style" && /(?:^|;)\s*(?:display\s*:\s*none|visibility\s*:\s*hidden|mso-hide\s*:\s*all)\b/i.test(value)) {
      return true
    }
  }
  return false
}

/**
 * Drop markup a browser never renders - comments (including Word's
 * conditional ones), <script>/<style>/<template> blocks, and elements marked
 * hidden - before tags are stripped. A plain tag strip keeps their text, which
 * hands the model words the posting's reader never saw. CSS-only tricks
 * (off-screen, zero font size) need a renderer and are not caught here.
 */
export function visibleHtml(html: string): string {
  const src = html
    .replace(/<!--[\s\S]*?(?:-->|$)/g, "")
    .replace(/<(script|style|template)\b[^>]*>[\s\S]*?(?:<\/\1\s*>|$)/gi, "")
  // One pass, collecting what is kept: slicing the string per hidden element
  // would make a page full of them quadratic.
  const open = /<([a-zA-Z][a-zA-Z0-9-]*)(\s[^>]*)?>/g
  const kept: string[] = []
  let from = 0
  let m: RegExpExecArray | null
  while ((m = open.exec(src)) !== null) {
    if (!m[2] || !isHiddenTag(m[2])) continue
    const tag = m[1].toLowerCase()
    let end = open.lastIndex
    if (!VOID_TAGS.has(tag) && !m[0].endsWith("/>")) {
      // Skip to the matching close tag, counting nested same-name elements. An
      // unclosed hidden element runs to the end: failing closed drops visible
      // text, failing open would leak the hidden text.
      const same = new RegExp(`<(/?)${tag}\\b[^>]*>`, "gi")
      same.lastIndex = end
      end = src.length
      let depth = 1
      let s: RegExpExecArray | null
      while ((s = same.exec(src)) !== null) {
        if (s[1]) depth--
        else if (!s[0].endsWith("/>")) depth++
        if (depth === 0) {
          end = same.lastIndex
          break
        }
      }
    }
    kept.push(src.slice(from, m.index))
    from = end
    open.lastIndex = end
  }
  kept.push(src.slice(from))
  return kept.join("")
}

/** Strip HTML to readable text, keeping paragraph and list breaks as newlines. */
export function htmlToText(html: string): string {
  const withBreaks = visibleHtml(html)
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|ul|ol|div|h\d|tr)>/gi, "\n")
  return decodeHtmlEntities(withBreaks.replace(/<[^>]+>/g, ""))
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^[ \t]+/gm, "")
    .trim()
}

/**
 * Ashby ships both `descriptionPlain` and `descriptionHtml`. Prefer the plain
 * field; fall back to stripping the HTML when a board leaves it empty.
 */
export function jobDescription(job: AshbyJob): string | null {
  const plain = (job.descriptionPlain ?? "").trim()
  if (plain) return plain
  const html = (job.descriptionHtml ?? "").trim()
  return html ? htmlToText(html) || null : null
}

/**
 * Build a stable job id. Ashby job ids are UUIDs, but the posting API is
 * per-board and has no by-id lookup, so the id carries the board: `board/uuid`.
 */
export function makeId(token: string, jobId: string): string {
  return `${token}/${jobId}`
}

const UUID = "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"

/** Split a `board/uuid` id or a jobs.ashbyhq.com board URL. */
export function parseId(input: string): { token: string; jobId: string } | null {
  const slash = input.match(new RegExp(`^([A-Za-z0-9_.-]+)/(${UUID})$`))
  if (slash) return { token: slash[1], jobId: slash[2] }

  // https://jobs.ashbyhq.com/<board>/<uuid> (optionally /application or a slug)
  const url = input.match(new RegExp(`ashbyhq\\.com/([A-Za-z0-9_.-]+)/(${UUID})`))
  if (url) return { token: url[1], jobId: url[2] }

  // A bare UUID — the board has to come from --company.
  const bare = input.match(new RegExp(`^${UUID}$`))
  if (bare) return { token: "", jobId: input }

  return null
}

export function normalizeJob(job: AshbyJob, company: Company): JobCard {
  return {
    id: makeId(company.token, job.id),
    title: job.title ? decodeHtmlEntities(job.title).trim() : "(untitled)",
    company: company.name || company.token,
    companyToken: company.token,
    location: job.location ? decodeHtmlEntities(job.location).trim() : null,
    date: job.publishedAt ?? null,
    url: job.jobUrl || `https://jobs.ashbyhq.com/${company.token}/${job.id}`,
    department: job.department ?? null,
    team: job.team ?? null,
    employmentType: job.employmentType ?? null,
    workplaceType: job.workplaceType ?? null,
    isRemote: typeof job.isRemote === "boolean" ? job.isRemote : null,
    secondaryLocations: (job.secondaryLocations ?? [])
      .map((s) => (s?.location ?? "").trim())
      .filter(Boolean),
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

/**
 * Ashby carries a job's extra locations in `secondaryLocations`, so a role open
 * in both New York and Vietnam only mentions Vietnam there. Location filtering
 * has to search both or it silently drops matches.
 */
export function locationMatches(card: JobCard, needle: string): boolean {
  const want = needle.toLowerCase()
  if ((card.location ?? "").toLowerCase().includes(want)) return true
  return card.secondaryLocations.some((l) => l.toLowerCase().includes(want))
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
