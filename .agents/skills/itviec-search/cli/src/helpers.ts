// Data source: ITviec (itviec.com) public, server-rendered search + job pages.
// No authentication required. robots.txt allows crawling (only /subscriptions/new
// is disallowed). We parse the HTML with regex — the markup is a Rails/Stimulus
// render that is shallow and stable enough that a full DOM parser is unnecessary,
// and per-card chunking keeps one malformed card from breaking the rest.
//
// Personal use only. Keep request volume low and polite.

export const BASE = "https://itviec.com"
export const SEARCH_BASE = "https://itviec.com/it-jobs"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

/** Fetch HTML with exponential backoff on 429/5xx. Returns "" on a 404. */
export async function htmlFetch(url: string): Promise<string> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "vi,en;q=0.9",
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
  companyUrl: string | null
  location: string | null
  date: string | null
  salary: string | null
  skills: string[]
  url: string
}

export interface JobDetail {
  id: string
  title: string
  company: string | null
  companyUrl: string | null
  location: string | null
  workingModel: string | null
  date: string | null
  salary: string | null
  skills: string[]
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
 * bullets. Used for the detail-page job description.
 */
function blockText(html: string): string {
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

/** Turn "backend-developer" into a URL path segment. Hyphenates multi-word input. */
export function hyphenate(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** ITviec job id is the trailing number of a job slug (leading zeros are real). */
export function idFromSlug(slug: string): string | null {
  const m = slug.match(/-(\d+)$/)
  return m ? m[1] : null
}

/** Rough human-readable title from a slug — last-resort fallback only. */
function humanizeSlug(slug: string): string {
  return slug
    .replace(/-\d+$/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim()
}

/**
 * The authoritative id/url list: a <script type="application/ld+json"> block of
 * @type "ItemList" whose itemListElement entries carry the canonical job URLs.
 * Parsed first so we always have a reliable set of ids even if card markup shifts.
 */
export function parseItemList(html: string): string[] {
  const urls: string[] = []
  const re = /<script type=['"]application\/ld\+json['"]>([\s\S]*?)<\/script>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    try {
      const json = JSON.parse(m[1].trim())
      if (json && json["@type"] === "ItemList" && Array.isArray(json.itemListElement)) {
        for (const item of json.itemListElement) {
          if (item && typeof item.url === "string") urls.push(item.url)
        }
      }
    } catch {
      // Ignore malformed ld+json blocks.
    }
  }
  return urls
}

/** Extract the skill tags (href="/it-jobs/<skill>?click_source=Skill+tag"). */
function parseSkills(html: string): string[] {
  const skills: string[] = []
  const re =
    /<a[^>]*href=['"]\/it-jobs\/[^'"]*\?click_source=Skill[^'"]*['"][^>]*>([\s\S]*?)<\/a>/gi
  let m: RegExpExecArray | null
  while ((m = re.exec(html)) !== null) {
    const s = clean(m[1])
    if (s && !skills.includes(s)) skills.push(s)
  }
  return skills
}

/**
 * Parse the search results. Each job renders as a `.job-card` div; we split the
 * page on the per-card `data-search--job-selection-job-slug-value=` attribute so
 * every chunk holds exactly one card, then parse each independently. If card
 * parsing yields nothing we fall back to the ItemList ld+json (id + humanized
 * title) so the command still returns the page's jobs.
 */
export function parseJobCards(html: string): JobCard[] {
  const results: JobCard[] = []
  const chunks = html.split(/data-search--job-selection-job-slug-value=/).slice(1)

  for (const chunk of chunks) {
    const slugMatch = chunk.match(/^\s*['"]([^'"]+)['"]/)
    if (!slugMatch) continue
    const slug = slugMatch[1]
    const id = idFromSlug(slug)
    if (!id) continue
    const url = `${SEARCH_BASE}/${slug}`

    // Title: the <h3> tagged as the Stimulus jobTitle target.
    const titleMatch = chunk.match(
      /<h3[^>]*data-search--job-selection-target=['"]jobTitle['"][^>]*>([\s\S]*?)<\/h3>/i,
    )
    let title = titleMatch ? clean(titleMatch[1]) : ""
    if (!title) title = humanizeSlug(slug) // last-resort fallback

    // Company: first /companies/ anchor that carries visible text (the logo
    // anchor to the same href wraps only an image, so it cleans to empty).
    let company: string | null = null
    let companyUrl: string | null = null
    const compRe = /<a[^>]*href=['"](\/companies\/[^'"]+)['"][^>]*>([\s\S]*?)<\/a>/gi
    let cm: RegExpExecArray | null
    while ((cm = compRe.exec(chunk)) !== null) {
      const text = clean(cm[2])
      if (text) {
        company = text
        companyUrl = BASE + decodeHtmlEntities(cm[1]).split("?")[0]
        break
      }
    }

    // Location: the map-pin icon is immediately followed by a div whose title
    // attribute holds the city/cities (e.g. "Ho Chi Minh - Ha Noi").
    const locMatch = chunk.match(/#map-pin[\s\S]*?<div[^>]*title=['"]([^'"]+)['"]/i)
    const location = locMatch ? decodeHtmlEntities(locMatch[1]).trim() || null : null

    // Posted date: the "Posted X ago" span near the top of the card.
    const dateMatch = chunk.match(/>\s*Posted\b([\s\S]*?)<\/span>/i)
    const date = dateMatch ? ("Posted " + clean(dateMatch[1])).trim() : null

    // Salary: often gated behind sign-in for anonymous requests.
    let salary: string | null = null
    const salMatch = chunk.match(/class=['"][^'"]*\bsalary\b[^'"]*['"]>([\s\S]*?)<\/div>/i)
    if (salMatch && !/sign-in-view-salary/i.test(salMatch[1])) {
      salary = clean(salMatch[1]) || null
    }

    results.push({
      id,
      title,
      company,
      companyUrl,
      location,
      date,
      salary,
      skills: parseSkills(chunk),
      url,
    })
  }

  if (results.length === 0) {
    // Fallback: build minimal cards from the authoritative ItemList.
    for (const u of parseItemList(html)) {
      const slug = u.replace(/^https?:\/\/[^/]+\/it-jobs\//, "").replace(/[/?#].*$/, "")
      const id = idFromSlug(slug)
      if (!id) continue
      results.push({
        id,
        title: humanizeSlug(slug),
        company: null,
        companyUrl: null,
        location: null,
        date: null,
        salary: null,
        skills: [],
        url: `${SEARCH_BASE}/${slug}`,
      })
    }
  }

  return results
}

/**
 * Parse the single-job detail page (the lightweight `/content` partial). Returns
 * null when the page is not a real job (ITviec serves an "Oops!" fallback for an
 * unresolved slug/id, which lacks the job-description/job-experiences sections).
 */
export function parseJobDetail(html: string, slug: string): JobDetail | null {
  const hasJob = /<section class=['"]job-(?:description|experiences)['"]/i.test(html)
  if (!hasJob) return null

  const id = idFromSlug(slug) ?? slug

  // Title: the first <h2> on the page (the job header title).
  const titleMatch = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i)
  const title = titleMatch ? clean(titleMatch[1]) : humanizeSlug(slug)

  // Company: the <h2> inside the trailing company-infos section; fall back to
  // the first /companies/ anchor text.
  let company: string | null = null
  let companyUrl: string | null = null
  const compSection = html.match(
    /<section class=['"]company-infos['"][\s\S]*?<h2[^>]*>([\s\S]*?)<\/h2>/i,
  )
  if (compSection) company = clean(compSection[1]) || null
  const compLink = html.match(/<a[^>]*href=['"](\/companies\/[^'"]+)['"][^>]*>([\s\S]*?)<\/a>/i)
  if (compLink) {
    companyUrl = BASE + decodeHtmlEntities(compLink[1]).split("?")[0]
    if (!company) company = clean(compLink[2]) || null
  }

  // Header overview: address (location), working model, and posted date.
  const overview = html.match(/<section class=['"]preview-job-overview['"]>([\s\S]*?)<\/section>/i)?.[1] || ""
  const locMatch = overview.match(/<span class=['"]small-text text-rich-grey['"]>([\s\S]*?)<\/span>/i)
  const location = locMatch ? clean(locMatch[1]) || null : null
  const wmMatch = overview.match(/<span class=['"][^'"]*small-text text-rich-grey ms-1[^'"]*['"]>([\s\S]*?)<\/span>/i)
  const workingModel = wmMatch ? clean(wmMatch[1]) || null : null
  const dateMatch = overview.match(/<span[^>]*>([^<]*\bago)<\/span>/i)
  const date = dateMatch ? clean(dateMatch[1]) || null : null

  // Salary (usually sign-in gated for anonymous requests).
  let salary: string | null = null
  const salMatch = html.match(/class=['"][^'"]*\bsalary\b[^'"]*['"]>([\s\S]*?)<\/div>/i)
  if (salMatch && !/sign-in-view-salary/i.test(salMatch[1])) {
    salary = clean(salMatch[1]) || null
  }

  // Description: span from the reasons/job-description block up to the
  // company-infos section, block-formatted to keep paragraphs and bullets.
  let start = html.search(/<section class=['"]reasons-join-us['"]/i)
  if (start < 0) start = html.search(/<section class=['"]job-description['"]/i)
  let end = html.search(/<section class=['"]company-infos['"]/i)
  if (end < 0) end = html.length
  const description = start >= 0 ? blockText(html.slice(start, end)) || null : null

  return {
    id,
    title,
    company,
    companyUrl,
    location,
    workingModel,
    date,
    salary,
    skills: parseSkills(html),
    url: `${SEARCH_BASE}/${slug}`,
    description,
  }
}

/**
 * Resolve a detail input to a job slug. Accepts a full itviec URL, a
 * `/it-jobs/<slug>` path, or a bare slug ending in `-<id>`. Returns null for a
 * bare numeric id (ITviec detail pages cannot be resolved from the id alone).
 */
export function extractSlug(input: string): string | null {
  const s = input.trim()
  const urlm = s.match(/\/it-jobs\/([^/?#\s]+)/i)
  if (urlm && /-\d+$/.test(urlm[1])) return urlm[1]
  if (/^[a-z0-9]+(?:-[a-z0-9]+)*-\d+$/i.test(s)) return s
  return null
}
