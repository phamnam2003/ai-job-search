import { describe, test, expect } from "bun:test"
import { runCLI, parseJSON } from "./helpers"
import {
  decodeHtmlEntities,
  htmlToText,
  formatSalary,
  extractId,
  foldDiacritics,
  mapJobCard,
} from "../src/helpers"

interface SearchOut {
  meta: { count: number; page: number }
  results: Array<{ id: string; title: string | null; url: string | null; company: string | null }>
}

// --- Offline parser unit tests (no network) --------------------------------
describe("parsers", () => {
  test("decodeHtmlEntities decodes named Latin entities used in Vietnamese content", () => {
    expect(decodeHtmlEntities("C&ocirc;ng ngh&ecirc;")).toBe("Công nghê")
    expect(decodeHtmlEntities("60.000.000 &ndash; 90.000.000")).toBe("60.000.000 – 90.000.000")
    expect(decodeHtmlEntities("R&amp;D &amp; DevOps")).toBe("R&D & DevOps")
    expect(decodeHtmlEntities("&#233;quipe &#x1F600;")).toBe("équipe 😀")
  })

  test("htmlToText strips tags, bullets list items, and preserves breaks", () => {
    const html = "<p>Overview</p><ul><li>Go</li><li>Kafka</li></ul>"
    const text = htmlToText(html)
    expect(text).toContain("Overview")
    expect(text).toContain("• Go")
    expect(text).toContain("• Kafka")
    expect(text).not.toContain("<")
  })

  test("formatSalary handles VND ranges, negotiable, and masked values", () => {
    expect(
      formatSalary({ min_filter: 20000000, max_filter: 25000000, currency: "VND", unit: "MONTH", is_negotiable: "0" }),
    ).toBe("20,000,000 - 25,000,000 VND/month")
    expect(formatSalary({ is_negotiable: "1", min_filter: 0, max_filter: 0 })).toBe("Negotiable")
    // Masked display value with a non-VND currency -> null rather than wrong numbers.
    expect(
      formatSalary({ currency: "USD", value: "8** - 2*** USD", is_negotiable: "0", min_filter: 0, max_filter: 0 }),
    ).toBeNull()
  })

  test("extractId parses bare id, detail_url, and slug-with-id", () => {
    expect(extractId("2118052")).toBe("2118052")
    expect(extractId("https://topdev.vn/detail-jobs/tech-lead-golang-rontech-2118052")).toBe("2118052")
    expect(extractId("https://topdev.vn/detail-jobs/foo-2118052?utm=x")).toBe("2118052")
    expect(extractId("not-a-job")).toBeNull()
  })

  test("foldDiacritics enables accent-insensitive location matching", () => {
    expect(foldDiacritics("Thành phố Hà Nội")).toContain("ha noi")
    expect(foldDiacritics("Đà Nẵng")).toBe("da nang")
  })

  test("mapJobCard maps the confirmed API shape to a JobCard", () => {
    const card = mapJobCard({
      id: 2118052,
      title: "Tech Lead (Golang)",
      slug: "tech-lead-golang",
      detail_url: "https://topdev.vn/detail-jobs/tech-lead-golang-2118052",
      company: { display_name: "RONTECH" },
      addresses: { address_region_array: ["Thành phố Hà Nội"] },
      salary: { min_filter: 60000000, max_filter: 90000000, currency: "VND", unit: "MONTH", is_negotiable: "0" },
      skills_str: "Golang, Java",
    })
    expect(card.id).toBe("2118052")
    expect(card.title).toBe("Tech Lead (Golang)")
    expect(card.company).toBe("RONTECH")
    expect(card.location).toBe("Thành phố Hà Nội")
    expect(card.url).toContain("2118052")
    expect(card.salary).toContain("VND")
  })
})

// --- Live smoke tests (hit the public TopDev API) --------------------------
describe("search (live)", () => {
  test("returns at least one real result with non-null id/title/url", async () => {
    const res = await runCLI(["search", "-q", "python", "--limit", "3", "--format", "json"])
    expect(res.exitCode).toBe(0)
    const out = parseJSON<SearchOut>(res)
    expect(out.results.length).toBeGreaterThan(0)
    const first = out.results[0]
    expect(first.id).toBeTruthy()
    expect(first.title).toBeTruthy()
    expect(first.url).toBeTruthy()
  })

  test("table format runs and prints a header", async () => {
    const res = await runCLI(["search", "-q", "backend", "--limit", "3", "--format", "table"])
    expect(res.exitCode).toBe(0)
    expect(res.stdout).toContain("TITLE")
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
