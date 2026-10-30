// Data source: CareerViet Vietnam (careerviet.vn) public server-rendered search
// and detail pages. No authentication required.
//
// The site is a Next.js app, but the job cards and the full detail body are
// present in the initial HTML response (not only in the RSC payload), so plain
// regex parsing over the served markup is sufficient — no DOM parser, no
// JS execution, zero runtime dependencies.
//
// Parsing anchors are documented in ../../url-reference.md. If CareerViet
// changes its markup, that file records what to update.

export const BASE = "https://careerviet.vn"
export const SEARCH_BASE = `${BASE}/viec-lam`

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

const UA = "Mozilla/5.0 (compatible; careerviet-cli/1.0)"

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
  /** Last-updated date ("Cập nhật") as ISO YYYY-MM-DD, or null. */
  date: string | null
  /** Application deadline ("Hạn nộp") as ISO YYYY-MM-DD, or null. */
  deadline: string | null
  salary: string | null
  url: string
}

export interface JobDetail extends JobCard {
  description: string | null
  benefits: string | null
  industry: string | null
  employmentType: string | null
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

function stripTags(html: string): string {
  return visibleHtml(html).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
}

export function clean(html: string): string {
  // Next.js emits `<!-- -->` text separators inside server-rendered strings;
  // drop them before stripping tags or they survive as stray whitespace.
  return decodeHtmlEntities(stripTags(html.replace(/<!--\s*-->/g, "")))
}

/** CareerViet prints dates as DD-MM-YYYY or DD/MM/YYYY. Normalise to ISO. */
export function toIsoDate(raw: string | null | undefined): string | null {
  if (!raw) return null
  const m = raw.trim().match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (!m) return null
  const [, d, mo, y] = m
  return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`
}

/** Days between an ISO date and today (positive = in the past). */
export function daysAgo(iso: string | null): number | null {
  if (!iso) return null
  const then = Date.parse(iso + "T00:00:00Z")
  if (isNaN(then)) return null
  return Math.floor((Date.now() - then) / 86400000)
}

/**
 * Slugify a keyword for CareerViet's path-based search. The site keeps
 * Vietnamese characters percent-encoded and joins words with hyphens
 * (e.g. "thiết kế nội thất" -> "thi%E1%BA%BFt-k%E1%BA%BF-n%E1%BB%99i-th%E1%BA%A5t").
 */
export function slugifyQuery(query: string): string {
  return encodeURIComponent(query.trim().replace(/\s+/g, "-"))
}

/**
 * Location filter codes used in the `-kl<code>-` URL segment. Verified against
 * live pages; unknown cities can be passed as a raw numeric code.
 */
export const LOCATION_CODES: Record<string, string> = {
  "ha noi": "4",
  hanoi: "4",
  "hà nội": "4",
  "ho chi minh": "8",
  hcm: "8",
  "hồ chí minh": "8",
  "sai gon": "8",
  "da nang": "20",
  "đà nẵng": "20",
  "binh duong": "13",
  "bình dương": "13",
  "dong nai": "19",
  "đồng nai": "19",
  "hai phong": "6",
  "hải phòng": "6",
  "can tho": "17",
  "cần thơ": "17",
}

export function resolveLocation(input: string | undefined): string | null {
  if (!input) return null
  const trimmed = input.trim()
  if (/^\d+$/.test(trimmed)) return trimmed
  return LOCATION_CODES[trimmed.toLowerCase()] ?? null
}

/**
 * Parse the search results page. Cards are `<div class="job-item" id="job-item-<ID>">`
 * blocks; we split on that marker and parse each chunk independently so one
 * malformed card cannot break the rest.
 */
export function parseJobCards(html: string): JobCard[] {
  const results: JobCard[] = []
  const chunks = html.split(/<div class="job-item[^"]*" id="job-item-/).slice(1)

  for (const chunk of chunks) {
    const idMatch = chunk.match(/^([A-Za-z0-9]+)"/)
    if (!idMatch) continue
    const id = idMatch[1]

    const link = chunk.match(
      /<a class="job_link"[^>]*title="([^"]*)"[^>]*href="([^"]+)"/i,
    )
    if (!link) continue
    const title = decodeHtmlEntities(link[1]).trim()
    const href = decodeHtmlEntities(link[2])
    if (!title) continue

    const comp = chunk.match(
      /<a class="company-name"[^>]*title="([^"]*)"[^>]*href="([^"]+)"/i,
    )
    const company = comp ? decodeHtmlEntities(comp[1]).trim() || null : null
    const companyUrl = comp ? BASE + decodeHtmlEntities(comp[2]) : null

    // Salary: <div class="salary"><p>...Lương<!-- -->: <!-- -->Cạnh tranh</p>
    const salBlock = chunk.match(/<div class="salary">([\s\S]*?)<\/div>/i)
    let salary: string | null = null
    if (salBlock) {
      const text = clean(salBlock[1])
      salary = text.replace(/^L(?:ương|uong)\s*:\s*/i, "").trim() || null
    }

    // Location: <div class="location" title="Hà Nội"><svg>…</svg><ul><li>Hà Nội</li></ul>
    // The live div carries a title attribute, so the match must allow attributes.
    const locBlock = chunk.match(/<div class="location"[^>]*>([\s\S]*?)<\/div>/i)
    let location: string | null = null
    if (locBlock) {
      const items = [...locBlock[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)].map((m) =>
        clean(m[1]),
      )
      location = items.filter(Boolean).join(", ") || null
    }

    // Time block carries both "Hạn nộp" (deadline) and "Cập nhật" (updated),
    // each followed by its own <time> element.
    const timeBlock = chunk.match(/<div class="time">([\s\S]*?)<\/div>/i)
    let deadline: string | null = null
    let date: string | null = null
    if (timeBlock) {
      const items = [...timeBlock[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi)]
      for (const item of items) {
        const label = clean(item[1])
        const t = item[1].match(/<time[^>]*>([\s\S]*?)<\/time>/i)
        if (!t) continue
        const iso = toIsoDate(clean(t[1]))
        if (/H(?:ạn|an)\s*n(?:ộp|op)/i.test(label)) deadline = iso
        else if (/C(?:ập|ap)\s*nh(?:ật|at)/i.test(label)) date = iso
      }
    }

    results.push({
      id,
      title,
      company,
      companyUrl,
      location,
      date,
      deadline,
      salary,
      url: href.startsWith("http") ? href : BASE + href,
    })
  }

  return results
}

/** Extract a `detail-row` section by its `<h2 class="detail-title">` heading. */
function detailSection(html: string, heading: string): string | null {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const re = new RegExp(
    `<div class="detail-row[^"]*">\\s*<h2 class="detail-title">${escaped}</h2>([\\s\\S]*?)</div>\\s*(?=<div class="detail-row|<div class="detail-box|$)`,
    "i",
  )
  const m = re.exec(html)
  return m ? m[1] : null
}

