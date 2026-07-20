// facebook-search: a ZERO-NETWORK hybrid portal helper.
//
// This CLI NEVER contacts Facebook. Facebook is login-walled with aggressive
// anti-bot measures, and its Terms of Service prohibit automated scraping. So
// instead of fetching, this skill does two things that are safe and durable:
//
//   1. `links`            — builds Facebook search / group URLs for YOU to open
//                           and browse yourself (pure string building, no fetch).
//   2. `search`/`detail`  — parse recruitment posts YOU manually paste into the
//                           inbox folder, turning free-text Vietnamese posts into
//                           the standard job schema used by /scrape and /rank.
//
// No credentials, no browser automation, no ToS violation, no account risk.

import { readdirSync, readFileSync, statSync } from "fs"
import { join, resolve } from "path"

export function writeError(error: string, code: string): void {
  process.stderr.write(JSON.stringify({ error, code }) + "\n")
}

export interface FbJob {
  id: string
  title: string
  company: string | null
  location: string | null
  salary: string | null
  date: string | null // deadline / posted date if detectable, else null
  url: string | null // facebook post or apply link if present in the text
  tags: string[]
  source: string // inbox filename the post came from
}

export interface FbJobDetail extends FbJob {
  description: string // the cleaned full pasted text
}

export interface FbLink {
  type: string
  label: string
  url: string
}

// ---------------------------------------------------------------------------
// Text utilities
// ---------------------------------------------------------------------------

/** Strip Vietnamese diacritics so ASCII regexes can match accent-insensitively. */
export function deaccent(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
}

