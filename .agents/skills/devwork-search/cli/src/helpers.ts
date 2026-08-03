// Data source: Devwork (devwork.vn) public job listing and detail pages.
// Devwork is a Hanoi-based IT recruitment/referral network — listings carry a
// referral bonus, and salary bands are published far more often than on the
// general Vietnamese boards.
//
// The site is a Nuxt/Vue app, but listings and full descriptions are present in
// the server-rendered HTML, so plain regex parsing suffices — no DOM parser, no
// JS execution, zero runtime dependencies.
//
// Parsing anchors are documented in ../../url-reference.md.

export const BASE = "https://devwork.vn"
export const SEARCH_BASE = `${BASE}/viec-lam`

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"

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
  /** Devwork listings do not show a posting date on the card. Always null. */
  date: string | null
  deadline: string | null
  salary: string | null
  skills: string[]
  url: string
}

export interface JobDetail extends JobCard {
  description: string | null
  requirements: string | null
  benefits: string | null
  employmentType: string | null
  headcount: string | null
  /** Years of experience asked for, verbatim (e.g. "4 năm"). */
  experience: string | null
  /** Seniority band the employer states (e.g. "Senior", "Middle"). */
  level: string | null
  education: string | null
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

/** Devwork prints deadlines already ISO (YYYY-MM-DD); tolerate DD/MM/YYYY too. */
export function toIsoDate(raw: string | null | undefined): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed
  const m = trimmed.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (!m) return null
  const [, d, mo, y] = m
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`
}

/**
 * Devwork's browse paths are fixed skill/technology slugs, not free text — the
 * same shape as vietnamdevs-search. A slug that does not exist returns a page
 * with zero listings rather than a 404.
 */
export const KNOWN_TAGS = [
  "golang",
  "java",
  "javascript",
  "nodejs",
  "reactjs",
  "vuejs",
  "angular",
  "php",
  "laravel",
  "python",
  "ruby",
  "dotnet",
  "android",
  "ios",
  "flutter",
  "devops",
  "tester",
  "business-analyst",
]

export function slugifyTag(query: string): string {
  return encodeURIComponent(query.trim().toLowerCase().replace(/[\s_]+/g, "-"))
}

/**
 * Parse the listing page. Each job is an `<a href="/viec-lam/<id>/<slug>">`
 * wrapping a `listing-body` block; we split on the anchor and parse each chunk
 * independently so one malformed listing cannot break the rest.
 */
export function parseJobCards(html: string): JobCard[] {
  const results: JobCard[] = []
  const chunks = html.split(/<a href="\/viec-lam\/(?=\d+\/)/).slice(1)

  for (const chunk of chunks) {
    const head = chunk.match(/^(\d+)\/([^"]*)"/)
    if (!head) continue
    const id = head[1]
    const slug = head[2]

    // Title lives in the listing-title <h4>.
    const titleMatch = chunk.match(/<div class="listing-title"[^>]*>\s*<h4[^>]*>([\s\S]*?)<\/h4>/i)
    if (!titleMatch) continue
    const title = clean(titleMatch[1])
    if (!title) continue

    // Company name is only exposed as the logo image's alt text.
    const logo = chunk.match(/<div class="listing-logo"[\s\S]{0,400}?<img[^>]*alt="([^"]*)"/i)
    const company = logo ? decodeHtmlEntities(logo[1]).trim() || null : null

    const sal = chunk.match(/<li class="salary[^"]*"[^>]*>([\s\S]*?)<\/li>/i)
    const salary = sal ? clean(sal[1]) || null : null

    const loc = chunk.match(/<li class="location"[^>]*>([\s\S]*?)<\/li>/i)
    const location = loc ? clean(loc[1]) || null : null

    // Skill chips link back to the tag pages.
    const skills = [
      ...chunk.matchAll(/<a href="\/viec-lam\/([a-z0-9-]+)"[^>]*>([^<]*)<\/a>/gi),
    ]
      .map((m) => clean(m[2]))
      .filter(Boolean)

    results.push({
      id,
      title,
      company,
      companyUrl: null,
      location,
      date: null,
      deadline: null,
      salary,
      skills: [...new Set(skills)],
      url: `${BASE}/viec-lam/${id}/${slug}`,
    })
  }

  return results
}

/** Read a `<strong>LABEL</strong> <span>VALUE</span>` pair from the info sidebar. */
function infoField(html: string, label: string): string | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const re = new RegExp(
    `<strong[^>]*>\\s*${escaped}\\s*</strong>\\s*<span[^>]*>([\\s\\S]*?)</span>`,
    "i",
  )
  const m = re.exec(html)
  return m ? clean(m[1]) || null : null
}

/** Read a `<h2 class="block-title">HEADING</h2><div class="block-desc">…</div>` section. */
function blockSection(html: string, heading: string): string | null {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const re = new RegExp(
    `<h2 class="block-title"[^>]*>\\s*${escaped}\\s*</h2>\\s*<div class="block-desc"[^>]*>([\\s\\S]*?)</div>`,
    "i",
  )
  const m = re.exec(html)
  if (!m) return null
  const withBreaks = m[1]
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|ul|ol|div|h\d)>/gi, "\n")
  return (
    decodeHtmlEntities(stripTags(withBreaks))
      .replace(/\n{3,}/g, "\n\n")
      .trim() || null
  )
}

/** Parse a single job detail page. */
export function parseJobDetail(html: string, id: string, url: string): JobDetail {
  // The page carries an empty <h1> in its header shell before the real one, so
  // take the first <h1> that actually has text rather than the first <h1>.
  const title =
    [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)]
      .map((m) => clean(m[1]))
      .find((t) => t.length > 0) ?? "(untitled)"

  // Two `salary-amount` divs exist: the referral bonus ("Tiền thưởng", usually
  // login-gated) comes first, the actual pay band ("Mức lương") second. Anchor on
  // the heading so we never report "Đăng nhập để xem" as the salary.
  const salaryMatch = html.match(
    /<h4[^>]*>\s*M(?:ứ|u)c l(?:ư|u)(?:ơ|o)ng\s*<\/h4>\s*<div class="salary-amount[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  )
  const salary = salaryMatch ? clean(salaryMatch[1]) || null : null

  const deadline = toIsoDate(infoField(html, "Hạn nộp hồ sơ"))
  const employmentType = infoField(html, "Hình thức")
  const headcount = infoField(html, "Số lượng")
  const experience = infoField(html, "Kinh nghiệm")
  const level = infoField(html, "Vị trí")
  const education = infoField(html, "Trình độ")

  // Devwork's detail sidebar has no location row — the city is only on the
  // listing card. Left null rather than guessed; see url-reference.md.
  const location = null

  const companyMatch = html.match(
    /<a[^>]*href="\/cong-ty\/(\d+)\/([^"]*)"[^>]*>([\s\S]{0,120}?)<\/a>/i,
  )
  const company = companyMatch ? clean(companyMatch[3]) || null : null
  const companyUrl = companyMatch
    ? `${BASE}/cong-ty/${companyMatch[1]}/${companyMatch[2]}`
    : null

  // The job's own skill chips sit immediately before the "Mô tả công việc"
  // heading. Scoping to that segment keeps the site-wide search-box suggestions
  // (Laravel/Java/NodeJS/ReactJS/VueJS) out of the result.
  const descIdx = html.search(/<h2 class="block-title"[^>]*>\s*M(?:ô|o) t(?:ả|a) c(?:ô|o)ng vi(?:ệ|e)c/i)
  const skillScope = descIdx > 0 ? html.slice(Math.max(0, descIdx - 1200), descIdx) : ""
  const skills = [
    ...new Set(
      [...skillScope.matchAll(/<a href="\/viec-lam\/([a-z0-9-]+)"[^>]*>([^<]+)<\/a>/gi)]
        .map((m) => clean(m[2]))
        .filter(Boolean),
    ),
  ]

  return {
    id,
    title,
    company,
    companyUrl,
    location,
    date: null,
    deadline,
    salary,
    skills,
    url,
    description: blockSection(html, "Mô tả công việc"),
    requirements: blockSection(html, "Yêu cầu"),
    benefits: blockSection(html, "Quyền lợi"),
    employmentType,
    headcount,
    experience,
    level,
    education,
  }
}