/**
 * Read a `<strong>[icon]LABEL</strong><p>VALUE</p>` pair from the detail page's
 * blue info boxes. Anchored on the <strong> wrapper so it cannot accidentally
 * match navigation text elsewhere in the document.
 */
function labelledField(html: string, label: string): string | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const re = new RegExp(
    `<strong>(?:<em[^>]*>[\\s\\S]{0,20}?</em>)?\\s*(?:<span>)?\\s*${escaped}\\s*(?:</span>)?\\s*</strong>\\s*<p[^>]*>([\\s\\S]*?)</p>`,
    "i",
  )
  const m = re.exec(html)
  return m ? clean(m[1]) || null : null
}

interface LdJobPosting {
  title?: string
  description?: string
  datePosted?: string
  validThrough?: string
  industry?: string
  jobBenefits?: string
  employmentType?: string | string[]
  hiringOrganization?: { name?: string; url?: string }
  jobLocation?: unknown
  baseSalary?: unknown
}

/**
 * CareerViet embeds a schema.org JobPosting block on every detail page. It is
 * far more stable than the surrounding markup, so we prefer it and fall back to
 * HTML parsing only for fields it omits (or if the block is absent/malformed).
 */
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
      // A malformed block is not fatal — try the next one, then fall back.
    }
  }
  return null
}

/** Pull a human-readable place name out of schema.org jobLocation. */
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
  // Hidden markup goes before the line split: a hidden element can span the
  // breaks, and its close tags must still be there to find where it ends.
  const withBreaks = visibleHtml(html)
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\/(p|li|ul|ol|div|h\d|tr)>/gi, "\n")
  return (
    decodeHtmlEntities(stripTags(withBreaks))
      .replace(/\n{3,}/g, "\n\n")
      .trim() || null
  )
}

/**
 * Parse a single job detail page. Prefers the embedded schema.org JobPosting
 * block (stable) and falls back to markup parsing per-field (brittle but keeps
 * the command useful if CareerViet drops or breaks its structured data).
 */
export function parseJobDetail(html: string, id: string, url: string): JobDetail {
  const ld = extractJsonLdJobPosting(html)

  const titleHtml =
    html.match(/<h1[^>]*class="[^"]*title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ??
    html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] ??
    null
  const title = ld?.title?.trim() || (titleHtml ? clean(titleHtml) : null)

  // The employer anchor's `title` attribute is the generic "Tổng quan công ty",
  // so take the company name from JSON-LD or the anchor's inner text instead.
  const companyHref = html.match(/href="(\/(?:vi|en)\/nha-tuyen-dung\/[^"]+)"/i)
  const companyText = html.match(
    /<a[^>]*href="\/(?:vi|en)\/nha-tuyen-dung\/[^"]+"[^>]*>([^<]{3,120})<\/a>/i,
  )
  const company =
    ld?.hiringOrganization?.name?.trim() ||
    (companyText ? decodeHtmlEntities(companyText[1]).trim() : null) ||
    null
  const companyUrl =
    ld?.hiringOrganization?.url ||
    (companyHref ? BASE + decodeHtmlEntities(companyHref[1]) : null)

  // validThrough is an ISO timestamp; the markup prints DD/MM/YYYY.
  const deadline =
    (ld?.validThrough ? ld.validThrough.slice(0, 10) : null) ??
    toIsoDate(labelledField(html, "Hết hạn nộp"))

  const description =
    richText(detailSection(html, "Mô tả Công việc")) ?? richText(ld?.description ?? null)
  const benefits =
    richText(detailSection(html, "Phúc lợi")) ?? richText(ld?.jobBenefits ?? null)

  const location = ldLocation(ld?.jobLocation) ?? labelledField(html, "Địa điểm")
  const salary = labelledField(html, "Lương")
  const industry = ld?.industry?.trim() || labelledField(html, "Ngành nghề")

  const rawType = Array.isArray(ld?.employmentType)
    ? ld?.employmentType.join(", ")
    : ld?.employmentType
  const employmentType =
    labelledField(html, "Hình thức") ??
    (rawType ? rawType.replace(/"/g, "").trim() || null : null)

  const date = ld?.datePosted ? ld.datePosted.slice(0, 10) : null

  return {
    id,
    title: title || "(untitled)",
    company,
    companyUrl,
    location,
    date,
    deadline,
    salary,
    url,
    description,
    benefits,
    industry,
    employmentType,
  }
}
