import { describe, test, expect } from "bun:test"
import { runCLI, parseJSON } from "./helpers"
import {
  htmlToText,
  formatSalary,
  extractId,
  resolveLocation,
  locationOf,
  isExpired,
  mapJobCard,
  matchesAllTerms,
  buildDescription,
  workingHoursOf,
} from "../src/helpers"

interface SearchOut {
  meta: { count: number; page: number; expiredDropped: number }
  results: Array<{ id: string; title: string | null; url: string | null; expired: boolean; date: string | null }>
}

const NOW = Date.parse("2026-10-16T00:00:00Z")

// --- Offline parser unit tests (no network) --------------------------------
describe("parsers", () => {
  test("htmlToText flattens TipTap lists without blank lines between items", () => {
    const html = "<p>Intro&nbsp;text</p><ul><li><p>Go</p></li><li><p>Kafka &amp; gRPC</p></li></ul>"
    expect(htmlToText(html)).toBe("Intro text\n• Go\n• Kafka & gRPC")
  })

  test("resolveLocation accepts codes, accented and plain names, and aliases", () => {
    expect(resolveLocation("ha-noi")).toBe("ha-noi")
    expect(resolveLocation("Hà Nội")).toBe("ha-noi")
    expect(resolveLocation("ha noi")).toBe("ha-noi")
    expect(resolveLocation("hanoi")).toBe("ha-noi")
    expect(resolveLocation("TP. Hồ Chí Minh")).toBe("tp-ho-chi-minh")
    expect(resolveLocation("Ho Chi Minh")).toBe("tp-ho-chi-minh")
    expect(resolveLocation("HCM")).toBe("tp-ho-chi-minh")
    expect(resolveLocation("Đà Nẵng")).toBe("da-nang")
    expect(resolveLocation("Narnia")).toBeNull()
  })

  test("locationOf maps codes to names and falls back to the free-text field", () => {
    expect(locationOf({ locations: ["ha-noi", "tp-ho-chi-minh"] })).toBe("Hà Nội, TP. Hồ Chí Minh")
    expect(locationOf({ locations: ["Hà Nội"] })).toBe("Hà Nội")
    expect(locationOf({ locations: [], location: "Thanh Hóa" })).toBe("Thanh Hóa")
    expect(locationOf({ locations: ["ha-noi"], remote: true })).toBe("Hà Nội, Remote")
    expect(locationOf({})).toBeNull()
  })

  test("formatSalary prefers the numeric range, then the income note", () => {
    expect(formatSalary({ salaryMin: 26000000, salaryMax: 35000000, currency: "VND" })).toBe(
      "26,000,000 - 35,000,000 VND",
    )
    expect(formatSalary({ salaryMin: 3000000, salaryMax: null })).toBe("From 3,000,000 VND")
    expect(formatSalary({ salaryMax: 20000000 })).toBe("Up to 20,000,000 VND")
    expect(formatSalary({ benefitsIncome: "17 - 25 triệu" })).toBe("17 - 25 triệu")
    expect(formatSalary({})).toBeNull()
  })

  test("isExpired flags stopped hiring and passed deadlines only", () => {
    expect(isExpired({ isActive: false }, NOW)).toBe(true)
    expect(isExpired({ isActive: true, applicationDeadline: "2026-05-15T12:00:00.000Z" }, NOW)).toBe(true)
    expect(isExpired({ isActive: true, applicationDeadline: "2026-11-02T12:00:00.000Z" }, NOW)).toBe(false)
    expect(isExpired({ isActive: true, applicationDeadline: null }, NOW)).toBe(false)
  })

  test("extractId parses a bare id, a slug segment, and a full URL", () => {
    const id = "cmvaaz25x08uhp066wlvmmh9d"
    expect(extractId(id)).toBe(id)
    expect(extractId(`ke-toan-thue--${id}`)).toBe(id)
    expect(extractId(`https://joywork.vn/jobs/ke-toan-thue--${id}?ref=x`)).toBe(id)
    expect(extractId(`https://joywork.vn/jobs/midsenior-backend-developer-(golangpythontypescript)--${id}/`)).toBe(id)
    expect(extractId("not-a-job")).toBeNull()
    expect(extractId("12345")).toBeNull()
  })

  test("mapJobCard fills every contract field, null when missing", () => {
    const card = mapJobCard(
      {
        id: "cmvaaz25x08uhp066wlvmmh9d",
        title: "Kế toán Thuế",
        slug: "ke-toan-thue",
        locations: ["ha-noi"],
        company: { name: "Công ty TNHH Horus Productions" },
        createdAt: "2026-10-16T01:42:36.213Z",
        salaryMin: 12000000,
        salaryMax: 18000000,
        currency: "VND",
        isActive: true,
        applicationDeadline: "2026-11-02T12:00:00.000Z",
        jobLevel: "EMPLOYEE",
        experienceLevel: "Y3_5",
        employmentType: "FULL_TIME",
      },
      NOW,
    )
    expect(card).toEqual({
      id: "cmvaaz25x08uhp066wlvmmh9d",
      title: "Kế toán Thuế",
      company: "Công ty TNHH Horus Productions",
      location: "Hà Nội",
      date: "2026-10-16T01:42:36.213Z",
      url: "https://joywork.vn/jobs/ke-toan-thue--cmvaaz25x08uhp066wlvmmh9d",
      salary: "12,000,000 - 18,000,000 VND",
      deadline: "2026-11-02T12:00:00.000Z",
      expired: false,
      level: "Staff",
      experience: "3-5 years",
      employmentType: "Full-time",
    })
    const sparse = mapJobCard({ id: "cmvaaz25x08uhp066wlvmmh9d" }, NOW)
    expect(sparse.title).toBeNull()
    expect(sparse.company).toBeNull()
    expect(sparse.location).toBeNull()
    expect(sparse.date).toBeNull()
  })

  test("matchesAllTerms is accent-insensitive and needs every term", () => {
    const raw = { title: "Lập trình viên Backend", knowledge: "<p>Thành thạo Golang, Kafka</p>" }
    expect(matchesAllTerms(raw, "golang kafka")).toBe(true)
    expect(matchesAllTerms(raw, "lap trinh")).toBe(true)
    expect(matchesAllTerms(raw, "golang rust")).toBe(false)
    expect(matchesAllTerms({ title: "Giảng viên Graphic Design" }, "golang")).toBe(false)
  })

  test("matchesAllTerms reads an accented query as one phrase, not loose syllables", () => {
    // Real false positive from 2026-10-16: "lập", "trình" and "viên" each occur, apart.
    const installer = { title: "NHÂN VIÊN KỸ THUẬT LẮP ĐẶT", tasks: "<p>Lắp đặt thiết bị theo đúng quy trình</p>" }
    expect(matchesAllTerms(installer, "lập trình viên")).toBe(false)
    expect(matchesAllTerms({ title: "LẬP TRÌNH VIÊN .NET" }, "lập trình viên")).toBe(true)
    expect(matchesAllTerms({ title: "Tuyển Lập  trình viên Backend" }, "lập trình viên")).toBe(true)
    expect(matchesAllTerms({ title: "Lap trinh vien Java" }, "lập trình viên")).toBe(true)
    expect(matchesAllTerms({ title: "Lập trình viên Golang" }, "lập trình viên golang")).toBe(true)
    // A phrase does not run across a paragraph break or stop mid-word.
    expect(matchesAllTerms({ title: "Kỹ sư lập trình", mission: "<p>viên chức</p>" }, "lập trình viên")).toBe(false)
    expect(matchesAllTerms({ title: "Kỹ thuật viên" }, "kỹ thuật vi")).toBe(false)
  })

  test("buildDescription follows the site's section order and skips empty sections", () => {
    const text = buildDescription({
      mission: "<p>Own the payments API</p>",
      tasks: "<ul><li><p>Build services</p></li></ul>",
      kpis: null,
      knowledge: "<p>Go</p>",
      attitude: "<p>Ownership</p>",
      benefitsIncome: "20-25tr",
      benefitsPerks: "<ul><li><p>13th-month salary</p></li></ul>",
    }) as string
    expect(text.indexOf("MISSION")).toBeLessThan(text.indexOf("TASKS"))
    expect(text.indexOf("TASKS")).toBeLessThan(text.indexOf("REQUIREMENTS"))
    expect(text.indexOf("REQUIREMENTS")).toBeLessThan(text.indexOf("BENEFITS"))
    expect(text).not.toContain("KEY RESULTS")
    expect(text).toContain("Knowledge:\nGo")
    expect(text).not.toContain("Skills:")
    expect(text).toContain("Income: 20-25tr\n• 13th-month salary")
    expect(buildDescription({})).toBeNull()
  })

  test("workingHoursOf joins ranges and folds the note onto one line", () => {
    expect(
      workingHoursOf({
        workingTimeRanges: [{ dayFrom: "MON", dayTo: "SAT", timeStart: "08:00", timeEnd: "17:30" }],
        workingTimeNote: "Làm Thứ 7 cách tuần",
      }),
    ).toBe("Mon-Sat 08:00-17:30; Làm Thứ 7 cách tuần")
    expect(workingHoursOf({ workingTimeNote: "7,5 giờ/ngày\n08:30 – 17:30" })).toBe("7,5 giờ/ngày; 08:30 – 17:30")
    expect(workingHoursOf({})).toBeNull()
  })
})

