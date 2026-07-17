import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "./helpers";

interface SearchResult {
  meta: { count: number; page: number };
  results: Array<{ id: string | null; title: string | null; url: string | null }>;
}

function parsedStderr(stderr: string): { error?: string; code?: string } {
  try {
    return JSON.parse(stderr);
  } catch {
    return {};
  }
}

// These hit ITviec live. They only assert shape/exit codes, so they stay green
// as long as the site returns Golang jobs in Ha Noi (it consistently does).
describe("itviec CLI smoke (live)", () => {
  test("search returns at least one usable result", async () => {
    const result = await runCLI(["search", "-q", "golang", "-l", "ha-noi", "--limit", "5"]);
    expect(result.exitCode).toBe(0);
    const data = parseJSON<SearchResult>(result);
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThan(0);
    const first = data.results[0];
    expect(first.id).toBeTruthy();
    expect(first.title).toBeTruthy();
    expect(first.url).toBeTruthy();
    expect(first.url).toContain("itviec.com/it-jobs/");
  }, 30000);

  test("search --format table prints rows with no error", async () => {
    const result = await runCLI(["search", "-q", "backend", "-l", "ha-noi", "--limit", "3", "--format", "table"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.split("\n").length).toBeGreaterThan(2); // header + divider + >=1 row
  }, 30000);
});

describe("itviec CLI error handling", () => {
  test("no command prints help and exits 1", async () => {
    const result = await runCLI([]);
    expect(result.exitCode).toBe(1);
  });

  test("unknown command exits 1 with BAD_CMD on stderr", async () => {
    const result = await runCLI(["frobnicate"]);
    expect(result.exitCode).toBe(1);
    expect(parsedStderr(result.stderr).code).toBe("BAD_CMD");
    expect(result.stdout).toBe(""); // errors never go to stdout
  });

  test("non-numeric --limit exits 1 with BAD_ARG on stderr", async () => {
    const result = await runCLI(["search", "-q", "golang", "--limit", "xyz"]);
    expect(result.exitCode).toBe(1);
    expect(parsedStderr(result.stderr).code).toBe("BAD_ARG");
  });

  test("detail without an argument exits 1 with NO_ID", async () => {
    const result = await runCLI(["detail"]);
    expect(result.exitCode).toBe(1);
    expect(parsedStderr(result.stderr).code).toBe("NO_ID");
  });

  test("detail with a bare numeric id exits 1 with NEED_SLUG", async () => {
    const result = await runCLI(["detail", "4853"]);
    expect(result.exitCode).toBe(1);
    expect(parsedStderr(result.stderr).code).toBe("NEED_SLUG");
  });
});
