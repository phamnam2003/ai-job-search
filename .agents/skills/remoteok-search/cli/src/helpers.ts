// Data source: RemoteOK's public JSON API (https://remoteok.com/api). No auth key.
// The endpoint returns a single JSON ARRAY of the latest ~100 remote job postings.
// Element [0] is a legal/metadata object (it carries a `legal` key) and MUST be
// skipped — every other element is a job. We call the API directly; it blocks
// requests with an empty User-Agent, so a browser UA + Accept: application/json
// are required.
//
// Personal use only. Keep request volume low; do not use commercially or for bulk
// data collection. RemoteOK's API terms ask that you link back and credit them as
// a source. Run it on your own responsibility.

export const API_URL = "https://remoteok.com/api"

// The API returns the latest ~100 postings in one array; there is no server-side
// pagination on the main feed, so `--page` is applied client-side over this size.
export const PAGE_SIZE = 20

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

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
        // RemoteOK blocks empty/curl user-agents — a browser UA is required.
        "User-Agent": UA,
        Accept: "application/json",
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
  tags: string[] | null
}

export interface JobDetail extends JobCard {
  description: string | null
}

// --- HTML / entity cleaning ------------------------------------------------
// RemoteOK descriptions are HTML fragments (mostly LinkedIn-sourced) using named
// entities (&amp; &nbsp; &ndash; …), numeric references, and <br>/<p>/<li> tags.
// We decode entities and strip tags while preserving paragraph/list breaks. This
// mirrors the cleaning helpers used by the linkedin-search / topdev-search skills.

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
 * supplementary-plane code points (e.g. emoji) decode correctly, dropping
 * out-of-range values instead of throwing.
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
 * Repair the common "UTF-8 bytes misread as Latin-1" mojibake RemoteOK bakes into
 * some postings (e.g. "EstÃ¡gio" -> "Estágio", "PerÃº" -> "Perú"). Tightly guarded:
 *   - only runs when the Ã/Â-plus-continuation signature is present;
 *   - bails if any codepoint is > 0xFF (that means genuine Unicode, not single-byte
 *     mojibake — e.g. an em-dash or emoji — so we never corrupt correct text);
 *   - re-decodes the Latin-1 bytes as UTF-8 with fatal:true, so a string that only
 *     coincidentally contains "Ã." is left untouched when the bytes aren't valid UTF-8.
 * Correctly-encoded accents (á, ç, …) sit outside the Ã/Â lead range and are ignored.
 */
export function fixMojibake(s: string): string {
  if (!/[\u00C2\u00C3][\u0080-\u00BF]/.test(s)) return s
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) > 0xff) return s
  try {
    const bytes = Uint8Array.from(s, (c) => c.charCodeAt(0))
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes)
  } catch {
    return s
  }
}

/** Collapse an HTML fragment to a single clean line (titles, short fields). */
export function clean(html: string): string {
  return fixMojibake(decodeHtmlEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim())
}

/** Convert an HTML body to readable plain text, preserving paragraph/list breaks. */
export function htmlToText(html: string): string {
  const withBreaks = html
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "\n• ")
    .replace(/<\/(p|div|ul|ol|h[1-6]|tr|table|section|blockquote)>/gi, "\n")
  const text = decodeHtmlEntities(withBreaks.replace(/<[^>]+>/g, ""))
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
  return fixMojibake(text)
}

// --- Diacritics-insensitive matching (for -q and --location filters) -------
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

/** Trim RemoteOK's trailing-comma location noise ("United States, " -> "United States"). */
export function cleanLocation(loc: unknown): string | null {
  if (typeof loc !== "string") return null
  const t = fixMojibake(loc.replace(/[\s,]+$/g, "").replace(/^[\s,]+/g, "").trim())
  return t || null
}

function groupThousands(n: number): string {
  return n.toLocaleString("en-US")
}

/**
 * Build a human salary string from RemoteOK's USD `salary_min`/`salary_max`
 * (annual figures; 0 means undisclosed). Returns null when neither is set.
 */
export function formatSalary(min: unknown, max: unknown): string | null {
  const lo = Number(min) || 0
  const hi = Number(max) || 0
  if (lo > 0 && hi > 0) return `$${groupThousands(lo)} - $${groupThousands(hi)}`
  if (hi > 0) return `Up to $${groupThousands(hi)}`
  if (lo > 0) return `From $${groupThousands(lo)}`
  return null
}

interface RawJob {
  id?: number | string
  legal?: string
  slug?: string
  position?: string
  company?: string | null
  location?: string | null
  date?: string | null
  epoch?: number | string
  url?: string
  apply_url?: string
  salary_min?: number | string
  salary_max?: number | string
  tags?: unknown
  description?: string | null
}

