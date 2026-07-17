// Data source: TopCV (topcv.vn), Vietnam's largest-volume job board. Public,
// server-rendered search + job-detail pages — no authentication, no API key, no
// Cloudflare challenge. We parse the HTML with regex: the markup is a shallow,
// stable server render, and per-card chunking keeps one malformed card from
// breaking the rest.
//
// Personal use only. TopCV's robots.txt allows the search/detail paths; still
// keep request volume low and polite (TopCV is large and may rate-limit).

export const BASE = "https://www.topcv.vn"
export const SEARCH_PREFIX = "https://www.topcv.vn/tim-viec-lam-"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

const STATUS_MARKER = "\nHTTPSTATUS:"

/**
 * One HTTP GET via the `curl` binary. TopCV's WAF fingerprints the TLS/HTTP
 * client and blocks Bun/undici's `fetch` (even the homepage returns 403 with a
 * full browser header set), while curl's fingerprint is allowed. curl ships with
 * Windows 10+ , macOS, and virtually every Linux, so this keeps the CLI free of
 * npm dependencies. `--compressed` handles gzip/br; the status code is appended
 * to stdout after a unique marker so we can read it without a temp file.
 */
async function curlGet(url: string): Promise<{ status: number; body: string }> {
  const proc = Bun.spawn(
    [
      "curl",
      "-sSL",
      "--compressed",
      "--max-time",
      "40",
      "-A",
      UA,
      "-H",
      "Accept-Language: vi,en;q=0.9",
      "-H",
      "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "-w",
      `${STATUS_MARKER}%{http_code}`,
      url,
    ],
    { stdout: "pipe", stderr: "pipe" },
  )
  const [out] = await Promise.all([new Response(proc.stdout).text(), proc.exited])
  const i = out.lastIndexOf(STATUS_MARKER)
  if (i < 0) {
    const err = await new Response(proc.stderr).text()
    throw new Error(`curl produced no HTTP status${err ? `: ${err.trim()}` : ""}`)
  }
  const status = parseInt(out.slice(i + STATUS_MARKER.length), 10)
  return { status, body: out.slice(0, i) }
}

/**
 * Fetch HTML with exponential backoff + jitter on 429/5xx. Returns "" on a 404.
 * Uses curl (see curlGet); if curl is unavailable, falls back to native fetch
 * (which TopCV usually blocks, so a clear error surfaces).
 */
export async function htmlFetch(url: string): Promise<string> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    let status: number
    let body: string
    try {
      ;({ status, body } = await curlGet(url))
    } catch (e) {
      // curl missing/failed to spawn — try native fetch once so the user still
      // gets a real response (or a clear 403) instead of a spawn error.
      const response = await fetch(url, {
        headers: {
          "User-Agent": UA,
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "vi,en;q=0.9",
        },
        redirect: "follow",
      })
      status = response.status
      body = response.status === 404 ? "" : await response.text()
    }

    // TopCV's WAF returns a transient 403 under rapid back-to-back requests
    // (verified: the same URL returns 200 when spaced out), so 403 is retried
    // with backoff alongside 429/5xx rather than failing hard.
    if (status === 429 || status === 403 || status >= 500) {
      if (attempt === maxRetries) {
        throw new Error(`Request failed: ${status}`)
      }
      const jitter = Math.floor(Math.random() * 500)
      await new Promise((r) => setTimeout(r, delay + jitter))
      delay = Math.min(delay * 2, 8000)
      continue
    }
    if (status === 404) return ""
    if (status < 200 || status >= 300) {
      throw new Error(`Request failed: ${status}`)
    }
    return body
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
  url: string
}

export interface JobDetail {
  id: string
  title: string
  company: string | null
  companyUrl: string | null
  location: string | null
  salary: string | null
  deadline: string | null
  url: string
  description: string | null
  requirements: string | null
  benefits: string | null
}

