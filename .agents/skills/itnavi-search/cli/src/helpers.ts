// Data source: ITNavi (itnavi.com.vn), a Vietnamese IT job board. Two public,
// unauthenticated surfaces are used:
//   1. Server-rendered search pages   https://itnavi.com.vn/job/<keyword>[/<city>]
//      — a master/detail layout whose left column is a list of `.jsl-item` cards.
//      Each card carries only a numeric `data-id`; it has NO detail hyperlink
//      (clicking a card triggers an in-page AJAX panel swap, not navigation).
//   2. A JSON endpoint                https://itnavi.com.vn/ajax/get-job-by-id/<id>
//      — returns the authoritative { job_slug, job_name, company_name, ... , job_content }
//      for one job. This is the only reliable way to turn a card's id into its real
//      detail URL (ITNavi appends a random suffix to some slugs, e.g. `-O8qvL`, so the
//      slug cannot be derived from the title).
//
// We parse the HTML with regex — the markup is a shallow Laravel/Blade render, and
// per-card chunking keeps one malformed card from breaking the rest.
//
// Personal use only. robots.txt only disallows /admin and /blog/search. Keep
// request volume low and polite.

export const BASE = "https://itnavi.com.vn"
export const SEARCH_BASE = "https://itnavi.com.vn/job"
export const DETAIL_BASE = "https://itnavi.com.vn/job-detail"
export const AJAX_JOB_BY_ID = "https://itnavi.com.vn/ajax/get-job-by-id"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

/**
 * Core fetch with exponential backoff + jitter on 429/5xx (max 6 retries).
 * Returns the body text, or "" for a 404. Throws on other non-OK responses or
 * after exhausting retries.
 */
async function fetchRaw(url: string, accept: string, extra?: Record<string, string>): Promise<string> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: accept,
        "Accept-Language": "vi,en;q=0.9",
        ...extra,
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

