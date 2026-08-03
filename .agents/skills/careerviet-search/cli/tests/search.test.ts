import { describe, expect, test } from "bun:test"
import { runCLI, parseJSON } from "./helpers.js"

interface SearchResponse {
  meta: { count: number; page: number }
  results: Array<{
    id: string
    title: string
    company: string | null
    location: string | null
    date: string | null
    deadline: string | null
    salary: string | null
    url: string
  }>
}

describe("careerviet search (live)", () => {
  test("returns real results with populated core fields", async () => {
    const res = await runCLI(["search", "-q", "backend", "-l", "ha noi", "--limit", "5"])
    expect(res.exitCode).toBe(0)

    const data = parseJSON<SearchResponse>(res)
    expect(data.meta.page).toBe(1)
    expect(data.results.length).toBeGreaterThan(0)

    for (const job of data.results) {
      // id/title/url are the contract's non-null fields.
      expect(job.id).toBeTruthy()
      expect(job.title).toBeTruthy()
      expect(job.url).toContain("careerviet.vn")

      // Guard against the half-working-parser failure mode: HTML fragments or
      // undecoded entities leaking into text fields.
      expect(job.title).not.toContain("<")
      expect(job.title).not.toContain("&amp;")
      if (job.company) expect(job.company).not.toContain("<")
    }
  })

  test("dates and deadlines parse to ISO when present", async () => {
    const res = await runCLI(["search", "-q", "backend", "-l", "ha noi", "--limit", "10"])
    const data = parseJSON<SearchResponse>(res)

    const withDeadline = data.results.filter((j) => j.deadline !== null)
    expect(withDeadline.length).toBeGreaterThan(0)
    for (const job of data.results) {
      if (job.deadline) expect(job.deadline).toMatch(/^\d{4}-\d{2}-\d{2}$/)
      if (job.date) expect(job.date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  test("--open-only drops postings past their deadline", async () => {
    const res = await runCLI([
      "search",
      "-q",
      "backend",
      "-l",
      "ha noi",
      "--open-only",
      "--limit",
      "20",
    ])
    const data = parseJSON<SearchResponse>(res)
    const today = new Date().toISOString().slice(0, 10)
    for (const job of data.results) {
      if (job.deadline) expect(job.deadline >= today).toBe(true)
    }
  })

  test("--limit caps the result count", async () => {
    const res = await runCLI(["search", "-q", "backend", "--limit", "3"])
    const data = parseJSON<SearchResponse>(res)
    expect(data.results.length).toBeLessThanOrEqual(3)
  })
})

describe("careerviet detail (live)", () => {
  test("returns a readable description for a job from search", async () => {
    const search = await runCLI(["search", "-q", "backend", "-l", "ha noi", "--limit", "1"])
    const data = parseJSON<SearchResponse>(search)
    const id = data.results[0]?.id
    expect(id).toBeTruthy()

    const res = await runCLI(["detail", id!])
    expect(res.exitCode).toBe(0)

    const job = parseJSON<{
      id: string
      title: string
      company: string | null
      description: string | null
      deadline: string | null
    }>(res)

    expect(job.id).toBe(id!)
    expect(job.title).toBeTruthy()
    expect(job.description).toBeTruthy()
    // Description must be decoded text, not raw markup.
    expect(job.description).not.toContain("<p>")
    expect(job.description).not.toContain("&nbsp;")
  })
})
