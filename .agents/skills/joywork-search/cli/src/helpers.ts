// Data source: JoyWork's public JSON API (api.joywork.vn) - the same endpoints the
// joywork.vn Next.js frontend calls from the browser. No authentication required.
// Search and detail both return JSON; the description sections are HTML fragments
// (TipTap editor output), so we strip tags and decode entities for plain text.
//
// Personal use only. joywork.vn's terms (Điều D1) forbid scraping other users' data
// and reverse engineering the platform. This reads public job postings only. Keep
// volume low, do not use it commercially or for bulk collection, and run it on your
// own responsibility.

export const API_URL = "https://api.joywork.vn/api/jobs"
export const SITE_URL = "https://joywork.vn/jobs"

// The API's own default page size. It accepts up to 50 (`limit` > 50 is a 400).
export const PAGE_SIZE = 20

const UA = "Mozilla/5.0 (compatible; joywork-cli/1.0)"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

/** Pull the API's own `{ error: { code, message } }` out of a failed response body. */
function apiErrorDetail(body: string): string {
  try {
    const parsed = JSON.parse(body) as { error?: { code?: string; message?: string } | string; message?: string }
    const err = parsed.error
    if (err && typeof err === "object") return [err.code, err.message].filter(Boolean).join(": ")
    if (typeof err === "string") return [err, parsed.message].filter(Boolean).join(": ")
  } catch {
    // not JSON - fall through
  }
  return ""
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
      signal: AbortSignal.timeout(15000),
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
      const detail = apiErrorDetail(await response.text())
      throw new Error(`Request failed: ${response.status} ${response.statusText}${detail ? ` (${detail})` : ""}`)
    }
    return (await response.json()) as T
  }
  throw new Error("Request failed after max retries")
}

// --- HTML / entity cleaning ------------------------------------------------
// Job bodies are TipTap HTML: <p>, <ul><li><p>…</p></li></ul>, <strong>, plus
// &nbsp; and the occasional named or numeric entity. Vietnamese text itself
// arrives as real Unicode.

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ",
  copy: "©", reg: "®", trade: "™", hellip: "…",
  mdash: "—", ndash: "–", minus: "−",
  lsquo: "‘", rsquo: "’", ldquo: "“", rdquo: "”",
  laquo: "«", raquo: "»", bull: "•", middot: "·",
  deg: "°", euro: "€", times: "×",
  Agrave: "À", Aacute: "Á", Acirc: "Â", Atilde: "Ã",
  Egrave: "È", Eacute: "É", Ecirc: "Ê",
  Igrave: "Ì", Iacute: "Í",
  Ograve: "Ò", Oacute: "Ó", Ocirc: "Ô", Otilde: "Õ",
  Ugrave: "Ù", Uacute: "Ú", Yacute: "Ý",
  agrave: "à", aacute: "á", acirc: "â", atilde: "ã",
  egrave: "è", eacute: "é", ecirc: "ê",
  igrave: "ì", iacute: "í",
  ograve: "ò", oacute: "ó", ocirc: "ô", otilde: "õ",
  ugrave: "ù", uacute: "ú", yacute: "ý",
}

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