/** Remove leading emoji / list-marker decoration common in Facebook posts. */
function stripDecor(s: string): string {
  return s
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}←-⇿⬀-⯿️]/gu, " ")
    .replace(/[*_>#•·▪◼◾►▶‣]+/g, " ")
    .replace(/^\s*[-–—]\s+/, "")
    .replace(/\s+/g, " ")
    .trim()
}

/** Deterministic FNV-1a hash → short base36 id, for posts without a usable URL. */
function hashId(s: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return "fb-" + (h >>> 0).toString(36)
}

/** Pull a stable numeric post id out of a Facebook URL, if present. */
function idFromFbUrl(url: string): string | null {
  const m =
    url.match(/\/groups\/\d+\/posts\/(\d{6,})/) ||
    url.match(/\/posts\/(?:[^/?]*?)(\d{8,})/) ||
    url.match(/permalink\/(\d{6,})/) ||
    url.match(/story_fbid=(\d{6,})/) ||
    url.match(/\bfbid=(\d{6,})/) ||
    url.match(/(\d{10,})/)
  return m ? m[1] : null
}

// ---------------------------------------------------------------------------
// Field extractors (best-effort heuristics over Vietnamese recruitment text)
// ---------------------------------------------------------------------------

const ROLE_RE =
  /(back[- ]?end|front[- ]?end|full[- ]?stack|golang|\bgo\b|java(?!script)|javascript|node(?:\.?js)?|reactjs?|vue(?:js)?|angular|python|php|\.net|c#|c\+\+|rust|devops|sre|mobile|android|ios|flutter|qa|tester|\bdata\b|\bai\b|\bml\b|blockchain|solidity|embedded|game|unity|business analyst|\bba\b|product manager|\bpm\b|designer|ui\/ux|l[aậ]p tr[iì]nh vi[eê]n|k[yỹ] s[uư]|developer|engineer|intern|fresher|middle|senior|junior|lead|architect)/i

const CUE_RE =
  /(tuy[eể]n d[uụ]ng|tuy[eể]n g[aấ]p|tuy[eể]n|v[iị] tr[ií]|position|recruit(?:ing|ment)?|hiring|c[aầ]n tuy[eể]n|job title|\brole\b)\s*[:\-–]?\s*(.+)/i

/** Best-effort role/title. */
export function detectTitle(text: string): string {
  const lines = text.split(/\n+/).map(stripDecor).filter(Boolean)
  for (const line of lines) {
    const m = line.match(CUE_RE)
    if (m && m[2] && ROLE_RE.test(m[2])) return m[2].replace(/[|·•].*$/, "").slice(0, 90).trim()
  }
  for (const line of lines) {
    if (ROLE_RE.test(line) && line.length <= 100) return line.replace(/[|·•].*$/, "").slice(0, 90).trim()
  }
  return (lines[0] || "(untitled)").slice(0, 90)
}

/** Best-effort employer name. */
export function detectCompany(text: string): string | null {
  const lines = text.split(/\n+/).map(stripDecor).filter(Boolean)
  for (const line of lines) {
    const m = line.match(/\b(c[oô]ng ty|cty|company)\b\s*[:\-–]?\s*(.+)/i)
    if (m && m[2]) {
      let name = m[2].split(/\s+(tuy[eể]n|c[aầ]n|recruit|hiring|[dđ]ang|hi[eệ]n)\b/i)[0]
      name = name.replace(/[|·•\-–—:].*$/, "").trim()
      if (name.length >= 2) return name.slice(0, 60)
    }
  }
  const at = text.match(/@\s?([A-Za-zĐđ][\w&.\- ]{2,40})/)
  if (at) return at[1].trim()
  return null
}

/** Detect Vietnamese cities / remote (accent-insensitive), joined if several. */
export function detectLocation(text: string): string | null {
  const t = deaccent(text).toLowerCase()
  const cities: Array<[RegExp, string]> = [
    [/\bha noi\b|\bhanoi\b|\bhn\b/, "Hà Nội"],
    [/\bho chi minh\b|\bhcmc?\b|\bsai gon\b|\btp\.? ?hcm\b|\btphcm\b/, "Hồ Chí Minh"],
    [/\bda nang\b|\bdanang\b/, "Đà Nẵng"],
    [/\bbac ninh\b/, "Bắc Ninh"],
    [/\bhung yen\b/, "Hưng Yên"],
    [/\bhai phong\b/, "Hải Phòng"],
    [/\bcan tho\b/, "Cần Thơ"],
  ]
  const found: string[] = []
  for (const [re, name] of cities) if (re.test(t)) found.push(name)
  if (/\bremote\b|\bwfh\b|lam viec tu xa|\btu xa\b/.test(t)) found.push("Remote")
  return found.length ? [...new Set(found)].join(", ") : null
}

/** Best-effort salary phrase. */
export function detectSalary(text: string): string | null {
  const moneyRe =
    /(up ?to|upto|t[uừ]|from)?\s*\$?\s?\d[\d.,]*\s*(?:-|to|–|đ[eế]n)?\s*\$?\d?[\d.,]*\s*(tri[eệ]u|\btr\b|trieu|\bm\b|\bk\b|usd|vnd|\$|c[uủ])/i
  const negoRe = /(th[oỏ]a? thu[aậ]n|thoa thuan|negotiable|\bdeal\b|c[aạ]nh tranh|competitive)/i
  for (const line of text.split(/\n+/)) {
    if (/(l[uư][oơ]ng|salary|thu nh[aậ]p|income|package|m[uứ]c l[uư][oơ]ng)/i.test(line)) {
      if (moneyRe.test(line)) return stripDecor(line).slice(0, 80)
      if (negoRe.test(line)) return "Thoả thuận"
    }
  }
  const m = text.match(moneyRe)
  if (m) return m[0].trim()
  if (negoRe.test(text)) return "Thoả thuận"
  return null
}

/** Best-effort application deadline (dd/mm[/yyyy]). */
export function detectDeadline(text: string): string | null {
  const m = text.match(/(h[aạ]n n[oộ]p|deadline|h[aạ]n|due)[^\d]{0,12}(\d{1,2}[/\-.]\d{1,2}(?:[/\-.]\d{2,4})?)/i)
  return m ? m[2] : null
}

/** First Facebook URL, else first http(s) URL (likely the apply link). */
export function detectUrl(text: string): string | null {
  const fb = text.match(/https?:\/\/(?:www\.|m\.|web\.)?facebook\.com\/[^\s)\]]+/i)
  if (fb) return fb[0]
  const any = text.match(/https?:\/\/[^\s)\]]+/i)
  return any ? any[0] : null
}