/** Fetch a server-rendered HTML page. Returns "" on 404. */
export function htmlFetch(url: string): Promise<string> {
  return fetchRaw(url, "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
}

/**
 * Fetch and parse the get-job-by-id JSON endpoint. Returns the inner `data`
 * object, or null if the job does not exist (ITNavi 302-redirects an unknown id
 * to the homepage, whose HTML is not JSON — so a parse failure means "not found").
 */
export async function fetchJobJson(id: string): Promise<Record<string, unknown> | null> {
  const text = await fetchRaw(`${AJAX_JOB_BY_ID}/${encodeURIComponent(id)}`, "application/json, text/plain, */*", {
    "X-Requested-With": "XMLHttpRequest",
  })
  if (!text) return null
  try {
    const json = JSON.parse(text) as { success?: boolean; data?: Record<string, unknown> }
    if (json && json.success === true && json.data && typeof json.data === "object") {
      return json.data
    }
    return null
  } catch {
    return null
  }
}

export interface JobCard {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null // relative age from the card, humanized ("5 days ago")
  ageDays: number | null // parsed age in days (drives --jobage; also emitted)
  posted: string | null // absolute posted date from enrichment ("Jul 14, 2026")
  salary: string | null // from enrichment
  url: string | null // authoritative detail URL (job_slug) from enrichment
  slug: string | null // last path segment of url
}

export interface JobDetail {
  id: string
  title: string
  company: string | null
  location: string | null
  date: string | null
  salary: string | null
  skills: string[]
  url: string | null
  description: string | null
}

/**
 * Convert a Unicode code point to a string. Uses `fromCodePoint` (not
 * `fromCharCode`) so supplementary-plane code points decode correctly, and drops
 * out-of-range values instead of throwing.
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
    .replace(/&#(\d+);/g, (_, dec) => numericEntity(parseInt(dec, 10)))
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, hex) => numericEntity(parseInt(hex, 16)))
    .replace(/&nbsp;/g, " ")
}

/** Strip tags and collapse whitespace to a single clean line. */
export function clean(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
}

/**
 * Strip tags but preserve block structure as newlines and list items as bullets.
 * Used for the job description.
 */
export function blockText(html: string): string {
  const withBreaks = html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h1|h2|h3|h4|div|section|ul|ol)>/gi, "\n\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<\/li>/gi, "")
    .replace(/<[^>]+>/g, " ")
  return decodeHtmlEntities(withBreaks)
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/** Turn "backend developer" into a URL path segment. Hyphenates multi-word input. */
export function hyphenate(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** Last non-empty path segment of a URL/path (strips query + trailing slash). */
export function slugSegment(url: string): string {
  return url.replace(/[?#].*$/, "").replace(/\/+$/, "").split("/").pop() ?? url
}

/** Rough human-readable title from a slug — last-resort fallback only. */
function humanizeSlug(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

/** Collapse a duplicated comma-separated location like "Ha Noi , Ha Noi" -> "Ha Noi". */
function normalizeLocation(text: string): string {
  const parts = text
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
  const seen: string[] = []
  for (const p of parts) if (!seen.includes(p)) seen.push(p)
  return seen.join(", ")
}

/**
 * Parse a relative posted-age label from a search card (e.g. "5 d", "1 d",
 * "0 d", "3 w"). ITNavi renders `<number> <unit>`; only `d` (days) is observed
 * live, but h/w/mo/y are handled defensively. Returns { days, human }; `days` is
 * null when the label is unparseable (such rows are never dropped by --jobage).
 */
export function parseAge(raw: string): { days: number | null; human: string | null } {
  const trimmed = (raw || "").trim()
  if (!trimmed) return { days: null, human: null }
  const m = trimmed.match(/(\d+)\s*([a-zA-Z]+)/)
  if (!m) return { days: null, human: trimmed }
  const n = parseInt(m[1], 10)
  const unit = m[2].toLowerCase()
  let days: number
  let word: string
  if (unit.startsWith("mo")) {
    days = n * 30
    word = "month"
  } else if (unit.startsWith("h")) {
    days = 0
    word = "hour"
  } else if (unit.startsWith("d")) {
    days = n
    word = "day"
  } else if (unit.startsWith("w")) {
    days = n * 7
    word = "week"
  } else if (unit.startsWith("y")) {
    days = n * 365
    word = "year"
  } else {
    return { days: null, human: trimmed }
  }
  const human = days === 0 ? "today" : `${n} ${word}${n === 1 ? "" : "s"} ago`
  return { days, human }
}

/**
 * Parse the search-results HTML into cards. Each job is a `.jsl-item` div keyed
 * by a numeric `data-id`; we split the page on `data-id=` so each chunk holds one
 * card, then parse independently. `url`/`slug`/`salary`/`posted` are left null —
 * they are filled by enrichment (get-job-by-id) in the search command.
 */
export function parseJobCards(html: string): JobCard[] {
  const results: JobCard[] = []
  const chunks = html.split(/data-id=['"]/).slice(1)

  for (const chunk of chunks) {
    const idMatch = chunk.match(/^(\d+)/)
    if (!idMatch) continue
    const id = idMatch[1]

    // Title is the authoritative marker of a real card; skip a chunk without it.
    const titleMatch = chunk.match(/<h2[^>]*jsl-item__name[^>]*>([\s\S]*?)<\/h2>/i)
    if (!titleMatch) continue
    const title = clean(titleMatch[1])
    if (!title) continue

    const compMatch = chunk.match(/<p[^>]*jsl-item__cpn[^>]*>([\s\S]*?)<\/p>/i)
    const company = compMatch ? clean(compMatch[1]) || null : null

    const locMatch = chunk.match(/<p[^>]*jsl-item__location[^>]*>([\s\S]*?)<\/p>/i)
    const location = locMatch ? clean(locMatch[1]) || null : null

    const ageMatch = chunk.match(/<p[^>]*jsl-item__sm[^>]*>([\s\S]*?)<\/p>/i)
    const { days, human } = parseAge(ageMatch ? clean(ageMatch[1]) : "")

    results.push({
      id,
      title,
      company,
      location,
      date: human,
      ageDays: days,
      posted: null,
      salary: null,
      url: null,
      slug: null,
    })
  }

  return results
}

/** Salary strings that are actually a "log in to view" placeholder → treat as absent. */
function cleanSalary(raw: unknown): string | null {
  if (typeof raw !== "string") return null
  const s = clean(raw)
  if (!s) return null
  if (/đăng nhập|dang nhap|log ?in|sign ?in/i.test(s)) return null
  return s
}

/**
 * Build a JobDetail from the get-job-by-id JSON `data` object (the clean path,
 * used when `detail` is given a numeric id or during search enrichment).
 */
export function parseJobDetailJson(data: Record<string, unknown>): JobDetail {
  const url = typeof data.job_slug === "string" ? data.job_slug : null
  const skillsRaw = Array.isArray(data.skill) ? (data.skill as Array<Record<string, unknown>>) : []
  const skills = skillsRaw
    .map((s) => (typeof s?.name === "string" ? clean(s.name) : ""))
    .filter((s) => s.length > 0)

  return {
    id: data.job_id != null ? String(data.job_id) : url ? slugSegment(url) : "",
    title: typeof data.job_name === "string" ? clean(data.job_name) : "",
    company: typeof data.company_name === "string" ? clean(data.company_name) || null : null,
    location: typeof data.job_addresses === "string" ? clean(data.job_addresses) || null : null,
    date: typeof data.job_published_at === "string" ? clean(data.job_published_at) || null : null,
    salary: cleanSalary(data.job_salary),
    skills,
    url,
    description: typeof data.job_content === "string" ? blockText(data.job_content) || null : null,
  }
}

/**
 * Build a JobDetail by scraping the standalone /job-detail/<slug> page (used when
 * `detail` is given a slug or full URL — the numeric id needed by the JSON
 * endpoint is not derivable from a slug). Returns null when the page is not a real
 * job (an unknown slug 404s, and an id-shaped path redirects to the homepage).
 */
export function parseJobDetailHtml(html: string, slug: string): JobDetail | null {
  const contentMatch = html.match(/<div class=['"]content-strip['"]>/i)
  const titleMatch = html.match(
    /<div[^>]*hot-jobs-content[^>]*>[\s\S]*?<h3[^>]*>([\s\S]*?)<\/h3>/i,
  )
  if (!contentMatch && !titleMatch) return null

  const title = titleMatch ? clean(titleMatch[1]) : humanizeSlug(slug)

  const compMatch = html.match(/<p[^>]*sub-title[^>]*>([\s\S]*?)<\/p>/i)
  const company = compMatch ? clean(compMatch[1]) || null : null

  // Numeric id sits next to the qr-code icon in the overview: <p>ID: 23677</p>.
  const idMatch = html.match(/fa-qrcode[\s\S]*?<p[^>]*>[^<]*?(\d+)\s*<\/p>/i)
  const id = idMatch ? idMatch[1] : slug

  // Posted date is a "MMM D, YYYY" string (e.g. "Jul 16, 2026").
  const dateMatch = html.match(/\b([A-Z][a-z]{2}\s+\d{1,2},\s*\d{4})\b/)
  const date = dateMatch ? dateMatch[1] : null

  const locMatch = html.match(/<li[^>]*class=['"]location\s*['"][^>]*>[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i)
  const location = locMatch ? normalizeLocation(clean(locMatch[1])) || null : null

  const salMatch = html.match(/fa-wallet[\s\S]*?<p[^>]*>([\s\S]*?)<\/p>/i)
  const salary = salMatch ? cleanSalary(salMatch[1]) : null

  const skills: string[] = []
  const tagsBlock = html.match(/<div class=['"]job-details-tags['"]>([\s\S]*?)<\/div>/i)
  if (tagsBlock) {
    const re = /<a[^>]*href=['"][^'"]*\/job\/[^'"]*['"][^>]*>([\s\S]*?)<\/a>/gi
    let m: RegExpExecArray | null
    while ((m = re.exec(tagsBlock[1])) !== null) {
      const s = clean(m[1])
      if (s && !skills.includes(s)) skills.push(s)
    }
  }

  let description: string | null = null
  if (contentMatch && contentMatch.index !== undefined) {
    const after = html.slice(contentMatch.index)
    const endRel = after.search(/<h4>\s*Tags:|jobs-company-area|job-details-sidebar/i)
    description = blockText(after.slice(0, endRel >= 0 ? endRel : after.length)) || null
  }

  return {
    id,
    title,
    company,
    location,
    date,
    salary,
    skills,
    url: `${DETAIL_BASE}/${slug}`,
    description,
  }
}

/**
 * Resolve a `detail` input to a job slug. Accepts a full itnavi /job-detail/<slug>
 * URL, a bare `/job-detail/<slug>` path, or a bare slug. Returns null for a bare
 * numeric id (which the caller routes to the JSON endpoint instead).
 */
export function extractSlug(input: string): string | null {
  const s = input.trim()
  const urlm = s.match(/\/job-detail\/([^/?#\s]+)/i)
  if (urlm) return urlm[1]
  if (/^\d+$/.test(s)) return null // bare id — not a slug
  if (/^[a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*$/.test(s)) return s
  return null
}

/** True when the input is a bare numeric ITNavi job id. */
export function isNumericId(input: string): boolean {
  return /^\d+$/.test(input.trim())
}