/**
 * Convert a Unicode code point to a string. Uses `fromCodePoint` (not
 * `fromCharCode`) so supplementary-plane code points decode correctly, and
 * drops out-of-range values instead of throwing.
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
export function clean(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
}

/**
 * Strip tags but preserve block structure as newlines and list items as
 * bullets. Used for the detail-page job sections.
 */
export function blockText(html: string): string {
  const withBreaks = html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|h[1-4]|div|section|ul|ol|tr)>/gi, "\n")
    .replace(/<li[^>]*>/gi, "\n- ")
    .replace(/<\/li>/gi, "")
    .replace(/<[^>]+>/g, " ")
  return decodeHtmlEntities(withBreaks)
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/** Turn "backend developer" into a URL slug segment. Hyphenates multi-word input. */
export function hyphenate(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/** Remove Vietnamese diacritics + đ→d, for accent-insensitive matching. */
export function stripAccents(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
}

/**
 * TopCV location filter. Cities are encoded in the search slug as
 * `-tai-<city-slug>-kl<id>` (e.g. `-tai-ha-noi-kl1`). This is the ONLY location
 * form that actually filters server-side — the `?city_id=`/`?locations=` query
 * params are silently ignored by TopCV. Ids captured live (2026-07). A `--location`
 * value not in this map falls back to a client-side filter on the card's city text.
 */
export const CITY_MAP: Record<string, number> = {
  "ha-noi": 1, "ho-chi-minh": 2, "binh-duong": 3, "bac-ninh": 4, "dong-nai": 5,
  "hung-yen": 6, "hai-duong": 7, "da-nang": 8, "hai-phong": 9, "an-giang": 10,
  "ba-ria-vung-tau": 11, "bac-giang": 12, "bac-kan": 13, "bac-lieu": 14, "ben-tre": 15,
  "binh-dinh": 16, "binh-phuoc": 17, "binh-thuan": 18, "ca-mau": 19, "can-tho": 20,
  "cao-bang": 21, "cuu-long": 22, "dak-lak": 23, "dac-nong": 24, "dien-bien": 25,
  "dong-thap": 26, "gia-lai": 27, "ha-giang": 28, "ha-nam": 29, "ha-tinh": 30,
  "hau-giang": 31, "hoa-binh": 32, "khanh-hoa": 33, "kien-giang": 34, "kon-tum": 35,
  "lai-chau": 36, "lam-dong": 37, "lang-son": 38, "lao-cai": 39, "long-an": 40,
  "nam-dinh": 44, "nghe-an": 45, "ninh-binh": 46, "ninh-thuan": 47, "phu-tho": 48,
  "phu-yen": 49, "quang-binh": 50, "quang-nam": 51, "quang-ngai": 52, "quang-ninh": 53,
  "quang-tri": 54, "soc-trang": 55, "son-la": 56, "tay-ninh": 57, "thai-binh": 58,
  "thai-nguyen": 59, "thanh-hoa": 60, "thua-thien-hue": 61, "tien-giang": 62,
  "tra-vinh": 64, "tuyen-quang": 65, "vinh-long": 66, "vinh-phuc": 67, "yen-bai": 68,
}

/** Common shorthand → canonical city slug. */
const CITY_ALIASES: Record<string, string> = {
  hanoi: "ha-noi", hn: "ha-noi", "ha-noi-city": "ha-noi",
  hcm: "ho-chi-minh", "hcmc": "ho-chi-minh", tphcm: "ho-chi-minh",
  saigon: "ho-chi-minh", "sai-gon": "ho-chi-minh", sg: "ho-chi-minh",
  "ho-chi-minh-city": "ho-chi-minh", "thanh-pho-ho-chi-minh": "ho-chi-minh",
  danang: "da-nang", "da-nang-city": "da-nang",
}

/** Resolve a `--location` value to a TopCV `{ slug, id }`, or null if unknown. */
export function resolveCity(input: string): { slug: string; id: number } | null {
  const norm = hyphenate(stripAccents(input))
  const slug = CITY_ALIASES[norm] ?? norm
  const id = CITY_MAP[slug]
  return id !== undefined ? { slug, id } : null
}

/**
 * Extract the numeric job id from a TopCV detail URL. Two shapes:
 *   /brand/<company>/tuyen-dung/<slug>-j<ID>.html   → digits after `-j`
 *   /viec-lam/<slug>/<ID>.html                       → trailing numeric id
 */
export function idFromUrl(url: string): string | null {
  const j = url.match(/-j(\d+)\.html/i)
  if (j) return j[1]
  const v = url.match(/\/(\d+)\.html/i)
  if (v) return v[1]
  return null
}

/**
 * Best-effort: turn a Vietnamese relative-time string ("2 tuần trước",
 * "3 ngày trước", "Đăng 5 giờ trước") into an approximate age in days. Returns
 * null when no time token is found (caller keeps such cards rather than dropping
 * them). Weeks/months/years are approximated (×7 / ×30 / ×365).
 */
export function estimateDays(text: string | null): number | null {
  if (!text) return null
  const t = stripAccents(text.toLowerCase())
  if (/\b(hom nay|vua xong|vua dang|moi dang)\b/.test(t)) return 0
  const m = t.match(/(\d+)\s*(phut|gio|ngay|tuan|thang|nam)/)
  if (!m) return null
  const n = parseInt(m[1], 10)
  switch (m[2]) {
    case "phut":
    case "gio":
      return 0
    case "ngay":
      return n
    case "tuan":
      return n * 7
    case "thang":
      return n * 30
    case "nam":
      return n * 365
    default:
      return null
  }
}

/**
 * Parse the search results page. Each job renders as a `.job-item-search-result`
 * div; we split on the container class so every chunk holds exactly one card,
 * then parse each independently so one malformed card cannot break the rest.
 */
export function parseJobCards(html: string): JobCard[] {
  const results: JobCard[] = []
  const chunks = html.split(/class="job-item-search-result/).slice(1)

  for (const chunk of chunks) {
    // id: authoritative per-card attribute.
    const idMatch = chunk.match(/data-job-id="(\d+)"/i)
    if (!idMatch) continue
    const id = idMatch[1]

    // url: first job-detail link (either the /brand/...-j<id>.html or the
    // /viec-lam/<slug>/<id>.html shape). Query string (tracking) is dropped.
    const urlMatch = chunk.match(
      /href="(https:\/\/www\.topcv\.vn\/(?:brand|viec-lam)\/[^"]+?\.html)/i,
    )
    if (!urlMatch) continue
    const url = decodeHtmlEntities(urlMatch[1])

    // title: inside the <h3 class="title …"> the job-link anchor wraps a tooltip
    // <span title="TITLE">TITLE</span>. Read that span's title attribute, scoped
    // to after the job-link anchor so a box-label-top badge ("HOT"/"Gấp") before
    // it, or the verified-employer badge <i title="…"> after it, cannot leak in.
    let title = ""
    const h3 = chunk.match(/<h3[^>]*class="[^"]*\btitle\b[^"]*"[^>]*>([\s\S]*?)<\/h3>/i)
    if (h3) {
      const spanTitle = h3[1].match(
        /<a[^>]*href="[^"]*(?:viec-lam|brand)[^"]*"[^>]*>[\s\S]*?<span[^>]*\btitle="([^"]+)"/i,
      )
      if (spanTitle) title = decodeHtmlEntities(spanTitle[1]).trim()
    }
    if (!title) {
      // Fallback: the avatar anchor's aria-label carries the full job title.
      const aria = chunk.match(/aria-label="([^"]+)"/i)
      if (aria) title = decodeHtmlEntities(aria[1]).trim()
    }
    if (!title && h3) {
      // Last resort: strip the badge blocks and clean the anchor text.
      const inner = h3[1]
        .replace(/<div class="box-label-top">[\s\S]*?<\/div>/i, "")
        .split(/<span class="icon-verified-employer/)[0]
      title = clean(inner)
    }

    // company: the .company-name span (title attr = full name, text = same).
    let company: string | null = null
    const compTitle = chunk.match(/class="company-name"[^>]*title="([^"]*)"/i)
    if (compTitle) company = decodeHtmlEntities(compTitle[1]).trim() || null
    if (!company) {
      const compText = chunk.match(/class="company-name"[^>]*>([\s\S]*?)<\/span>/i)
      if (compText) company = clean(compText[1]) || null
    }

    // companyUrl: the wrapping company anchor (/cong-ty/... or /brand/...).
    let companyUrl: string | null = null
    const compHref = chunk.match(
      /<a[^>]*class="[^"]*\bcompany\b[^"]*"[^>]*href="(https:\/\/www\.topcv\.vn\/(?:cong-ty|brand)\/[^"]+)"/i,
    )
    if (compHref) companyUrl = decodeHtmlEntities(compHref[1]).split("?")[0]

    // location: the .city-text span (e.g. "Hà Nội", "Hồ Chí Minh (mới)").
    const locMatch = chunk.match(/class="city-text"[^>]*>([\s\S]*?)<\/span>/i)
    const location = locMatch ? clean(locMatch[1]) || null : null

    // salary: the .salary label (e.g. "Thoả thuận", "10 - 20 triệu").
    const salMatch = chunk.match(/<label class="salary">\s*<span>([\s\S]*?)<\/span>/i)
    const salary = salMatch ? clean(salMatch[1]) || null : null

    // date: the .label-update freshness label ("Đăng 2 tuần trước").
    const dateMatch = chunk.match(
      /<label class="[^"]*\blabel-update\b[^"]*"[^>]*>([\s\S]*?)<\/label>/i,
    )
    const date = dateMatch ? clean(dateMatch[1]) || null : null

    results.push({ id, title, company, companyUrl, location, date, salary, url })
  }

  return results
}

