// Data source: Joboko (vn.joboko.com) public listing and detail pages.
// Joboko is a Vietnamese job aggregator (formerly GoodCV) that cross-posts
// listings from other boards, so it catches postings the source-specific CLIs
// miss — at the cost of a stale-skewing index (see ../../url-reference.md).
//
// Listings are server-rendered HTML; detail pages additionally embed a
// schema.org JobPosting block, which the detail parser prefers.
//
// Zero runtime dependencies.

export const BASE = "https://vn.joboko.com"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA = "Mozilla/5.0 (compatible; joboko-cli/1.0)"

/** Fetch HTML with exponential backoff on 429/5xx. Returns "" on a 404. */
export async function htmlFetch(url: string): Promise<string> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "vi-VN,vi;q=0.9,en;q=0.8",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
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
    if (response.status === 404) return ""
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }
    return response.text()
  }
  throw new Error("Request failed after max retries")
}

export interface JobCard {
  id: string
  title: string
  company: string | null
  companyUrl: string | null
  location: string | null
  /** Joboko cards show the deadline, not the posting date. Always null here. */
  date: string | null
  /** Application deadline as ISO YYYY-MM-DD. */
  deadline: string | null
  salary: string | null
  snippet: string | null
  url: string
}

export interface JobDetail extends JobCard {
  description: string | null
  industry: string | null
  employmentType: string | null
  /** True when the page states the posting has expired. */
  expired: boolean
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

function stripTags(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

export function clean(html: string): string {
  return decodeHtmlEntities(stripTags(html))
}

export function toIsoDate(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  const iso = trimmed.match(/^(\d{4}-\d{2}-\d{2})/)
  if (iso) return iso[1]
  const m = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (!m) return null
  const [, d, mo, y] = m
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`
}

/**
 * Joboko's search paths are pre-generated keyword slugs — arbitrary text 404s.
 * `backend-developer` and `lap-trinh-vien` exist; `golang` and `nodejs` do not.
 * Verified 2026-08-04; see ../../url-reference.md.
 */
export const KNOWN_SLUGS = [
  "backend-developer",
  "frontend-developer",
  "fullstack-developer",
  "lap-trinh-vien",
  "developer",
  "it-phan-mem",
  "ky-su-phan-mem",
  "nhan-vien-kinh-doanh",
]

/** City suffixes appended as `-tai-<city>` to a keyword slug. */
export const LOCATION_SLUGS: Record<string, string> = {
  "ha noi": "ha-noi",
  hanoi: "ha-noi",
  "hà nội": "ha-noi",
  "ho chi minh": "ho-chi-minh",
  hcm: "ho-chi-minh",
  "hồ chí minh": "ho-chi-minh",
  "da nang": "da-nang",
  "đà nẵng": "da-nang",
  "hai phong": "hai-phong",
  "can tho": "can-tho",
  "binh duong": "binh-duong",
}

export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function resolveLocationSlug(input: string | undefined): string | null {
  if (!input) return null
  const key = input.trim().toLowerCase()
  return LOCATION_SLUGS[key] ?? slugify(input) ?? null
}

/**
 * Parse the listing page. Each job is a `<div class="item" data-jid="...">`
 * block; we split on that marker and parse each chunk independently.
 */
export function parseJobCards(html: string): JobCard[] {
  const results: JobCard[] = []
  const chunks = html.split(/<div class="item[^"]*" data-jid="/).slice(1)

  for (const chunk of chunks) {
    const idMatch = chunk.match(/^(\d+)"/)
    if (!idMatch) continue
    const id = idMatch[1]

    const link = chunk.match(
      /<h2 class="item-title">\s*<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i,
    )
    if (!link) continue
    const href = decodeHtmlEntities(link[1])
    const title = clean(link[2])
    if (!title) continue

    const comp = chunk.match(/<div class="item-company[^"]*">([\s\S]*?)<\/div>/i)
    const company = comp ? clean(comp[1]) || null : null

    const cidMatch = chunk.match(/^(?:\d+)"[^>]*data-cid="(\d+)"/)
    const compHref = chunk.match(/<a href="(\/[^"]*-xci\d+)"/i)
    const companyUrl = compHref
      ? BASE + decodeHtmlEntities(compHref[1])
      : cidMatch
        ? null
        : null

    const addr = chunk.match(/<div class="item-address">([\s\S]*?)<\/div>/i)
    const location = addr ? clean(addr[1]) || null : null

    const rate = chunk.match(/<div class="item-rate">([\s\S]*?)<\/div>/i)
    const salary = rate ? clean(rate[1]) || null : null

    const text = chunk.match(/<div class="[^"]*item-text">([\s\S]*?)<\/div>/i)
    const snippet = text ? clean(text[1]) || null : null

    // The card's date element carries an ISO timestamp in data-value; despite
    // the generic class name this is the application deadline, not datePosted.
    const dateEl = chunk.match(/<span[^>]*item-date"[^>]*data-value="([^"]+)"/i)
    const deadline = toIsoDate(dateEl ? dateEl[1] : null)

    results.push({
      id,
      title,
      company,
      companyUrl,
      location,
      date: null,
      deadline,
      salary,
      snippet,
      url: href.startsWith("http") ? href : BASE + href,
    })
  }

  return results
}

interface LdJobPosting {
  title?: string
  description?: string
  datePosted?: string
  validThrough?: string
  industry?: string
  employmentType?: string | string[]
  hiringOrganization?: { name?: string; url?: string }
  jobLocation?: unknown
  baseSalary?: unknown
}

export function extractJsonLdJobPosting(html: string): LdJobPosting | null {
  const blocks = [
    ...html.matchAll(
      /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ]
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1]) as Record<string, unknown>
      if (parsed["@type"] === "JobPosting") return parsed as LdJobPosting
    } catch {
      // Malformed block — try the next, then fall back to markup parsing.
    }
  }
  return null
}

function ldLocation(loc: unknown): string | null {
  const places = Array.isArray(loc) ? loc : [loc]
  const names: string[] = []
  for (const p of places) {
    const addr = (p as { address?: Record<string, unknown> })?.address
    if (!addr) continue
    const name =
      (addr.addressLocality as string) ||
      (addr.addressRegion as string) ||
      (addr.streetAddress as string)
    if (name && !names.includes(name)) names.push(name)
  }
  return names.join(", ") || null
}

function richText(html: string | null): string | null {
  if (!html) return null
  const withBreaks = html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|ul|ol|div|h\d)>/gi, "\n")
  return (
    decodeHtmlEntities(stripTags(withBreaks))
      .replace(/\n{3,}/g, "\n\n")
      .trim() || null
  )
}

/** Parse a single job detail page, preferring the embedded JSON-LD block. */
export function parseJobDetail(html: string, id: string, url: string): JobDetail {
  const ld = extractJsonLdJobPosting(html)

  const titleHtml = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  const title = ld?.title?.trim() || (titleHtml ? clean(titleHtml[1]) : null)

  const company = ld?.hiringOrganization?.name?.trim() || null
  const companyUrl = ld?.hiringOrganization?.url || null

  const deadline = ld?.validThrough ? toIsoDate(ld.validThrough) : null
  const date = ld?.datePosted ? toIsoDate(ld.datePosted) : null

  const description = richText(ld?.description ?? null)
  const location = ldLocation(ld?.jobLocation)
  const industry = ld?.industry?.trim() || null

  const rawType = Array.isArray(ld?.employmentType)
    ? ld?.employmentType.join(", ")
    : ld?.employmentType
  const employmentType = rawType ? rawType.replace(/"/g, "").trim() || null : null

  // Joboko keeps expired postings live and marks them with a banner. Surface
  // that as a field so callers never treat a dead listing as open.
  const expired = /h(?:ế|e)t h(?:ạ|a)n n(?:ộ|o)p h(?:ồ|o) s(?:ơ|o)/i.test(html)

  const salaryMatch = html.match(/<div class="item-rate">([\s\S]*?)<\/div>/i)
  const salary = salaryMatch ? clean(salaryMatch[1]) || null : null

  return {
    id,
    title: title || "(untitled)",
    company,
    companyUrl,
    location,
    date,
    deadline,
    salary,
    snippet: null,
    url,
    description,
    industry,
    employmentType,
    expired,
  }
}