/** Convert an HTML body to readable plain text, preserving paragraph/list breaks. */
export function htmlToText(html: string): string {
  const withBreaks = visibleHtml(html)
    .replace(/<\s*br\s*\/?>/gi, "\n")
    .replace(/<\s*li[^>]*>/gi, "\n• ")
    .replace(/<\/(p|div|ul|ol|h[1-6]|tr|table|section|blockquote)>/gi, "\n")
  return decodeHtmlEntities(withBreaks.replace(/<[^>]+>/g, ""))
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t\u00a0]+/g, " ")
    .replace(/[ \t]*\n[ \t]*/g, "\n")
    // TipTap wraps each list item's text in its own <p>, which leaves "• \n text"
    // and a blank line between consecutive items.
    .replace(/• \n+/g, "• ")
    .replace(/\n+• /g, "\n• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

// --- Diacritics-insensitive matching ---------------------------------------
export function foldDiacritics(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .trim()
}

// --- Locations -------------------------------------------------------------
// The 34 province-level codes the API accepts for `location` (the post-2025-merger
// map), copied from the joywork.vn frontend bundle. The API rejects anything else
// with "Unknown location code", and job payloads carry these codes in `locations`.
export const PROVINCES: Record<string, string> = {
  "ha-noi": "Hà Nội",
  "hue": "Huế",
  "cao-bang": "Cao Bằng",
  "dien-bien": "Điện Biên",
  "lai-chau": "Lai Châu",
  "son-la": "Sơn La",
  "lang-son": "Lạng Sơn",
  "quang-ninh": "Quảng Ninh",
  "thanh-hoa": "Thanh Hóa",
  "nghe-an": "Nghệ An",
  "ha-tinh": "Hà Tĩnh",
  "lao-cai": "Lào Cai",
  "tuyen-quang": "Tuyên Quang",
  "thai-nguyen": "Thái Nguyên",
  "phu-tho": "Phú Thọ",
  "bac-ninh": "Bắc Ninh",
  "hung-yen": "Hưng Yên",
  "hai-phong": "Hải Phòng",
  "ninh-binh": "Ninh Bình",
  "quang-tri": "Quảng Trị",
  "da-nang": "Đà Nẵng",
  "quang-ngai": "Quảng Ngãi",
  "gia-lai": "Gia Lai",
  "khanh-hoa": "Khánh Hòa",
  "lam-dong": "Lâm Đồng",
  "dak-lak": "Đắk Lắk",
  "tp-ho-chi-minh": "TP. Hồ Chí Minh",
  "dong-nai": "Đồng Nai",
  "tay-ninh": "Tây Ninh",
  "can-tho": "Cần Thơ",
  "vinh-long": "Vĩnh Long",
  "dong-thap": "Đồng Tháp",
  "ca-mau": "Cà Mau",
  "an-giang": "An Giang",
}

const LOCATION_ALIASES: Record<string, string> = {
  hanoi: "ha-noi",
  hcm: "tp-ho-chi-minh",
  hcmc: "tp-ho-chi-minh",
  saigon: "tp-ho-chi-minh",
  danang: "da-nang",
}

/** Lowercase, accent-free, letters and digits only: "TP. Hồ Chí Minh" -> "tphochiminh". */
function compact(s: string): string {
  return foldDiacritics(s).replace(/[^a-z0-9]/g, "")
}

function stripCityPrefix(s: string): string {
  return s.replace(/^(tp|thanhpho|tinh)/, "")
}

/**
 * Resolve user input to an API location code. Accepts a code ("ha-noi"), a
 * Vietnamese name with or without accents ("Hà Nội", "ha noi"), or a common
 * alias ("hanoi", "HCM", "Saigon"). Returns null when nothing matches.
 */
export function resolveLocation(input: string): string | null {
  const key = stripCityPrefix(compact(input))
  if (!key) return null
  if (LOCATION_ALIASES[key]) return LOCATION_ALIASES[key]
  for (const [code, name] of Object.entries(PROVINCES)) {
    if (stripCityPrefix(compact(code)) === key || stripCityPrefix(compact(name)) === key) return code
  }
  return null
}

/** Display name for a location value, which may be a province code or already a name. */
export function locationName(value: string): string {
  return PROVINCES[value] ?? value
}

// --- Enum labels -----------------------------------------------------------
const EXPERIENCE: Record<string, string> = {
  NO_EXPERIENCE: "No experience",
  LT_1_YEAR: "Under 1 year",
  Y1_2: "1-2 years",
  Y2_3: "2-3 years",
  Y3_5: "3-5 years",
  Y5_10: "5-10 years",
  GT_10: "Over 10 years",
}

const JOB_LEVEL: Record<string, string> = {
  INTERN_STUDENT: "Intern / Student",
  FRESH_GRAD: "Fresh graduate",
  EMPLOYEE: "Staff",
  SPECIALIST_TEAM_LEAD: "Specialist / Team lead",
  MANAGER_HEAD: "Manager / Head of department",
  DIRECTOR: "Director",
  EXECUTIVE: "Executive",
}

const EMPLOYMENT_TYPE: Record<string, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract / seasonal",
  INTERNSHIP: "Internship",
  REMOTE: "Remote",
}

function label(map: Record<string, string>, value: unknown): string | null {
  if (typeof value !== "string" || !value) return null
  return map[value] ?? value
}

// --- Field mapping ---------------------------------------------------------

export interface RawJob {
  id?: string
  title?: string | null
  slug?: string | null
  locations?: string[] | null
  location?: string | null
  specificAddress?: string | null
  remote?: boolean | null
  currency?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  benefitsIncome?: string | null
  employmentType?: string | null
  experienceLevel?: string | null
  jobLevel?: string | null
  department?: string | null
  isActive?: boolean | null
  applicationDeadline?: string | null
  createdAt?: string | null
  company?: { name?: string | null } | null
  generalInfo?: string | null
  mission?: string | null
  tasks?: string | null
  kpis?: string | null
  knowledge?: string | null
  skills?: string | null
  attitude?: string | null
  authority?: string | null
  relationships?: string | null
  careerPath?: string | null
  benefitsPerks?: string | null
  workingTimeRanges?: Array<{ dayFrom?: string; dayTo?: string; timeStart?: string; timeEnd?: string }> | null
  workingTimeNote?: string | null
}

