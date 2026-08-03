import { describe, expect, test } from "bun:test"
import { runCLI } from "./helpers.js"

function parseStderrJSON(stderr: string): { error: string; code: string } {
  return JSON.parse(stderr.trim().split("\n").pop() as string)
}

describe("careerviet CLI flag validation", () => {
  test("non-numeric --limit exits 1 with a JSON error on stderr", async () => {
    const res = await runCLI(["search", "-q", "backend", "--limit", "abc"])
    expect(res.exitCode).toBe(1)
    expect(res.stdout).toBe("")
    const err = parseStderrJSON(res.stderr)
    expect(err.code).toBe("BAD_ARG")
    expect(err.error).toContain("--limit")
  })

  test("non-numeric --page exits 1", async () => {
    const res = await runCLI(["search", "--page", "xyz"])
    expect(res.exitCode).toBe(1)
    expect(parseStderrJSON(res.stderr).code).toBe("BAD_ARG")
  })

  test("unsupported --sort value exits 1", async () => {
    const res = await runCLI(["search", "-q", "backend", "--sort", "salary"])
    expect(res.exitCode).toBe(1)
    expect(parseStderrJSON(res.stderr).code).toBe("BAD_ARG")
  })

  test("unknown command exits 1", async () => {
    const res = await runCLI(["frobnicate"])
    expect(res.exitCode).toBe(1)
    expect(parseStderrJSON(res.stderr).code).toBe("BAD_CMD")
  })

  test("detail without an id exits 1", async () => {
    const res = await runCLI(["detail"])
    expect(res.exitCode).toBe(1)
    expect(parseStderrJSON(res.stderr).code).toBe("NO_ID")
  })

  test("detail with an unparsable id exits 1", async () => {
    const res = await runCLI(["detail", "!!!"])
    expect(res.exitCode).toBe(1)
    expect(parseStderrJSON(res.stderr).code).toBe("BAD_ID")
  })

  test("no command prints help and exits 1", async () => {
    const res = await runCLI([])
    expect(res.exitCode).toBe(1)
    expect(res.stdout).toContain("careerviet-cli")
  })
})
