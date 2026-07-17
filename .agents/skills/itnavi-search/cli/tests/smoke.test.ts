import { describe, test, expect } from "bun:test";
import { runCLI, parseJSON } from "./helpers";

interface SearchResult {
  meta: { count: number; page: number };
  results: Array<{
    id: string | null;
    title: string | null;
    company: string | null;
    url: string | null;
  }>;
}

interface Detail {
  id: string;
  title: string;
  description: string | null;
  url: string | null;
}

function parsedStderr(stderr: string): { error?: string; code?: string } {
  try {
    return JSON.parse(stderr);
  } catch {
    return {};
  }
}

// These hit ITNavi live. They assert shape/exit codes and stay green as long as
// the board returns Golang/Backend jobs (it consistently does — a handful per query).
describe("itnavi CLI smoke (live)", () => {
  test("search returns a usable, enriched result and detail resolves it", async () => {
    const result = await runCLI(["search", "-q", "golang", "--limit", "3"]);
    expect(result.exitCode).toBe(0);
    const data = parseJSON<SearchResult>(result);
    expect(Array.isArray(data.results)).toBe(true);
    expect(data.results.length).toBeGreaterThan(0);

    const first = data.results[0];
    expect(first.id).toBeTruthy();
    expect(first.title).toBeTruthy();
    expect(first.company).toBeTruthy();
    // Enrichment fills the authoritative detail URL.
    expect(first.url).toBeTruthy();
    expect(first.url).toContain("itnavi.com.vn/job-detail/");

    // detail by numeric id (JSON endpoint path).
    const byId = await runCLI(["detail", String(first.id)]);
    expect(byId.exitCode).toBe(0);
    const jobById = parseJSON<Detail>(byId);
    expect(jobById.description).toBeTruthy();

    // detail by full URL (HTML-scrape path).
    const byUrl = await runCLI(["detail", String(first.url)]);
    expect(byUrl.exitCode).toBe(0);
    const jobByUrl = parseJSON<Detail>(byUrl);
    expect(jobByUrl.description).toBeTruthy();
  }, 30000);

  test("search --format table prints rows with no error", async () => {
    const result = await runCLI(["search", "-q", "backend", "--limit", "3", "--format", "table"]);
    expect(result.exitCode).toBe(0);
    expect(result.stdout.split("\n").length).toBeGreaterThan(2); // header + divider + >=1 row
  }, 30000);
});

describe("itnavi CLI error handling", () => {
  test("no command prints help and exits 1", async () => {
    const result = await runCLI([]);
    expect(result.exitCode).toBe(1);
  });

  test("unknown command exits 1 with BAD_CMD on stderr, nothing on stdout", async () => {
    const result = await runCLI(["frobnicate"]);
    expect(result.exitCode).toBe(1);
    expect(parsedStderr(result.stderr).code).toBe("BAD_CMD");
    expect(result.stdout).toBe("");
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

  test("detail with an unresolvable slug exits 1 with NOT_FOUND", async () => {
    const result = await runCLI(["detail", "this-job-does-not-exist-zzz-000"]);
    expect(result.exitCode).toBe(1);
    expect(parsedStderr(result.stderr).code).toBe("NOT_FOUND");
  }, 30000);
});
