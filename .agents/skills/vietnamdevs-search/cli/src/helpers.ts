// Data source: VietnamDevs (vietnamdevs.com) — a curated, English-friendly IT job
// board for the Vietnamese market with many remote/offshore-friendly roles. Pages
// are server-rendered HTML (Laravel/Tailwind), no authentication and no API key.
// We parse the HTML with regex: each result is a shallow `.card-hoverable` block,
// and per-card chunking keeps one malformed card from breaking the rest. Detail
// pages carry a `JobPosting` ld+json block that gives clean structured metadata.
//
// robots.txt allows /jobs (only /google/login, /google/callback, /newsletter/ are
// disallowed). Personal use only — keep request volume low and polite.

export const BASE = "https://vietnamdevs.com"
export const SEARCH_BASE = "https://vietnamdevs.com/jobs"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

/** Fetch HTML with exponential backoff + jitter on 429/5xx. Returns "" on a 404. */
export async function htmlFetch(url: string): Promise<string> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en,vi;q=0.9",
      },
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
  location: string | null
  employmentType: string | null
  workingModel: string | null // "Remote" | "Hybrid" | null (from card labels)
  salary: string | null
  date: string | null // relative age as shown on the card, e.g. "3d", "1w", "2mos"
  tags: string[]
  url: string
}

export interface JobDetail {
  id: string
  title: string
  company: string | null
  companyUrl: string | null
  location: string | null
  employmentType: string | null
  date: string | null // ISO 8601 datePosted from the JobPosting ld+json
  deadline: string | null // ISO 8601 validThrough
  tags: string[]
  url: string
  description: string | null
}

/**
 * Convert a Unicode code point to a string. Uses `fromCodePoint` (not
 * `fromCharCode`) so supplementary-plane code points (e.g. emoji, U+1F600)
 * decode correctly, and drops out-of-range values instead of throwing.
 */
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
    // Numeric character references: decimal (&#233;) and hexadecimal (&#xE9;).
    .replace(/&#(\d+);/g, (_, dec) => numericEntity(parseInt(dec, 10)))
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, hex) => numericEntity(parseInt(hex, 16)))
    .replace(/&nbsp;/g, " ")
}

/** Strip tags and collapse whitespace to a single clean line. */
function clean(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
}

/**
 * Strip tags but preserve block structure as newlines and list items as
 * bullets. Used for the detail-page job description (the `.typography` block).
 */