export interface JobCard {
  id: string
  title: string | null
  company: string | null
  location: string | null
  date: string | null
  url: string | null
  salary: string | null
  deadline: string | null
  expired: boolean
  level: string | null
  experience: string | null
  employmentType: string | null
}

export interface JobDetail extends JobCard {
  department: string | null
  address: string | null
  workingHours: string | null
  description: string | null
}

export function locationOf(raw: RawJob): string | null {
  const parts: string[] = []
  if (Array.isArray(raw.locations)) {
    for (const l of raw.locations) {
      if (typeof l === "string" && l.trim()) parts.push(locationName(l.trim()))
    }
  }
  if (parts.length === 0 && raw.location?.trim()) parts.push(locationName(raw.location.trim()))
  if (raw.remote) parts.push("Remote")
  return parts.length ? [...new Set(parts)].join(", ") : null
}

function groupThousands(n: number): string {
  return n.toLocaleString("en-US")
}

/**
 * Build a human salary string the way the site does: the numeric range when the
 * employer filled it in, otherwise the free-text income note, otherwise null. The
 * API carries no pay period, so none is appended.
 */
export function formatSalary(raw: RawJob): string | null {
  const cur = raw.currency || "VND"
  const min = Number(raw.salaryMin) || 0
  const max = Number(raw.salaryMax) || 0
  if (min > 0 && max > 0) return `${groupThousands(min)} - ${groupThousands(max)} ${cur}`
  if (min > 0) return `From ${groupThousands(min)} ${cur}`
  if (max > 0) return `Up to ${groupThousands(max)} ${cur}`
  const note = raw.benefitsIncome ? htmlToText(raw.benefitsIncome) : ""
  return note || null
}

/**
 * A posting is expired when the employer stopped hiring (`isActive: false`, the
 * site's "Đã ngừng tuyển") or its deadline has passed ("Đã hết hạn ứng tuyển").
 * Keyword search returns both kinds alongside open postings.
 */
export function isExpired(raw: RawJob, now: number = Date.now()): boolean {
  if (raw.isActive === false) return true
  if (raw.applicationDeadline) {
    const t = Date.parse(raw.applicationDeadline)
    if (!Number.isNaN(t) && t < now) return true
  }
  return false
}