/** Detail-page section headings (Vietnamese) → our field names. */
function sectionBody(html: string, headings: string[]): string | null {
  // All detail-item titles in document order, with positions.
  const titles = [
    ...html.matchAll(/box-job-information-detail-item__title--title[^>]*>([\s\S]*?)<\/h2>/gi),
  ].map((m) => ({
    name: clean(m[1]),
    start: m.index ?? 0,
    end: (m.index ?? 0) + m[0].length,
  }))
  const idx = titles.findIndex((t) => headings.some((h) => t.name === h))
  if (idx < 0) return null
  const from = titles[idx].end
  const to = idx + 1 < titles.length ? titles[idx + 1].start : html.length
  let zone = html.slice(from, to)
  // Prefer the __text body when present; otherwise block-format the whole zone.
  const tm = zone.match(/box-job-information-detail-item__text[^>]*>([\s\S]*)$/i)
  if (tm) zone = tm[1]
  // Trim trailing noise: the sibling "required-tag" (industry/skill tags) block,
  // and the next section's wrapper markup that `to` clipped mid-tag (the zone end
  // lands inside the next `<h2 class="…title--title">`, leaving a bare `<h2 class="`).
  zone = zone.split(/<div[^>]*\brequired-tag\b/i)[0]
  zone = zone.split(/<div class="box-job-information-detail-item/i)[0]
  zone = zone.replace(/<[^>]*$/, "") // drop any trailing incomplete tag
  return blockText(zone) || null
}

/**
 * Parse a single-job detail page (either the /viec-lam/ or /brand/ shape — the
 * markup is identical). Returns null when the page carries no job sections (an
 * expired/invalid id resolves to a generic page).
 */
export function parseJobDetail(html: string, url: string): JobDetail | null {
  const hasJob = /box-job-information-detail-item__title--title/i.test(html)
  if (!hasJob) return null

  const id = idFromUrl(url) ?? url

  // title: the header <h1>. On verified-employer postings the <h1> also wraps a
  // badge <span class="icon-verified-employer ...> — cut it off before cleaning.
  let title = ""
  const h1 =
    html.match(/<h1[^>]*class="[^"]*box-header-job__title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i) ||
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)
  if (h1) title = clean(h1[1].split(/<span class="icon-verified-employer/)[0])
  if (!title) {
    // Fallback: the <title> tag reads "Tuyển <JOB> làm việc tại <COMPANY> ...".
    const tt = html.match(/<title>\s*Tuyển\s+([\s\S]*?)\s+làm việc tại/i)
    if (tt) title = clean(tt[1])
  }

  // company: the first real /cong-ty/ or /brand/ anchor (skip Vue templates and
  // the generic "Xem trang công ty" / "Tuyển dụng" call-to-action links).
  let company: string | null = null
  let companyUrl: string | null = null
  const compRe =
    /<a[^>]*href="(https:\/\/www\.topcv\.vn\/(?:cong-ty|brand)\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi
  let cm: RegExpExecArray | null
  while ((cm = compRe.exec(html)) !== null) {
    const text = clean(cm[2])
    if (text && !text.includes("{{") && text.length > 3 && !/^(Xem|Tuyển|Theo|Chi tiết)/.test(text)) {
      company = text
      companyUrl = decodeHtmlEntities(cm[1]).split("?")[0]
      break
    }
  }

  // salary: the header salary label.
  const salMatch = html.match(/box-header-job__salary"[^>]*>([\s\S]*?)<\/[a-z]/i)
  const salary = salMatch ? clean(salMatch[1]) || null : null

  // location + deadline: the header info items ("Địa điểm …", "Hạn ứng tuyển …").
  let location: string | null = null
  let deadline: string | null = null
  for (const m of html.matchAll(
    /box-header-job-list-info__item"[^>]*>([\s\S]*?)<\/div>\s*<\/div>/gi,
  )) {
    const text = clean(m[1].replace(/<svg[\s\S]*?<\/svg>/gi, ""))
    if (/^Địa điểm/.test(text)) location = text.replace(/^Địa điểm\s*/, "") || null
    else if (/^Hạn ứng tuyển/.test(text)) deadline = text.replace(/^Hạn ứng tuyển\s*/, "") || null
  }

  const description = sectionBody(html, ["Mô tả công việc"])
  const requirements = sectionBody(html, ["Yêu cầu ứng viên"])
  const benefits = sectionBody(html, ["Quyền lợi ứng viên", "Quyền lợi"])

  return {
    id,
    title,
    company,
    companyUrl,
    location,
    salary,
    deadline,
    url: url.split("?")[0],
    description,
    requirements,
    benefits,
  }
}

/**
 * Resolve a `detail` input to a fetchable job URL + id. Accepts:
 *   - a full TopCV job URL (either the /brand/ or /viec-lam/ shape)
 *   - a bare numeric id → reconstructed as /viec-lam/j/<id>.html (TopCV resolves
 *     a job by its trailing id regardless of the slug segment, verified live)
 * Returns null for anything else (garbage input → BAD_ID upstream).
 */
export function resolveDetailTarget(input: string): { url: string; id: string } | null {
  const s = input.trim()
  // A TopCV job-detail URL (either shape).
  const urlm = s.match(/https?:\/\/(?:www\.)?topcv\.vn\/(?:brand|viec-lam)\/[^\s"']+?\.html/i)
  if (urlm) {
    const url = urlm[0].replace(/^http:/, "https:")
    const id = idFromUrl(url) ?? ""
    return { url, id }
  }
  // A bare numeric id → reconstruct via the slug-agnostic /viec-lam/ shape.
  if (/^\d+$/.test(s)) {
    return { url: `${BASE}/viec-lam/j/${s}.html`, id: s }
  }
  return null
}