function blockText(html: string): string {
  const withBreaks = html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<\/li>/gi, "")
    .replace(/<\/(p|h1|h2|h3|h4|div|section|ul|ol)>/gi, "\n\n")
    .replace(/<h([1-4])[^>]*>/gi, "\n\n")
    .replace(/<[^>]+>/g, " ")
  return decodeHtmlEntities(withBreaks)
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/** Turn "Ho Chi Minh" / "back end" into a URL path segment (VietnamDevs category slug). */
export function hyphenate(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** True when a --location value means "remote" (a card-tag filter, not a URL path). */
export function isRemoteLocation(loc: string | undefined): boolean {
  return !!loc && /^remote(\s*working)?$/i.test(loc.trim())
}

/**
 * Parse a VietnamDevs relative-age label ("3d", "1w", "2mos", "5h", "1y") into an
 * approximate number of days, for the best-effort `--jobage` filter. Returns null
 * if the label is not a recognizable relative age (so it is never filtered out).
 */
export function relativeAgeToDays(label: string | null): number | null {
  if (!label) return null
  const s = label.trim().toLowerCase()
  if (/^(just now|today|now)$/.test(s)) return 0
  const m = s.match(/^(\d+)\s*(h|hr|hrs|hour|hours|d|day|days|w|wk|wks|week|weeks|mo|mos|month|months|y|yr|yrs|year|years)\b/)
  if (!m) return null
  const n = parseInt(m[1], 10)
  const unit = m[2]
  if (/^h/.test(unit)) return Math.max(0, Math.round(n / 24))
  if (/^d/.test(unit)) return n
  if (/^w/.test(unit)) return n * 7
  if (/^mo|^month/.test(unit)) return n * 30
  if (/^y/.test(unit)) return n * 365
  return null
}

/** Extract company name from a logo `alt` like `Binance&#039;s logo` → `Binance`. */
function companyFromAlt(alt: string): string | null {
  const decoded = decodeHtmlEntities(alt).trim()
  const stripped = decoded.replace(/['’]?s?\s*logo\s*$/i, "").trim()
  return stripped || null
}

/**
 * Parse the search results page. Each job renders as a `.card-hoverable` block; we
 * split on the class token so every chunk holds exactly one card, then parse each
 * independently. Chunks without a real job-detail link (e.g. a promo card) are
 * skipped, so one malformed card cannot break the rest.
 */
export function parseJobCards(html: string): JobCard[] {
  const results: JobCard[] = []
  const chunks = html.split("card-hoverable").slice(1)

  for (const chunk of chunks) {
    // Detail link: /jobs/<numeric-id>/<slug>. The id is the first path segment.
    const linkMatch = chunk.match(/href=["'](https:\/\/vietnamdevs\.com\/jobs\/(\d+)\/[^"']+)["']/i)
    if (!linkMatch) continue
    const url = decodeHtmlEntities(linkMatch[1])
    const id = linkMatch[2]

    // Title: text of the anchor that points at this job's detail URL.
    let title = ""
    const titleRe = new RegExp(
      `<a[^>]*href=["']${escapeRegExp(linkMatch[1])}["'][^>]*>([\\s\\S]*?)<\\/a>`,
      "i",
    )
    const titleMatch = chunk.match(titleRe)
    if (titleMatch) title = clean(titleMatch[1])

    // Company: the logo <img alt="<Company>'s logo">.
    let company: string | null = null
    const altMatch = chunk.match(/<img[^>]*\balt=["']([^"']*?)["']/i)
    if (altMatch) company = companyFromAlt(altMatch[1])

    // Location + employment type: "<City> · <Type>" in the grey subtitle <p>.
    let location: string | null = null
    let employmentType: string | null = null
    const subMatch = chunk.match(/<p[^>]*class=["'][^"']*text-gray-500[^"']*["'][^>]*>([^<]*)<\/p>/i)
    if (subMatch) {
      const parts = decodeHtmlEntities(subMatch[1]).split("·")
      location = parts[0]?.trim() || null
      employmentType = parts[1]?.trim() || null
    }

    // Posted date: relative age in the right-hand column, e.g. "3d".
    const dateMatch = chunk.match(/text-right[^"']*text-gray-500["'][^>]*>\s*<p[^>]*>([^<]+)<\/p>/i)
    const date = dateMatch ? clean(dateMatch[1]) || null : null

    // Labels: green = salary, orange = "Remote working", yellow = "Hybrid working",
    // gray = skills/level tags.
    const labels = [...chunk.matchAll(/<li[^>]*class=["'][^"']*?\b([a-z]+)-label\b[^"']*["'][^>]*>([\s\S]*?)<\/li>/gi)]
    let salary: string | null = null
    let workingModel: string | null = null
    const tags: string[] = []
    for (const lm of labels) {
      const color = lm[1].toLowerCase()
      const text = clean(lm[2])
      if (!text) continue
      if (color === "green") salary = salary ?? text
      else if (color === "orange") workingModel = /remote/i.test(text) ? "Remote" : workingModel
      else if (color === "yellow") workingModel = workingModel ?? (/hybrid/i.test(text) ? "Hybrid" : null)
      else if (color === "gray" || color === "grey") {
        if (!tags.includes(text)) tags.push(text)
      }
    }

    results.push({
      id,
      title,
      company,
      location,
      employmentType,
      workingModel,
      salary,
      date,
      tags,
      url,
    })
  }

  return results
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

/** Read the first `<script type="application/ld+json">` block whose @type is JobPosting. */
function parseJobPostingLd(html: string): Record<string, unknown> | null {
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    try {
      const json = JSON.parse(m[1].trim())
      if (json && json["@type"] === "JobPosting") return json
    } catch {
      // Ignore malformed ld+json blocks.
    }
  }
  return null
}

function asString(v: unknown): string | null {
  if (typeof v === "string") return v.trim() || null
  return null
}

/** Normalize employmentType (string or array; "FULL_TIME" → "Full-time"). */
function normalizeEmploymentType(v: unknown): string | null {
  const raw = Array.isArray(v) ? v.join(", ") : typeof v === "string" ? v : null
  if (!raw) return null
  return raw
    .split(",")
    .map((t) =>
      t
        .trim()
        .toLowerCase()
        .replace(/_/g, "-")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    )
    .join(", ")
}

/**
 * Parse a single-job detail page. Metadata comes from the `JobPosting` ld+json
 * (reliable, structured); the human-readable description comes from the rendered
 * `.typography` block (the ld+json `description` mashes section headings into the
 * body text with no separators, so it is only a fallback).
 */
export function parseJobDetail(html: string, fallbackId: string): JobDetail | null {
  const ld = parseJobPostingLd(html)
  if (!ld) return null

  const org = (ld.hiringOrganization ?? {}) as Record<string, unknown>
  const loc = (ld.jobLocation ?? {}) as Record<string, unknown>
  const address = (loc.address ?? {}) as Record<string, unknown>
  const identifier = (ld.identifier ?? {}) as Record<string, unknown>

  const url = asString(ld.url) ?? `${SEARCH_BASE}/${fallbackId}`
  const idFromUrl = url.match(/\/jobs\/(\d+)/)?.[1]
  const id = asString(identifier.value) ?? idFromUrl ?? fallbackId

  const title = asString(ld.title) ?? ""
  if (!title) return null

  const company = asString(org.name)
  const companyUrl = asString(org.sameAs)
  const location =
    asString(address.addressLocality) ?? asString(address.addressRegion) ?? asString(loc.name)
  const date = asString(ld.datePosted)
  const deadline = asString(ld.validThrough)
  const employmentType = normalizeEmploymentType(ld.employmentType)

  // Description: first `.typography` block (the job description), block-formatted.
  let description: string | null = null
  const typo = html.match(/<div[^>]*class=["'][^"']*\btypography\b[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)
  if (typo) description = blockText(typo[1]) || null
  if (!description) description = asString(ld.description)

  // Tags: gray-label skill chips also appear on the detail page.
  const tags: string[] = []
  for (const lm of html.matchAll(/<li[^>]*class=["'][^"']*\bgray-label\b[^"']*["'][^>]*>([\s\S]*?)<\/li>/gi)) {
    const t = clean(lm[1])
    if (t && !tags.includes(t)) tags.push(t)
  }

  return {
    id,
    title: clean(title),
    company,
    companyUrl,
    location,
    employmentType,
    date,
    deadline,
    tags,
    url,
    description,
  }
}

/**
 * Resolve a `detail` argument to a fetchable job URL + id. Accepts:
 *  - a full URL: https://vietnamdevs.com/jobs/<id>/<slug>
 *  - a path fragment: <id>/<slug>  or  /jobs/<id>/<slug>
 *  - a bare numeric id: <id>  (a dummy slug is appended; the server 301-redirects
 *    /jobs/<id>/<anything> to the canonical /jobs/<id>/<real-slug>)
 * Returns null if no numeric job id can be found.
 */
export function resolveDetailTarget(input: string): { id: string; url: string } | null {
  const s = input.trim()
  // Full URL or any string containing /jobs/<id>[/<slug>]
  const pathMatch = s.match(/\/jobs\/(\d+)(?:\/([^/?#\s]+))?/i)
  if (pathMatch) {
    const id = pathMatch[1]
    const slug = pathMatch[2] || "job"
    return { id, url: `${SEARCH_BASE}/${id}/${slug}` }
  }
  // Bare "<id>/<slug>"
  const frag = s.match(/^(\d+)\/([^/?#\s]+)$/)
  if (frag) return { id: frag[1], url: `${SEARCH_BASE}/${frag[1]}/${frag[2]}` }
  // Bare numeric id — append a dummy slug; server redirects to the canonical URL.
  if (/^\d+$/.test(s)) return { id: s, url: `${SEARCH_BASE}/${s}/job` }
  return null
}
