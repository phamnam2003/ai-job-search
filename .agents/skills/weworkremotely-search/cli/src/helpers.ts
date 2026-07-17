// Data source: We Work Remotely (weworkremotely.com) public RSS category feeds.
// No authentication required. Each feed is clean RSS 2.0 XML whose <item>s carry a
// "Company: Role" <title>, a <link>/<guid>, <region>, <pubDate>, <type>, <skills>,
// <category>, a media logo and a (HTML, XML-escaped) <description>.
//
// We parse the XML with regex, splitting on <item> and reading each block
// independently, so one malformed item cannot break the rest (no XML library — the
// markup is shallow and stable). The individual job pages are Cloudflare-fronted and
// return 403 to automated fetches, so `detail` falls back to the RSS <description>,
// which is the full job body.
//
// Personal use only. Keep request volume low; do not use it commercially or for bulk
// data collection. Run it on your own responsibility.

export const BASE = "https://weworkremotely.com"

/** Category key -> RSS feed URL. The three programming feeds are the default set. */
export const CATEGORY_FEEDS: Record<string, string> = {
  backend: `${BASE}/categories/remote-back-end-programming-jobs.rss`,
  fullstack: `${BASE}/categories/remote-full-stack-programming-jobs.rss`,
  frontend: `${BASE}/categories/remote-front-end-programming-jobs.rss`,
  devops: `${BASE}/categories/remote-devops-sysadmin-jobs.rss`,
}

/** Default feeds fetched and merged when no --category is given. */
export const DEFAULT_CATEGORIES = ["backend", "fullstack", "frontend"]

const ALL_CATEGORIES = ["backend", "fullstack", "frontend", "devops"]

const CATEGORY_ALIASES: Record<string, string> = {
  backend: "backend", "back-end": "backend", be: "backend",
  fullstack: "fullstack", "full-stack": "fullstack", full: "fullstack", fs: "fullstack",
  frontend: "frontend", "front-end": "frontend", fe: "frontend",
  devops: "devops", sysadmin: "devops", ops: "devops",
}

/**
 * Resolve a `--category` flag to a list of canonical feed keys. Accepts a
 * comma-separated list plus the alias `all`. Returns the default set when the flag
 * is absent, and an empty array when the flag is present but resolves to nothing
 * valid (the caller reports BAD_CATEGORY in that case).
 */
export function resolveCategories(flag?: string): string[] {
  if (flag === undefined) return DEFAULT_CATEGORIES
  const raw = flag.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)
  const keys: string[] = []
  for (const r of raw) {
    if (r === "all") {
      for (const k of ALL_CATEGORIES) if (!keys.includes(k)) keys.push(k)
      continue
    }
    const k = CATEGORY_ALIASES[r]
    if (k && !keys.includes(k)) keys.push(k)
  }
  return keys
}

