// Data source: TopDev's public JSON:API (api.topdev.vn). No authentication required.
// The search endpoint returns JSON:API-formatted job cards; the detail endpoint
// returns a single job whose body fields are HTML. We call the API directly (the
// topdev.vn website itself is a Cloudflare-fronted SPA — the API is the clean source).
//
// Personal use only. Keep request volume low; do not use commercially or for bulk
// data collection. Run it on your own responsibility.

export const SEARCH_URL = "https://api.topdev.vn/td/v2/jobs"
export const DETAIL_URL = "https://api.topdev.vn/td/v2/jobs"

// The API ignores per_page and always returns 10 results per page.
export const PAGE_SIZE = 10

// Sparse-fieldset selectors. These MUST be sent with LITERAL square brackets —
// URL-encoding them to %5B makes the API return an empty payload. Build the query
// string by hand (see buildSearchUrl / buildDetailUrl) rather than via
// URLSearchParams, which would percent-encode the brackets.
export const SEARCH_FIELDS_JOB =
  "id,title,slug,detail_url,salary,addresses,skills_str,company,refreshed_at,published_until"
export const SEARCH_FIELDS_COMPANY = "id,display_name,slug,image_logo"
export const DETAIL_FIELDS_JOB =
  "title,content,responsibilities_original,requirements_original,benefits_original,salary,addresses,company,skills_str,detail_url,slug"

const UA = "Mozilla/5.0 (compatible; topdev-cli/1.0)"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

/** Fetch JSON with exponential backoff + jitter on 429/5xx. Returns null on 404. */
export async function jsonFetch<T = unknown>(url: string): Promise<T | null> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "application/json",
        "Accept-Language": "vi,en-US;q=0.9,en;q=0.8",
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

export interface JobDetail {
  id: string
  title: string | null
  company: string | null
  location: string | null
  date: string | null
  url: string | null
  salary: string | null
  skills: string | null
  description: string | null
}

// --- HTML / entity cleaning ------------------------------------------------
// TopDev job bodies are HTML with a mix of numeric character references and
// named Latin-1 entities (e.g. &ocirc; &eacute; &ndash;) alongside real Unicode
// (Vietnamese combining marks arrive pre-decoded via JSON \u escapes). We drop
// markup a browser never renders, decode the named + numeric entities and strip
// tags, preserving paragraph/list breaks.

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
  dagger: "†", Dagger: "‡", permil: "‰",
  frac12: "½", frac14: "¼", frac34: "¾",
  sup1: "¹", sup2: "²", sup3: "³", prime: "′", Prime: "″",
  // Latin-1 accented letters (uppercase)
  Agrave: "À", Aacute: "Á", Acirc: "Â", Atilde: "Ã",
  Auml: "Ä", Aring: "Å", AElig: "Æ", Ccedil: "Ç",
  Egrave: "È", Eacute: "É", Ecirc: "Ê", Euml: "Ë",
  Igrave: "Ì", Iacute: "Í", Icirc: "Î", Iuml: "Ï",
  ETH: "Ð", Ntilde: "Ñ", Ograve: "Ò", Oacute: "Ó",
  Ocirc: "Ô", Otilde: "Õ", Ouml: "Ö", Oslash: "Ø",
  Ugrave: "Ù", Uacute: "Ú", Ucirc: "Û", Uuml: "Ü",
  Yacute: "Ý", THORN: "Þ", szlig: "ß",
  // Latin-1 accented letters (lowercase)
  agrave: "à", aacute: "á", acirc: "â", atilde: "ã",
  auml: "ä", aring: "å", aelig: "æ", ccedil: "ç",
  egrave: "è", eacute: "é", ecirc: "ê", euml: "ë",
  igrave: "ì", iacute: "í", icirc: "î", iuml: "ï",
  eth: "ð", ntilde: "ñ", ograve: "ò", oacute: "ó",
  ocirc: "ô", otilde: "õ", ouml: "ö", oslash: "ø",
  ugrave: "ù", uacute: "ú", ucirc: "û", uuml: "ü",
  yacute: "ý", thorn: "þ", yuml: "ÿ",
}

/**
 * Convert a Unicode code point to a string. Uses `fromCodePoint` so
 * supplementary-plane code points decode correctly, dropping out-of-range values.
 */
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

