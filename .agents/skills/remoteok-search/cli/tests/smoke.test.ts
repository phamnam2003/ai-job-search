import { describe, test, expect } from "bun:test"
import { runCLI, parseJSON } from "./helpers"
import {
  decodeHtmlEntities,
  htmlToText,
  formatSalary,
  extractId,
  foldDiacritics,
  cleanLocation,
  fixMojibake,
  mapJobCard,
  isJobEntry,
  matchesQuery,
  matchesTag,
  withinJobage,
} from "../src/helpers"

interface SearchOut {
  meta: { count: number; page: number }
  results: Array<{
    id: string
    title: string | null
    url: string | null
    company: string | null
    location: string | null
    tags: string[] | null
  }>
}

// --- Offline parser unit tests (no network) --------------------------------
describe("parsers", () => {
  test("decodeHtmlEntities decodes named + numeric references", () => {
    expect(decodeHtmlEntities("R&amp;D &amp; DevOps")).toBe("R&D & DevOps")
    expect(decodeHtmlEntities("caf&eacute; &ndash; menu")).toBe("café – menu")
    expect(decodeHtmlEntities("&#233;quipe &#x1F600;")).toBe("équipe 😀")
  })

  test("htmlToText strips tags, bullets list items, and preserves breaks", () => {
    const html = "<strong>Overview</strong><br><ul><li>Go</li><li>Kafka</li></ul>"
    const text = htmlToText(html)
    expect(text).toContain("Overview")
    expect(text).toContain("• Go")
    expect(text).toContain("• Kafka")
    expect(text).not.toContain("<")
  })

  test("formatSalary handles USD ranges, open-ended, and undisclosed", () => {
    expect(formatSalary(50000, 70000)).toBe("$50,000 - $70,000")
    expect(formatSalary(0, 90000)).toBe("Up to $90,000")
    expect(formatSalary(60000, 0)).toBe("From $60,000")
    expect(formatSalary(0, 0)).toBeNull()
  })

  test("extractId parses bare id and a remote-jobs slug/url", () => {
    expect(extractId("1134900")).toBe("1134900")
    expect(extractId("https://remoteok.com/remote-jobs/remote-hr-assistant-sundayy-1134900")).toBe(
      "1134900",
    )
    expect(extractId("remote-golang-engineer-acme-987654?utm=x")).toBe("987654")
    expect(extractId("not-a-job")).toBeNull()
  })

  test("foldDiacritics enables accent-insensitive matching", () => {
    expect(foldDiacritics("Perú")).toBe("peru")
    expect(foldDiacritics("Hà Nội")).toContain("ha noi")
  })

  test("cleanLocation trims RemoteOK's trailing-comma noise", () => {
    expect(cleanLocation("United States, ")).toBe("United States")
    expect(cleanLocation("")).toBeNull()
    expect(cleanLocation(null)).toBeNull()
  })

  test("fixMojibake repairs UTF-8-as-Latin1 damage but leaves good text alone", () => {
    // Classic 2-byte damage RemoteOK bakes in.
    expect(fixMojibake("Programa de EstÃ¡gio FormaÃ§Ã£o")).toBe("Programa de Estágio Formação")
    expect(fixMojibake("PerÃº")).toBe("Perú")
    // Already-correct text (real accents, no Ã/Â lead) is untouched.
    expect(fixMojibake("Estágio Formação")).toBe("Estágio Formação")
    expect(fixMojibake("Backend Engineer")).toBe("Backend Engineer")
    // Genuine Unicode (codepoint > 0xFF, e.g. em-dash) is never corrupted.
    expect(fixMojibake("Remote — Worldwide")).toBe("Remote — Worldwide")
  })

  test("isJobEntry skips the legal metadata object at element [0]", () => {
    expect(isJobEntry({ legal: "terms...", last_updated: 1 })).toBe(false)
    expect(isJobEntry({ id: "123", position: "Go Dev" })).toBe(true)
    expect(isJobEntry(null)).toBe(false)
  })

  test("mapJobCard maps the confirmed API shape, defaulting blank location to Remote", () => {
    const card = mapJobCard({
      id: "1134900",
      slug: "remote-golang-engineer-acme-1134900",
      position: "Golang Engineer",
      company: "Acme",
      location: "",
      date: "2026-07-16T05:02:12+00:00",
      url: "https://remoteok.com/remote-jobs/remote-golang-engineer-acme-1134900",
      salary_min: 60000,
      salary_max: 90000,
      tags: ["golang", "backend"],
    })
    expect(card.id).toBe("1134900")
    expect(card.title).toBe("Golang Engineer")
    expect(card.company).toBe("Acme")
    expect(card.location).toBe("Remote")
    expect(card.url).toContain("1134900")
    expect(card.salary).toBe("$60,000 - $90,000")
    expect(card.tags).toEqual(["golang", "backend"])
  })

  test("matchesQuery does token-AND over the TITLE only (ignores tags/company/description)", () => {
    const job = {
      position: "Senior Backend Engineer",
      company: "Golang Corp",
      tags: ["golang", "kubernetes", "medical"],
      description: "Work on distributed golang systems.",
    }
    expect(matchesQuery(job, "backend")).toBe(true)
    expect(matchesQuery(job, "senior engineer")).toBe(true) // token-AND, both in title
    // "golang" is only in the stuffed tags / company / description, NOT the title -> no match.
    expect(matchesQuery(job, "golang")).toBe(false)
    expect(matchesQuery(job, "frontend")).toBe(false)
    // Empty query matches everything.
    expect(matchesQuery(job, "")).toBe(true)
  })

  test("matchesTag is the opt-in tag filter (case-insensitive, substring within a tag)", () => {
    const job = { position: "Anything", tags: ["golang", "react.js", "full stack"] }
    expect(matchesTag(job, "golang")).toBe(true)
    expect(matchesTag(job, "React")).toBe(true) // matches "react.js", case-insensitive
    expect(matchesTag(job, "full stack")).toBe(true)
    expect(matchesTag(job, "python")).toBe(false)
    expect(matchesTag({ position: "x", tags: [] }, "golang")).toBe(false)
  })

  test("withinJobage filters on epoch relative to now", () => {
    const nowSec = Math.floor(Date.now() / 1000)
    expect(withinJobage({ epoch: nowSec - 2 * 86400 }, 7)).toBe(true)
    expect(withinJobage({ epoch: nowSec - 30 * 86400 }, 7)).toBe(false)
    expect(withinJobage({ epoch: nowSec }, 0)).toBe(true) // 0/absent days => no filter
  })
})

