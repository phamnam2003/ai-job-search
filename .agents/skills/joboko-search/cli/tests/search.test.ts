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
    deadline: string | null
    url: string
  }>
}

describe("joboko search (live)", () => {
  test("returns real results with populated core fields", async () => {
    const res = await runCLI(["search", "-q", "backend developer", "-l", "ha noi", "--limit", "5"])
    expect(res.exitCode).toBe(0)

    const data = parseJSON<SearchResponse>(res)
    expect(data.meta.page).toBe(1)
    expect(data.results.length).toBeGreaterThan(0)

    for (const job of data.results) {
      expect(job.id).toMatch(/^\d+$/)
      expect(job.title).toBeTruthy()
      expect(job.url).toContain("joboko.com")

      expect(job.title).not.toContain("<")
      expect(job.title).not.toContain("&amp;")
      if (job.company) expect(job.company).not.toContain("<")
    }
  })

  test("cards carry ISO deadlines", async () => {
    const res = await runCLI(["search", "-q", "backend developer", "--limit", "10"])
    const data = parseJSON<SearchResponse>(res)

    expect(data.results.some((j) => j.deadline !== null)).toBe(true)
    for (const job of data.results) {
      if (job.deadline) expect(job.deadline).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
  })

  test("--open-only drops postings past their deadline", async () => {
    const res = await runCLI([
      "search",
      "-q",
      "backend developer",
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

  test("--page returns different jobs (?p= not ?page=)", async () => {
    const p1 = parseJSON<SearchResponse>(
      await runCLI(["search", "-q", "backend developer", "--limit", "1"]),
    )
    const p2 = parseJSON<SearchResponse>(
      await runCLI(["search", "-q", "backend developer", "--page", "2", "--limit", "1"]),
    )
    expect(p1.results[0]?.id).toBeTruthy()
    expect(p2.results[0]?.id).toBeTruthy()
    expect(p1.results[0]!.id).not.toBe(p2.results[0]!.id)
  })

  test("an unsupported keyword slug exits 1 with NO_SLUG", async () => {
    const res = await runCLI(["search", "-q", "golang"])
    expect(res.exitCode).toBe(1)
    const err = JSON.parse(res.stderr.trim().split("\n").pop() as string)
    expect(err.code).toBe("NO_SLUG")
  })

  test("slugs command lists known keyword slugs", async () => {
    const res = await runCLI(["slugs"])
    expect(res.exitCode).toBe(0)
    expect(res.stdout).toContain("backend-developer")
  })
})

describe("joboko detail (live)", () => {
  test("returns readable description and an expired flag", async () => {
    const search = await runCLI(["search", "-q", "backend developer", "--limit", "1"])
    const url = parseJSON<SearchResponse>(search).results[0]?.url
    expect(url).toBeTruthy()

    const res = await runCLI(["detail", url!])
    expect(res.exitCode).toBe(0)

    const job = parseJSON<{
      id: string
      title: string
      description: string | null
      expired: boolean
      deadline: string | null
    }>(res)

    expect(job.title).toBeTruthy()
    expect(job.title).not.toBe("(untitled)")
    expect(job.description).toBeTruthy()
    expect(job.description).not.toContain("<p>")
    expect(job.description).not.toContain("&nbsp;")
    // The expired flag must always be present — this aggregator keeps dead
    // postings live, so callers depend on it.
    expect(typeof job.expired).toBe("boolean")
  })

  test("a bare numeric ID is rejected with a useful message", async () => {
    const res = await runCLI(["detail", "6610939"])
    expect(res.exitCode).toBe(1)
    const err = JSON.parse(res.stderr.trim().split("\n").pop() as string)
    expect(err.code).toBe("BAD_ID")
    expect(err.error).toContain("full posting URL")
  })
})
