import { describe, expect, test } from "bun:test"
import { join } from "path"
import { runCLI, parseJSON } from "./helpers.js"

const FIXTURES = join(import.meta.dir, "fixtures")

interface Job {
  id: string
  title: string
  company: string | null
  location: string | null
  salary: string | null
  url: string | null
  tags: string[]
}
interface SearchOut {
  meta: { count: number }
  results: Job[]
}
interface LinksOut {
  meta: { count: number }
  results: Array<{ type: string; url: string }>
}

describe("facebook-search CLI (zero-network)", () => {
  test("links generates Facebook search URLs, no network", async () => {
    const out = parseJSON<LinksOut>(await runCLI(["links", "-q", "golang backend", "-l", "Hà Nội"]))
    expect(out.results.length).toBeGreaterThanOrEqual(3)
    for (const l of out.results) expect(l.url.startsWith("https://www.facebook.com/")).toBe(true)
    expect(out.results.some((l) => l.type === "posts")).toBe(true)
  })

  test("search parses a pasted post from the inbox fixture", async () => {
    const out = parseJSON<SearchOut>(await runCLI(["search", "--inbox", FIXTURES]))
    expect(out.results.length).toBeGreaterThanOrEqual(1)
    const job = out.results[0]
    expect(job.id).toBeTruthy()
    expect(job.title).toContain("Backend Developer")
    expect(job.company).toBe("ABC TECH")
    expect(job.location).toContain("Hà Nội")
    expect(job.url).toContain("facebook.com")
    expect(job.tags).toContain("Golang")
    expect(job.tags).toContain("Kafka")
  })

  test("search --query filters the inbox", async () => {
    const hit = parseJSON<SearchOut>(await runCLI(["search", "--inbox", FIXTURES, "-q", "golang"]))
    expect(hit.results.length).toBe(1)
    const miss = parseJSON<SearchOut>(await runCLI(["search", "--inbox", FIXTURES, "-q", "cobol"]))
    expect(miss.results.length).toBe(0)
  })

  test("detail resolves a parsed post by id", async () => {
    const list = parseJSON<SearchOut>(await runCLI(["search", "--inbox", FIXTURES]))
    const id = list.results[0].id
    const out = await runCLI(["detail", id, "--inbox", FIXTURES, "--format", "plain"])
    expect(out.exitCode).toBe(0)
    expect(out.stdout).toContain("Backend Developer")
  })

  test("links without --query exits 1 with a JSON error on stderr", async () => {
    const out = await runCLI(["links"])
    expect(out.exitCode).toBe(1)
    expect(out.stdout).toBe("")
    expect(JSON.parse(out.stderr).code).toBe("NO_QUERY")
  })

  test("unknown command exits 1 with a JSON error on stderr", async () => {
    const out = await runCLI(["frobnicate"])
    expect(out.exitCode).toBe(1)
    expect(JSON.parse(out.stderr).code).toBe("BAD_CMD")
  })
})