// --- Live smoke tests (hit the public JoyWork API) -------------------------
describe("search (live)", () => {
  test("returns at least one open result with non-null id/title/url", async () => {
    const res = await runCLI(["search", "-q", "developer", "-l", "ha-noi", "--limit", "3", "--format", "json"])
    expect(res.exitCode).toBe(0)
    const out = parseJSON<SearchOut>(res)
    expect(out.results.length).toBeGreaterThan(0)
    for (const r of out.results) {
      expect(r.id).toBeTruthy()
      expect(r.title).toBeTruthy()
      expect(r.url).toStartWith("https://joywork.vn/jobs/")
      expect(r.expired).toBe(false)
    }
  })

  test("table format runs and prints a header", async () => {
    const res = await runCLI(["search", "-l", "ha noi", "--limit", "3", "--format", "table"])
    expect(res.exitCode).toBe(0)
    expect(res.stdout).toContain("TITLE")
  })

  test("detail returns a readable description for a search result", async () => {
    const search = parseJSON<SearchOut>(await runCLI(["search", "-l", "ha-noi", "--limit", "1"]))
    const id = search.results[0].id
    const res = await runCLI(["detail", id, "--format", "json"])
    const job = parseJSON<{ id: string; description: string | null }>(res)
    expect(job.id).toBe(id)
    expect(job.description).toBeTruthy()
    expect(job.description).not.toContain("<")
    expect(job.description).not.toContain("&nbsp;")
  })
})

