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

const UA = "Mozilla/5.0 (compatible; itviec-cli/1.0)"

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

/** Drop hidden markup, strip tags and collapse whitespace to a single clean line. */
function clean(html: string): string {
  return decodeHtmlEntities(visibleHtml(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
}

/**
 * Strip tags but preserve block structure as newlines and list items as
 * bullets. Used for the detail-page job description.
 */
function blockText(html: string): string {
  // Hidden markup goes first: finding where a hidden element ends needs the
  // closing tags the break substitutions below replace.
  const withBreaks = visibleHtml(html)
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