// --- Live smoke tests (hit the public RemoteOK API) ------------------------
describe("search (live)", () => {
  // Use NO keyword so the feed (latest ~100 postings) is guaranteed non-empty.
  // A niche `-q` term (e.g. golang) may legitimately return 0 now that matching is
  // title-only — that's honest, so we don't assert ">0" on a niche term.
  test("returns at least one real result with non-null id/title/url", async () => {
    const res = await runCLI(["search", "--limit", "3", "--format", "json"])
    expect(res.exitCode).toBe(0)
    const out = parseJSON<SearchOut>(res)
    expect(out.results.length).toBeGreaterThan(0)
    const first = out.results[0]
    expect(first.id).toBeTruthy()
    expect(first.title).toBeTruthy()
    expect(first.url).toBeTruthy()
    // location is never omitted — blank source locations become "Remote".
    expect(first.location).toBeTruthy()
  })

  test("table format runs and prints a header", async () => {
    const res = await runCLI(["search", "--limit", "3", "--format", "table"])
    expect(res.exitCode).toBe(0)
    expect(res.stdout).toContain("TITLE")
  })

  test("a niche title term returning 0 results is a clean exit, not an error", async () => {
    const res = await runCLI([
      "search",
      "-q",
      "zzqqxx-nonexistent-title",
      "--format",
      "json",
    ])
    expect(res.exitCode).toBe(0)
    const out = parseJSON<SearchOut>(res)
    expect(out.results.length).toBe(0)
    expect(out.meta.count).toBe(0)
  })
})

// --- Error handling --------------------------------------------------------
describe("errors", () => {
  test("detail with no id exits 1 with a JSON error on stderr", async () => {
    const res = await runCLI(["detail"])
    expect(res.exitCode).toBe(1)
    expect(res.stdout).toBe("")
    const err = JSON.parse(res.stderr) as { error: string; code: string }
    expect(err.code).toBe("NO_ID")
    expect(err.error).toBeTruthy()
  })

  test("unknown command exits 1 with a JSON error on stderr", async () => {
    const res = await runCLI(["frobnicate"])
    expect(res.exitCode).toBe(1)
    const err = JSON.parse(res.stderr) as { error: string; code: string }
    expect(err.code).toBe("BAD_CMD")
  })
})