const TAG_KEYWORDS = [
  "Golang", "Go", "Java", "Kotlin", "Python", "PHP", "Node.js", "NodeJS", "NestJS",
  "ReactJS", "React", "Next.js", "Vue", "Angular", "TypeScript", "JavaScript",
  "Kafka", "RabbitMQ", "Redis", "PostgreSQL", "MySQL", "Oracle", "MongoDB",
  "Docker", "Kubernetes", "gRPC", "GraphQL", "AWS", "GCP", "Azure",
  "Microservices", "DevOps", "CI/CD", ".NET", "C#", "C++", "Rust", "Elasticsearch",
]

/** Detect tech tags mentioned in the post. */
export function detectTags(text: string): string[] {
  const found: string[] = []
  for (const kw of TAG_KEYWORDS) {
    const esc = kw.replace(/[.+#/]/g, "\\$&")
    const re = new RegExp(`(?<![\\w.])${esc}(?![\\w])`, "i")
    if (re.test(text)) found.push(kw)
  }
  return [...new Set(found)]
}

/** Parse one pasted post into a structured job + full description. */
export function parsePost(raw: string, source: string): FbJobDetail {
  const text = raw.replace(/\r\n/g, "\n").trim()
  const url = detectUrl(text)
  const fbId = url ? idFromFbUrl(url) : null
  const title = detectTitle(text)
  const company = detectCompany(text)
  const id = fbId ? "fb-" + fbId : hashId(deaccent((company || "") + "|" + title + "|" + text.slice(0, 120)))
  return {
    id,
    title,
    company,
    location: detectLocation(text),
    salary: detectSalary(text),
    date: detectDeadline(text),
    url,
    tags: detectTags(text),
    source,
    description: text,
  }
}

// ---------------------------------------------------------------------------
// Inbox (manual-paste drop folder) + groups whitelist
// ---------------------------------------------------------------------------

/** Default inbox: <skill>/inbox (helpers.ts lives at <skill>/cli/src). */
export function defaultInbox(): string {
  return resolve(import.meta.dir, "../../inbox")
}

/** Default groups whitelist path: <skill>/groups.json. */
export function defaultGroupsPath(): string {
  return resolve(import.meta.dir, "../../groups.json")
}

/** Read and parse every .txt/.md post in the inbox folder. Missing dir → []. */
export function readInbox(dir: string): FbJobDetail[] {
  let entries: string[]
  try {
    entries = readdirSync(dir)
  } catch {
    return []
  }
  const files = entries.filter((f) => /\.(txt|md)$/i.test(f) && !/^readme/i.test(f)).sort()
  const jobs: FbJobDetail[] = []
  for (const f of files) {
    const full = join(dir, f)
    try {
      if (!statSync(full).isFile()) continue
      const raw = readFileSync(full, "utf8")
      if (raw.trim()) jobs.push(parsePost(raw, f))
    } catch {
      // skip unreadable file, never abort the whole batch
    }
  }
  return jobs
}

/** Read the groups whitelist ({ groups: [{id, name}] } or a bare array). */
export function readGroups(path: string): Array<{ id: string; name?: string }> {
  try {
    const data = JSON.parse(readFileSync(path, "utf8"))
    const arr = Array.isArray(data) ? data : Array.isArray(data?.groups) ? data.groups : []
    return arr.filter((g: unknown): g is { id: string; name?: string } => {
      return !!g && typeof (g as { id?: unknown }).id === "string"
    })
  } catch {
    return []
  }
}

/** Build Facebook browse URLs for a query. Pure string building, no network. */
export function buildLinks(
  query: string,
  location: string | undefined,
  groups: Array<{ id: string; name?: string }>,
): FbLink[] {
  const q = [query, location].filter(Boolean).join(" ").trim()
  const enc = encodeURIComponent(q)
  const links: FbLink[] = [
    { type: "posts", label: `Facebook post search: "${q}"`, url: `https://www.facebook.com/search/posts/?q=${enc}` },
    { type: "top", label: `Facebook top search: "${q}"`, url: `https://www.facebook.com/search/top/?q=${enc}` },
    {
      type: "groups-discover",
      label: `Find recruitment groups for: "${q}"`,
      url: `https://www.facebook.com/search/groups/?q=${encodeURIComponent(q + " tuyển dụng")}`,
    },
  ]
  for (const g of groups) {
    links.push({
      type: "group",
      label: `Search in group ${g.name || g.id}: "${q}"`,
      url: `https://www.facebook.com/groups/${g.id}/search/?q=${enc}`,
    })
  }
  return links
}