/** Same rule the site uses for jobs without a stored slug. */
export function slugify(title: string): string {
  return foldDiacritics(title)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function urlOf(raw: RawJob): string | null {
  if (!raw.id) return null
  const slug = raw.slug || (raw.title ? slugify(raw.title) : "")
  return encodeURI(`${SITE_URL}/${slug}--${raw.id}`)
}

export function mapJobCard(raw: RawJob, now: number = Date.now()): JobCard {
  return {
    id: String(raw.id ?? ""),
    title: raw.title?.trim() || null,
    company: raw.company?.name?.trim() || null,
    location: locationOf(raw),
    date: raw.createdAt ?? null,
    url: urlOf(raw),
    salary: formatSalary(raw),
    deadline: raw.applicationDeadline ?? null,
    expired: isExpired(raw, now),
    level: label(JOB_LEVEL, raw.jobLevel),
    experience: label(EXPERIENCE, raw.experienceLevel),
    employmentType: label(EMPLOYMENT_TYPE, raw.employmentType),
  }
}

const DAYS: Record<string, string> = {
  MON: "Mon", TUE: "Tue", WED: "Wed", THU: "Thu", FRI: "Fri", SAT: "Sat", SUN: "Sun",
}

export function workingHoursOf(raw: RawJob): string | null {
  const parts: string[] = []
  for (const r of raw.workingTimeRanges ?? []) {
    const days = [r.dayFrom, r.dayTo].filter(Boolean).map((d) => DAYS[d as string] ?? d)
    const span = days.length === 2 && days[0] !== days[1] ? `${days[0]}-${days[1]}` : days[0] ?? ""
    const time = r.timeStart && r.timeEnd ? `${r.timeStart}-${r.timeEnd}` : ""
    const entry = [span, time].filter(Boolean).join(" ")
    if (entry) parts.push(entry)
  }
  const note = raw.workingTimeNote?.trim().replace(/\s*\n\s*/g, "; ")
  if (note) parts.push(note)
  return parts.length ? parts.join("; ") : null
}

function section(heading: string, body: string): string {
  return `${heading}\n${"-".repeat(heading.length)}\n${body}`
}

/**
 * Assemble the readable description in the site's own section order: mission,
 * tasks, key results, requirements (knowledge / skills / attitude), authority,
 * working relationships, career path, benefits.
 */
export function buildDescription(raw: RawJob): string | null {
  const text = (html: string | null | undefined) => (html ? htmlToText(html) : "")
  const out: string[] = []

  const overview = text(raw.generalInfo)
  if (overview) out.push(overview)

  const simple: Array<[string, string | null | undefined]> = [
    ["MISSION", raw.mission],
    ["TASKS", raw.tasks],
    ["KEY RESULTS", raw.kpis],
  ]
  for (const [heading, html] of simple) {
    const body = text(html)
    if (body) out.push(section(heading, body))
  }

  const requirements = (
    [
      ["Knowledge", raw.knowledge],
      ["Skills", raw.skills],
      ["Attitude", raw.attitude],
    ] as Array<[string, string | null | undefined]>
  )
    .map(([sub, html]) => [sub, text(html)] as const)
    .filter(([, body]) => body)
    .map(([sub, body]) => `${sub}:\n${body}`)
  if (requirements.length) out.push(section("REQUIREMENTS", requirements.join("\n\n")))

  const tail: Array<[string, string | null | undefined]> = [
    ["AUTHORITY", raw.authority],
    ["WORKING RELATIONSHIPS", raw.relationships],
    ["CAREER PATH", raw.careerPath],
  ]
  for (const [heading, html] of tail) {
    const body = text(html)
    if (body) out.push(section(heading, body))
  }

  const income = text(raw.benefitsIncome)
  const perks = text(raw.benefitsPerks)
  const benefits = [income ? `Income: ${income}` : "", perks].filter(Boolean).join("\n")
  if (benefits) out.push(section("BENEFITS", benefits))

  const joined = out.join("\n\n").trim()
  return joined || null
}

/** Every searchable word of a posting, accent-folded - used by `search --strict`. */
export function searchableText(raw: RawJob): string {
  const fields = [
    raw.title, raw.generalInfo, raw.mission, raw.tasks, raw.kpis, raw.knowledge,
    raw.skills, raw.attitude, raw.department,
  ]
  return foldDiacritics(fields.filter(Boolean).map((f) => htmlToText(f as string)).join("\n"))
}

/** True when the text carries Vietnamese tone or vowel marks, or đ. */
function hasDiacritics(s: string): boolean {
  return /[\u0300-\u036f]/.test(s.normalize("NFD")) || /[đĐ]/.test(s)
}

/**
 * True when the posting's text matches the query, accent-insensitively.
 *
 * An accented query is Vietnamese, whose words are single syllables, so it must occur
 * as one phrase within a line, bounded by non-letters. Matched term by term,
 * "lập trình viên" hits nearly every posting: "lắp đặt", "quy trình" and "nhân viên"
 * supply the three syllables separately. Any other query needs each
 * whitespace-separated term somewhere in the text.
 */
export function matchesAllTerms(raw: RawJob, query: string): boolean {
  const haystack = searchableText(raw)
  const terms = foldDiacritics(query).split(/\s+/).filter(Boolean)
  if (!hasDiacritics(query)) return terms.every((term) => haystack.includes(term))
  const phrase = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("[^\\S\\n]+")
  return new RegExp(`(?<![a-z0-9])${phrase}(?![a-z0-9])`).test(haystack)
}

export function mapJobDetail(raw: RawJob, now: number = Date.now()): JobDetail {
  return {
    ...mapJobCard(raw, now),
    department: raw.department?.trim() || null,
    address: raw.specificAddress?.trim() || null,
    workingHours: workingHoursOf(raw),
    description: buildDescription(raw),
  }
}

/**
 * Extract the job id (a cuid such as "cmvaaz25x08uhp066wlvmmh9d") from a bare id,
 * a "<slug>--<id>" segment, or a full https://joywork.vn/jobs/<slug>--<id> URL.
 */
export function extractId(input: string): string | null {
  let s = String(input).trim().replace(/[?#].*$/, "").replace(/\/+$/, "")
  const sep = s.lastIndexOf("--")
  if (sep !== -1) s = s.slice(sep + 2)
  else if (s.includes("/")) s = s.slice(s.lastIndexOf("/") + 1)
  return /^c[a-z0-9]{20,31}$/.test(s) ? s : null
}
