import { describe, expect, test } from "bun:test"
import { runCLI, parseJSON } from "./helpers.js"

interface SearchResponse {
  meta: { count: number; page: number }
  results: Array<{
    id: string
    title: string
    company: string | null
    location: string | null
    salary: string | null
    skills: string[]
    url: string
  }>
}

describe("devwork search (live)", () => {
  test("returns real results with populated core fields", async () => {
    const res = await runCLI(["search", "-q", "golang", "--limit", "5"])
    expect(res.exitCode).toBe(0)

    const data = parseJSON<SearchResponse>(res)
    expect(data.meta.page).toBe(1)
    expect(data.results.length).toBeGreaterThan(0)

    for (const job of data.results) {
      expect(job.id).toMatch(/^\d+$/)
      expect(job.title).toBeTruthy()
      expect(job.url).toContain("devwork.vn/viec-lam/")

      // Half-working-parser guards.
      expect(job.title).not.toContain("<")
      expect(job.title).not.toContain("&amp;")
      if (job.company) expect(job.company).not.toContain("<")
    }
  })

  test("cards carry salary bands and skills", async () => {
    const res = await runCLI(["search", "-q", "golang", "--limit", "10"])
    const data = parseJSON<SearchResponse>(res)

    // Published salary bands are the reason this portal is worth running.
    expect(data.results.some((j) => j.salary !== null)).toBe(true)
    expect(data.results.some((j) => j.skills.length > 0)).toBe(true)
  })

  test("--location filters diacritic-insensitively", async () => {
    const res = await runCLI(["search", "-q", "java", "-l", "ha noi", "--limit", "10"])
    const data = parseJSON<SearchResponse>(res)
    expect(data.results.length).toBeGreaterThan(0)
    for (const job of data.results) {
      expect(job.location?.toLowerCase()).toContain("nội")
    }
  })

  test("--limit caps the result count", async () => {
    const res = await runCLI(["search", "-q", "java", "--limit", "2"])
    const data = parseJSON<SearchResponse>(res)
    expect(data.results.length).toBeLessThanOrEqual(2)
  })

  test("tags command lists known technology slugs", async () => {
    const res = await runCLI(["tags"])
    expect(res.exitCode).toBe(0)
    expect(res.stdout).toContain("golang")
    expect(res.stdout).toContain("nodejs")
  })
})

describe("devwork detail (live)", () => {
  test("returns readable description and sidebar fields", async () => {
    const search = await runCLI(["search", "-q", "golang", "--limit", "1"])
    const id = parseJSON<SearchResponse>(search).results[0]?.id
    expect(id).toBeTruthy()

    const res = await runCLI(["detail", id!])
    expect(res.exitCode).toBe(0)

    const job = parseJSON<{
      id: string
      title: string
      description: string | null
      salary: string | null
      skills: string[]
    }>(res)

    expect(job.id).toBe(id!)
    expect(job.title).toBeTruthy()
    expect(job.title).not.toBe("(untitled)")
    expect(job.description).toBeTruthy()
    expect(job.description).not.toContain("<p>")

    // Salary must be the real band, never the login-gated referral-bonus field.
    if (job.salary) expect(job.salary).not.toContain("Đăng nhập")

    // Skills must be scoped to the job, not the site-wide search suggestions.
    expect(job.skills.length).toBeLessThan(8)
  })
})
