// Data source: VietnamWorks' public job-search microservice (ms.vietnamworks.com).
// No authentication required. It is a POST/JSON endpoint that backs the
// vietnamworks.com React SPA. Search returns job cards; the SAME endpoint returns
// a single job's full body (description/requirement/skills/benefits) when filtered
// by jobId, so `detail` reuses it rather than scraping the SPA HTML.
//
// Personal use only. This reads VietnamWorks' public job data; keep request volume
// low, do not use it commercially or for bulk data collection. Run it on your own
// responsibility.

export const SEARCH_URL = "https://ms.vietnamworks.com/job-search/v1.0/search"

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

/**
 * POST a JSON body and parse the JSON response, with exponential backoff + jitter
 * on 429/5xx. Returns null on a 404. The endpoint wraps errors in an `errors`
 * object with an HTTP-style status, so callers should also check `meta.code`.
 */
export async function jsonPost<T = unknown>(url: string, body: unknown): Promise<T | null> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "User-Agent": UA,
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Language": "vi,en-US;q=0.9,en;q=0.8",
        Origin: "https://www.vietnamworks.com",
        Referer: "https://www.vietnamworks.com/",
      },
      body: JSON.stringify(body),
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
    if (response.status === 404) return null
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }
    return (await response.json()) as T
  }
  throw new Error("Request failed after max retries")
}

export interface JobCard {
  id: string
  title: string | null
  company: string | null
  location: string | null
  date: string | null
  url: string | null
  salary: string | null
  skills: string | null
}

export interface JobDetail extends JobCard {
  description: string | null
}

// --- HTML / entity cleaning ------------------------------------------------
// VietnamWorks job bodies are HTML (<p>, <ul>, <li>) with a mix of numeric
// character references and named Latin-1 entities, alongside real Unicode
// (Vietnamese combining marks arrive pre-decoded via JSON \u escapes). We decode
// named + numeric entities and strip tags, preserving paragraph/list breaks.

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  copy: "©", reg: "®", trade: "™", hellip: "…",
  mdash: "—", ndash: "–", minus: "−",
  lsquo: "‘", rsquo: "’", sbquo: "‚",
  ldquo: "“", rdquo: "”", bdquo: "„",
  laquo: "«", raquo: "»", bull: "•", middot: "·",
  deg: "°", euro: "€", pound: "£", cent: "¢",
  yen: "¥", sect: "§", para: "¶", times: "×",
  divide: "÷", plusmn: "±", micro: "µ",
}

/** Convert a Unicode code point to a string, dropping out-of-range values. */
function numericEntity(cp: number): string {
  return cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : ""
}

export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (m, name: string) =>
      Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, name) ? NAMED_ENTITIES[name] : m,
    )
    .replace(/&#(\d+);/g, (_, dec: string) => numericEntity(parseInt(dec, 10)))
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, hex: string) => numericEntity(parseInt(hex, 16)))
}

/** Collapse an HTML fragment to a single clean line (for titles, short fields). */
export function clean(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim()
}

/** Convert an HTML body to readable plain text, preserving paragraph/list breaks. */
export function htmlToText(html: string): string {
  const withBreaks = html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "\n• ")
    .replace(/<\/(p|div|ul|ol|h[1-6]|tr|table|section|blockquote)>/gi, "\n")
  return decodeHtmlEntities(withBreaks.replace(/<[^>]+>/g, ""))
    .replace(/ /g, " ")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

// --- Diacritics-insensitive matching (for client-side --location filter) ---
export function foldDiacritics(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
}

// --- Field mapping ---------------------------------------------------------
interface RawWorkingLocation {
  cityName?: string | null
  cityNameVI?: string | null
}

interface RawSkill {
  skillName?: string | null
}

export interface RawJob {
  jobId?: number | string
  jobTitle?: string | null
  companyName?: string | null
  alias?: string | null
  jobUrl?: string | null
  prettySalary?: string | null
  approvedOn?: string | null
  approvedOnText?: string | null
  workingLocations?: RawWorkingLocation[] | null
  skills?: RawSkill[] | null
  jobDescription?: string | null
  jobRequirement?: string | null
}

/** Join the working-location city names (English preferred), de-duplicated. */
export function locationOf(raw: RawJob): string | null {
  const locs = raw.workingLocations
  if (!Array.isArray(locs) || locs.length === 0) return null
  const seen = new Set<string>()
  const names: string[] = []
  for (const l of locs) {
    const name = (l.cityName || l.cityNameVI || "").trim()
    if (name && !seen.has(name)) {
      seen.add(name)
      names.push(name)
    }
  }
  return names.length ? names.join(", ") : null
}

function skillsOf(raw: RawJob): string | null {
  const s = raw.skills
  if (!Array.isArray(s) || s.length === 0) return null
  const names = s.map((x) => (x.skillName || "").trim()).filter(Boolean)
  // De-duplicate (the API sometimes lists a skill twice with different ids).
  const uniq = [...new Set(names)]
  return uniq.length ? uniq.join(", ") : null
}

/** Build the canonical detail URL. Prefer the API's jobUrl; else assemble it. */
export function urlOf(raw: RawJob): string | null {
  if (raw.jobUrl && raw.jobUrl.trim()) return raw.jobUrl.trim()
  if (raw.alias && raw.jobId != null) {
    return `https://www.vietnamworks.com/${raw.alias}-${raw.jobId}-jv`
  }
  return null
}

function salaryOf(raw: RawJob): string | null {
  const s = (raw.prettySalary || "").trim()
  return s || null
}

export function mapJobCard(raw: RawJob): JobCard {
  return {
    id: String(raw.jobId ?? ""),
    title: raw.jobTitle ? clean(raw.jobTitle) : null,
    company: raw.companyName ? clean(raw.companyName) : null,
    location: locationOf(raw),
    date: raw.approvedOn ?? raw.approvedOnText ?? null,
    url: urlOf(raw),
    salary: salaryOf(raw),
    skills: skillsOf(raw),
  }
}

/** Assemble the full, readable job description from the detail payload. */
export function buildDescription(raw: RawJob): string | null {
  const sections: string[] = []
  const desc = htmlToText(raw.jobDescription || "")
  if (desc.trim()) sections.push(desc)
  const req = htmlToText(raw.jobRequirement || "")
  if (req.trim()) sections.push(`REQUIREMENTS\n${"-".repeat(12)}\n${req}`)
  const joined = sections.join("\n\n").trim()
  return joined || null
}

export function mapJobDetail(raw: RawJob, id: string): JobDetail {
  return {
    ...mapJobCard({ ...raw, jobId: raw.jobId ?? id }),
    id,
    description: buildDescription(raw),
  }
}

/** Extract the trailing numeric job id from a bare id or a detail URL (…-<id>-jv/-jd). */
export function extractId(input: string): string | null {
  const s = String(input).trim()
  if (/^\d{4,}$/.test(s)) return s
  const m =
    s.match(/-(\d{4,})-(?:jv|jd)\b/i) ||
    s.match(/-(\d{4,})(?:$|[?#])/) ||
    s.match(/(\d{4,})/)
  return m ? m[1] : null
}

/** Days since an ISO timestamp; null if unparseable. */
export function ageInDays(iso: string | null | undefined): number | null {
  if (!iso) return null
  const t = Date.parse(iso)
  if (isNaN(t)) return null
  return (Date.now() - t) / 86400000
}