/** Element [0] of the API array is a legal/metadata object — not a job. */
export function isJobEntry(raw: unknown): raw is RawJob {
  return (
    !!raw &&
    typeof raw === "object" &&
    !("legal" in (raw as Record<string, unknown>)) &&
    (raw as RawJob).id != null
  )
}

function tagsOf(tags: unknown): string[] | null {
  if (Array.isArray(tags)) {
    const list = tags.map((t) => String(t)).filter((t) => t.trim())
    return list.length ? list : null
  }
  return null
}

function urlOf(raw: RawJob): string | null {
  if (raw.url) return raw.url
  if (raw.apply_url) return raw.apply_url
  if (raw.slug) return `https://remoteok.com/remote-jobs/${raw.slug}`
  if (raw.id != null) return `https://remoteok.com/remote-jobs/${raw.id}`
  return null
}

export function mapJobCard(raw: RawJob): JobCard {
  return {
    id: String(raw.id ?? ""),
    title: raw.position ? clean(String(raw.position)) : null,
    company: raw.company ? clean(String(raw.company)) : null,
    // Most RemoteOK roles are worldwide-remote; blank location => "Remote".
    location: cleanLocation(raw.location) ?? "Remote",
    date: raw.date ?? null,
    url: urlOf(raw),
    salary: formatSalary(raw.salary_min, raw.salary_max),
    tags: tagsOf(raw.tags),
  }
}

export function mapJobDetail(raw: RawJob): JobDetail {
  const card = mapJobCard(raw)
  const desc = typeof raw.description === "string" ? htmlToText(raw.description) : ""
  return { ...card, description: desc.trim() || null }
}

// --- Client-side filtering (the API has no reliable keyword/date/region param) ---

/**
 * Case-insensitive, diacritics-insensitive keyword match over the job TITLE
 * (RemoteOK's `position`) ONLY. Every whitespace-separated token in the query
 * must appear in the title (AND semantics), so "backend engineer" behaves sensibly.
 *
 * We deliberately do NOT match against `tags`, `company`, or `description`.
 * RemoteOK stuffs 13–43 broad tags onto every posting (a "golang" tag lands on
 * medical/sales/admin roles) and the descriptions are noisy — matching them
 * produced badly misleading false positives (e.g. `-q golang` returning a
 * Coca-Cola customer role, `-q backend` returning a sales internship). Title-only
 * matching keeps precision honest: a niche term simply returns fewer/zero hits
 * when the latest-100 feed has no such roles. Use `--tag` for explicit (noisy)
 * RemoteOK tag filtering.
 */
export function matchesQuery(raw: RawJob, query: string): boolean {
  const tokens = foldDiacritics(query).split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return true
  const title = foldDiacritics(fixMojibake(String(raw.position ?? "")))
  return tokens.every((tok) => title.includes(tok))
}

/**
 * Opt-in RemoteOK tag filter (`--tag`). Matches when any tag on the posting
 * contains the given value (case- & accent-insensitive), e.g. `--tag react`
 * matches both the `react` and `react.js` tags. This is the noisy tag-based
 * filtering kept available for users who explicitly want it — because RemoteOK
 * applies many broad tags per job, results are far lower-precision than `-q`.
 */
export function matchesTag(raw: RawJob, tag: string): boolean {
  const needle = foldDiacritics(tag)
  if (!needle) return true
  const tags = Array.isArray(raw.tags) ? raw.tags.map((t) => String(t)) : []
  return tags.some((t) => foldDiacritics(t).includes(needle))
}

/** Location substring match (client-side, diacritics-insensitive). */
export function matchesLocation(raw: RawJob, needle: string): boolean {
  const loc = cleanLocation(raw.location) ?? "Remote"
  return foldDiacritics(loc).includes(foldDiacritics(needle))
}

/** True when the posting is within `days` of now, using epoch (fallback: date). */
export function withinJobage(raw: RawJob, days: number): boolean {
  if (!days || days <= 0) return true
  let epochSec = Number(raw.epoch)
  if (!epochSec && typeof raw.date === "string") {
    const parsed = Date.parse(raw.date)
    if (!isNaN(parsed)) epochSec = Math.floor(parsed / 1000)
  }
  if (!epochSec) return false // no usable timestamp -> exclude from an age filter
  const cutoff = Date.now() / 1000 - days * 86400
  return epochSec >= cutoff
}

/** Extract a RemoteOK job id from a bare id or a remote-jobs URL/slug. */
export function extractId(input: string): string | null {
  const s = String(input).trim()
  if (/^\d+$/.test(s)) return s
  // Slugs/URLs end with "-<id>", e.g. remote-hr-assistant-sundayy-1134900
  const m = s.match(/-(\d+)(?:[/?#]|$)/) || s.match(/(\d{4,})/)
  return m ? m[1] : null
}