/** Map canonical feed keys to their RSS URLs (skips unknown keys). */
export function feedUrls(keys: string[]): string[] {
  return keys.map((k) => CATEGORY_FEEDS[k]).filter((u): u is string => Boolean(u))
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

/**
 * Fetch a text body (RSS or HTML) with exponential backoff + jitter on 429/5xx.
 * Returns "" on 404 (feed/page gone) and on 403 (Cloudflare-blocked job page), so
 * callers treat both as "no content" and can fall back cleanly.
 */
export async function fetchText(url: string): Promise<string> {
  const maxRetries = 6
  let delay = 500
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, {
      headers: {
        "User-Agent": UA,
        Accept: "application/rss+xml,application/xml,text/xml,text/html;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
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
    if (response.status === 404 || response.status === 403) return ""
    if (!response.ok) {
      throw new Error(`Request failed: ${response.status} ${response.statusText}`)
    }
    return response.text()
  }
  throw new Error("Request failed after max retries")
}

// --- HTML / XML entity cleaning -------------------------------------------

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
  Agrave: "À", Aacute: "Á", Acirc: "Â", Atilde: "Ã",
  Auml: "Ä", Aring: "Å", AElig: "Æ", Ccedil: "Ç",
  Egrave: "È", Eacute: "É", Ecirc: "Ê", Euml: "Ë",
  Igrave: "Ì", Iacute: "Í", Icirc: "Î", Iuml: "Ï",
  ETH: "Ð", Ntilde: "Ñ", Ograve: "Ò", Oacute: "Ó",
  Ocirc: "Ô", Otilde: "Õ", Ouml: "Ö", Oslash: "Ø",
  Ugrave: "Ù", Uacute: "Ú", Ucirc: "Û", Uuml: "Ü",
  Yacute: "Ý", THORN: "Þ", szlig: "ß",
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
 * supplementary-plane code points (emoji, U+1F600) decode correctly, dropping
 * out-of-range values instead of throwing.
 */
function numericEntity(cp: number): string {
  return cp >= 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : ""
}

/**
 * Decode one layer of XML/HTML character references: named entities (&amp; &lt;
 * &eacute; …), decimal (&#233;) and hexadecimal (&#xE9;) numeric references.
 * Running this once on an RSS <title>/<region> yields plain text; running it on
 * an XML-escaped HTML <description> yields the underlying HTML string (still with
 * &nbsp; etc., which htmlToText then decodes on the second pass).
 */
export function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&([a-zA-Z][a-zA-Z0-9]*);/g, (m, name: string) =>
      Object.prototype.hasOwnProperty.call(NAMED_ENTITIES, name) ? NAMED_ENTITIES[name] : m,
    )
    .replace(/&#(\d+);/g, (_, dec: string) => numericEntity(parseInt(dec, 10)))
    .replace(/&#[xX]([0-9a-fA-F]+);/g, (_, hex: string) => numericEntity(parseInt(hex, 16)))
}

/** Collapse an HTML/XML fragment to a single clean line (titles, short fields). */
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
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/** Decode an XML-escaped HTML <description> into readable plain text. */
export function descriptionToText(rawDescription: string): string {
  return htmlToText(decodeHtmlEntities(rawDescription))
}

// --- Diacritics-insensitive matching (for the client-side --location filter) ---
export function foldDiacritics(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
}

// --- Feed parsing ----------------------------------------------------------

export interface FeedItem {
  id: string
  title: string | null
  company: string | null
  location: string | null
  date: string | null
  url: string
  region: string | null
  type: string | null
  category: string | null
  skills: string | null
  logo: string | null
  /** Raw XML-escaped HTML from <description>; kept for -q filtering and detail. */
  descriptionHtml: string
}

/** Emitted (search) shape: contract fields + WWR-specific extras. */
export interface JobCard {
  id: string
  title: string | null
  company: string | null
  location: string | null
  date: string | null
  url: string
  type: string | null
  category: string | null
  skills: string | null
  logo: string | null
}

function firstTag(block: string, name: string): string | null {
  const m = block.match(new RegExp(`<${name}\\b[^>]*>([\\s\\S]*?)</${name}>`, "i"))
  if (!m) return null
  const v = decodeHtmlEntities(m[1]).trim()
  return v || null
}

/** Last non-empty path segment of a URL, minus any query/hash. */
export function slugFromUrl(url: string): string {
  return (url.split(/[?#]/)[0].split("/").filter(Boolean).pop() ?? "").trim()
}

/**
 * Parse a single <item> XML block into a FeedItem. Every field is read
 * independently so a missing tag never aborts the rest. Returns null only when
 * there is no usable link (no stable id).
 */
export function parseItem(block: string): FeedItem | null {
  // Link identifies the job; fall back to <guid> which mirrors it.
  const link = firstTag(block, "link") ?? firstTag(block, "guid")
  if (!link) return null
  const url = link.trim()
  const id = slugFromUrl(url)
  if (!id) return null

  // Title is "Company: Role" — split on the FIRST ": ".
  let company: string | null = null
  let title: string | null = null
  const rawTitle = firstTag(block, "title")
  if (rawTitle) {
    const idx = rawTitle.indexOf(": ")
    if (idx > 0) {
      company = rawTitle.slice(0, idx).trim() || null
      title = rawTitle.slice(idx + 2).trim() || null
    } else {
      title = rawTitle
    }
  }

  const region = firstTag(block, "region")
  const logoMatch = block.match(/<media:content[^>]*\burl="([^"]+)"/i)

  // <description> holds XML-escaped HTML; keep it raw for filtering / detail.
  const descMatch = block.match(/<description>([\s\S]*?)<\/description>/i)
  const descriptionHtml = descMatch ? descMatch[1] : ""

  return {
    id,
    title,
    company,
    location: region ?? "Remote",
    date: firstTag(block, "pubDate"),
    url,
    region,
    type: firstTag(block, "type"),
    category: firstTag(block, "category"),
    skills: firstTag(block, "skills"),
    logo: logoMatch ? decodeHtmlEntities(logoMatch[1]).trim() : null,
    descriptionHtml,
  }
}

/**
 * Parse an RSS feed into FeedItems. Splits on <item> and truncates each chunk at
 * </item> so the trailing channel close on the last item cannot bleed in.
 */
export function parseFeed(xml: string): FeedItem[] {
  if (!xml) return []
  const items: FeedItem[] = []
  const chunks = xml.split(/<item\b[^>]*>/i).slice(1)
  for (const chunk of chunks) {
    const end = chunk.indexOf("</item>")
    const block = end >= 0 ? chunk.slice(0, end) : chunk
    const item = parseItem(block)
    if (item) items.push(item)
  }
  return items
}

/** Parse and merge many feeds, de-duplicating by job id (slug); first wins. */
export function mergeFeeds(xmls: string[]): FeedItem[] {
  const seen = new Set<string>()
  const merged: FeedItem[] = []
  for (const xml of xmls) {
    for (const item of parseFeed(xml)) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      merged.push(item)
    }
  }
  return merged
}

/** Milliseconds for an RFC-822 pubDate, or 0 when absent/unparseable. */
export function dateMs(date: string | null): number {
  if (!date) return 0
  const t = Date.parse(date)
  return isNaN(t) ? 0 : t
}

/** Project a FeedItem to the emitted JobCard (drops the raw description + region dup). */
export function toCard(it: FeedItem): JobCard {
  return {
    id: it.id,
    title: it.title,
    company: it.company,
    location: it.location,
    date: it.date,
    url: it.url,
    type: it.type,
    category: it.category,
    skills: it.skills,
    logo: it.logo,
  }
}

/**
 * Normalize a detail argument to a WWR job slug. Accepts a bare slug
 * (`company-role`), a full weworkremotely URL, or a `remote-jobs/<slug>` path.
 * Returns null when the input has no slug-shaped final segment.
 */
export function extractSlug(input: string): string | null {
  const s = String(input).trim()
  if (!s) return null
  let candidate = s
  if (/^https?:\/\//i.test(s)) {
    try {
      candidate = new URL(s).pathname
    } catch {
      candidate = s
    }
  }
  const seg = slugFromUrl(candidate)
  if (!seg) return null
  return /^[a-z0-9][a-z0-9-]*$/i.test(seg) ? seg : null
}