// --- Error handling --------------------------------------------------------
describe("errors", () => {
  const expectJsonError = (res: { exitCode: number; stdout: string; stderr: string }, code: string) => {
    expect(res.exitCode).toBe(1)
    expect(res.stdout).toBe("")
    const err = JSON.parse(res.stderr) as { error: string; code: string }
    expect(err.code).toBe(code)
    expect(err.error).toBeTruthy()
  }

  test("an unknown flag is rejected, not ignored", async () => {
    expectJsonError(await runCLI(["search", "--bogus", "1"]), "UNKNOWN_FLAG")
  })

  test("a non-integer --jobage is rejected", async () => {
    expectJsonError(await runCLI(["search", "--jobage", "0.5"]), "BAD_ARG")
  })

  test("an unknown location is rejected before any request", async () => {
    expectJsonError(await runCLI(["search", "-l", "Narnia"]), "BAD_LOCATION")
  })

  test("detail with no id exits 1", async () => {
    expectJsonError(await runCLI(["detail"]), "NO_ID")
  })

  test("detail with an unparseable id exits 1", async () => {
    expectJsonError(await runCLI(["detail", "not-a-job"]), "BAD_ID")
  })

  test("detail for a well-formed id that does not exist reports NOT_FOUND", async () => {
    expectJsonError(await runCLI(["detail", "cmvaaz25x08uhp066wlvmmz9z"]), "NOT_FOUND")
  })

  test("unknown command exits 1", async () => {
    expectJsonError(await runCLI(["frobnicate"]), "BAD_CMD")
  })
})
