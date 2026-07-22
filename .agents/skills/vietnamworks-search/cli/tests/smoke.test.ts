import { describe, test, expect } from "bun:test"
import { runCLI, parseJSON } from "./helpers"
import {
  decodeHtmlEntities,
  htmlToText,
  foldDiacritics,
  extractId,
  locationOf,
  urlOf,
  mapJobCard,
  ageInDays,
} from "../src/helpers"

interface SearchOut {
  meta: { count: number; page: number }
  results: Array<{
    id: string
    title: string | null
    url: string | null
    company: string | null
    location: string | null
  }>
}

// --- Offline parser unit tests (no network) --------------------------------
describe("parsers", () => {
  test("decodeHtmlEntities decodes named + numeric entities", () => {
    expect(decodeHtmlEntities("R&amp;D &amp; APIs")).toBe("R&D & APIs")
    expect(decodeHtmlEntities("20.000.000 &ndash; 30.000.000")).toBe("20.000.000 – 30.000.000")
    expect(decodeHtmlEntities("&#233;quipe &#x1F600;")).toBe("équipe 😀")
  })

  test("htmlToText strips tags, bullets list items, preserves breaks", () => {
    const html = "<p>Trách nhiệm</p><ul><li>Go</li><li>Kafka</li></ul>"
    const text = htmlToText(html)
    expect(text).toContain("Trách nhiệm")
    expect(text).toContain("• Go")
    expect(text).toContain("• Kafka")
    expect(text).not.toContain("<")
  })

  test("foldDiacritics enables accent-insensitive location matching", () => {
    expect(foldDiacritics("Hà Nội")).toBe("ha noi")
    expect(foldDiacritics("Đà Nẵng")).toBe("da nang")
  })

  test("extractId parses bare id, -jv/-jd url, and slug-with-id", () => {
    expect(extractId("2076956")).toBe("2076956")
    expect(extractId("https://www.vietnamworks.com/backend-developer-2076956-jv")).toBe("2076956")
    expect(extractId("https://www.vietnamworks.com/foo-bar-2076956-jd?utm=x")).toBe("2076956")
    expect(extractId("not-a-job")).toBeNull()
  })

  test("locationOf joins + de-duplicates working-location city names", () => {
    expect(
      locationOf({
        workingLocations: [
          { cityName: "Ha Noi", cityNameVI: "Hà Nội" },
          { cityName: "Ha Noi", cityNameVI: "Hà Nội" },
        ],
      }),
    ).toBe("Ha Noi")
    expect(locationOf({ workingLocations: [] })).toBeNull()
  })

  test("urlOf prefers jobUrl and falls back to alias + id", () => {
    expect(urlOf({ jobUrl: "https://www.vietnamworks.com/x-1-jv" })).toBe(
      "https://www.vietnamworks.com/x-1-jv",
    )
    expect(urlOf({ jobUrl: "", alias: "go-dev", jobId: 999 })).toBe(
      "https://www.vietnamworks.com/go-dev-999-jv",
    )
    expect(urlOf({ jobUrl: "" })).toBeNull()
  })

  test("ageInDays returns null on unparseable input, a number otherwise", () => {
    expect(ageInDays(null)).toBeNull()
    expect(ageInDays("not-a-date")).toBeNull()
    expect(ageInDays(new Date().toISOString())).toBeLessThan(1)
  })

  test("mapJobCard maps the confirmed API shape to a JobCard", () => {
    const card = mapJobCard({
      jobId: 2076956,
      jobTitle: "Backend Developer (Java/.Net/Golang)",
      companyName: "VINSMART FUTURE",
      alias: "backend-developer-java-netgolang",
      jobUrl: "https://www.vietnamworks.com/backend-developer-java-netgolang-2076956-jv",
      prettySalary: "Thương lượng",
      approvedOn: "2026-07-03T11:58:05+07:00",
      workingLocations: [{ cityName: "Ha Noi", cityNameVI: "Hà Nội" }],
      skills: [{ skillName: "Golang" }, { skillName: "Java" }, { skillName: "Java" }],
    })
    expect(card.id).toBe("2076956")
    expect(card.title).toContain("Backend Developer")
    expect(card.company).toBe("VINSMART FUTURE")
    expect(card.location).toBe("Ha Noi")
    expect(card.url).toContain("2076956")
    expect(card.salary).toBe("Thương lượng")
    expect(card.skills).toBe("Golang, Java")
  })
})

// --- Live smoke tests (hit the public VietnamWorks microservice) -----------
describe("search (live)", () => {
  test("returns at least one real result with non-null id/title/url", async () => {
    const res = await runCLI(["search", "-q", "backend", "--limit", "3", "--format", "json"])
    expect(res.exitCode).toBe(0)
    const out = parseJSON<SearchOut>(res)
    expect(out.results.length).toBeGreaterThan(0)
    const first = out.results[0]
    expect(first.id).toBeTruthy()
    expect(first.title).toBeTruthy()
    expect(first.url).toBeTruthy()
  })

  test("table format runs and prints a header", async () => {
    const res = await runCLI(["search", "-q", "developer", "--limit", "3", "--format", "table"])
    expect(res.exitCode).toBe(0)
    expect(res.stdout).toContain("TITLE")
  })

  test("location filter narrows to the requested city", async () => {
    const res = await runCLI(["search", "-q", "developer", "-l", "Ha Noi", "--limit", "5", "--format", "json"])
    expect(res.exitCode).toBe(0)
    const out = parseJSON<SearchOut>(res)
    for (const r of out.results) {
      expect(foldDiacritics(r.location || "")).toContain("ha noi")
    }
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