/** Collapse an HTML fragment to a single clean line (for titles, short fields). */
export function clean(html: string): string {
  return decodeHtmlEntities(visibleHtml(html).replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim()
}

/** Convert an HTML body to readable plain text, preserving paragraph/list breaks. */
export function htmlToText(html: string): string {
  // Hidden markup goes before the line split: a hidden element can span the
  // breaks, and its close tags must still be there to find where it ends.
  const withBreaks = visibleHtml(html)
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "\n• ")
    .replace(/<\/(p|div|ul|ol|h[1-6]|tr|table|section|blockquote)>/gi, "\n")
  return decodeHtmlEntities(withBreaks.replace(/<[^>]+>/g, ""))
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
function locationOf(addresses: unknown): string | null {
  const a = addresses as
    | { address_region_array?: unknown; full_addresses?: unknown }
    | null
    | undefined
  const region = a?.address_region_array
  if (Array.isArray(region) && region.length > 0) return region.filter(Boolean).join(", ") || null
  const full = a?.full_addresses
  if (Array.isArray(full) && full.length > 0) return (full[0] as string) || null
  return null
}

interface RawSalary {
  min_filter?: number
  max_filter?: number
  currency?: string
  is_negotiable?: string | number | boolean
  value?: string | null
  unit?: string
}

function groupThousands(n: number): string {
  return n.toLocaleString("en-US")
}

function unitSuffix(unit: string | undefined): string {
  switch ((unit || "").toUpperCase()) {
    case "MONTH":
      return "/month"
    case "YEAR":
      return "/year"
    case "HOUR":
      return "/hour"
    case "DAY":
      return "/day"
    default:
      return ""
  }
}

/**
 * Build a human salary string. Rules discovered live:
 *  - is_negotiable "1"/1/true  -> "Negotiable"
 *  - min_filter/max_filter are VND-normalized (reliable only when currency=VND);
 *    the `value` string is masked with asterisks when the employer hides the range.
 * We therefore format from min/max for VND, fall back to an unmasked `value`
 * string otherwise, and return null when nothing usable is available.
 */
export function formatSalary(salary: unknown): string | null {
  const s = salary as RawSalary | null | undefined
  if (!s) return null
  const neg = s.is_negotiable === "1" || s.is_negotiable === 1 || s.is_negotiable === true
  if (neg) return "Negotiable"
  const suffix = unitSuffix(s.unit)
  const cur = s.currency || "VND"
  const min = Number(s.min_filter) || 0
  const max = Number(s.max_filter) || 0
  if (cur === "VND" && (min > 0 || max > 0)) {
    if (min > 0 && max > 0) return `${groupThousands(min)} - ${groupThousands(max)} VND${suffix}`
    if (max > 0) return `Up to ${groupThousands(max)} VND${suffix}`
    return `From ${groupThousands(min)} VND${suffix}`
  }
  if (typeof s.value === "string" && s.value.trim() && !s.value.includes("*")) {
    return `${s.value.trim()}${suffix}`
  }
  return null
}

interface RawJob {
  id?: number | string
  title?: string
  slug?: string
  detail_url?: string
  company?: { display_name?: string } | null
  addresses?: unknown
  salary?: unknown
  skills_str?: string | null
  refreshed_at?: string | null
  published_until?: string | null
}

function urlOf(raw: RawJob): string | null {
  if (raw.detail_url) return raw.detail_url
  if (raw.slug && raw.id != null) return `https://topdev.vn/detail-jobs/${raw.slug}-${raw.id}`
  return null
}

export function mapJobCard(raw: RawJob): JobCard {
  return {
    id: String(raw.id ?? ""),
    title: raw.title ?? null,
    company: raw.company?.display_name ?? null,
    location: locationOf(raw.addresses),
    date: raw.refreshed_at ?? raw.published_until ?? null,
    url: urlOf(raw),
    salary: formatSalary(raw.salary),
    skills: raw.skills_str ?? null,
  }
}

/** Coerce a detail body field (string | array-of-{value} | null) to an HTML string. */
function sectionHtml(field: unknown): string {
  if (typeof field === "string") return field
  if (Array.isArray(field)) {
    return field
      .map((x) => (x && typeof x === "object" && "value" in x ? String((x as { value?: unknown }).value ?? "") : String(x ?? "")))
      .filter((s) => s.trim())
      .join("\n")
  }
  return ""
}

interface RawDetail extends RawJob {
  content?: string | null
  responsibilities_original?: unknown
  requirements_original?: unknown
  benefits_original?: unknown
}

/** Assemble the full, readable job description from the detail payload. */
export function buildDescription(raw: RawDetail): string | null {
  const sections: string[] = []
  const overview = sectionHtml(raw.content)
  if (overview.trim()) sections.push(htmlToText(overview))
  const labelled: Array<[string, unknown]> = [
    ["RESPONSIBILITIES", raw.responsibilities_original],
    ["REQUIREMENTS", raw.requirements_original],
    ["BENEFITS", raw.benefits_original],
  ]
  for (const [label, field] of labelled) {
    const text = htmlToText(sectionHtml(field))
    if (text.trim()) sections.push(`${label}\n${"-".repeat(label.length)}\n${text}`)
  }
  const joined = sections.join("\n\n").trim()
  return joined || null
}

export function mapJobDetail(raw: RawDetail, id: string): JobDetail {
  return {
    id,
    title: raw.title ? clean(raw.title) : null,
    company: raw.company?.display_name ?? null,
    location: locationOf(raw.addresses),
    date: raw.refreshed_at ?? raw.published_until ?? null,
    url: urlOf(raw),
    salary: formatSalary(raw.salary),
    skills: raw.skills_str ?? null,
    description: buildDescription(raw),
  }
}

/** Extract the trailing numeric job id from a bare id, a slug, or a detail URL. */
export function extractId(input: string): string | null {
  const s = String(input).trim()
  if (/^\d{5,}$/.test(s)) return s
  const m =
    s.match(/-(\d{5,})(?:$|[?#])/) || s.match(/\/(\d{5,})(?:$|[?#/])/) || s.match(/(\d{5,})/)
  return m ? m[1] : null
}
