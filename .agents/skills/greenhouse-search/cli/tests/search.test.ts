import { describe, expect, test } from "bun:test";
import { runCLI, parseJSON } from "./helpers";

interface SearchResponse {
  meta: { count: number; page: number; totalMatched: number; boardsQueried: number };
  results: Array<{
    id: string;
    title: string;
    company: string | null;
    companyToken: string;
    location: string | null;
    date: string | null;
    url: string;
  }>;
}

// These hit the live Greenhouse API against a single small board, keeping
// request volume to a handful per run.
const TEST_BOARD = "tailscale";

describe("search (live)", () => {
  test("returns real, well-formed results", async () => {
    const res = await runCLI(["search", "-q", "engineer", "-c", TEST_BOARD, "--limit", "5"]);
    expect(res.exitCode).toBe(0);

    const body = parseJSON<SearchResponse>(res);
    expect(Array.isArray(body.results)).toBe(true);
    expect(body.results.length).toBeGreaterThan(0);
    expect(body.meta.boardsQueried).toBe(1);

    for (const job of body.results) {
      // The contract's required fields must be present and non-null.
      expect(job.id).toMatch(new RegExp(`^${TEST_BOARD}/\\d+$`));
      expect(job.title.length).toBeGreaterThan(0);
      expect(job.url).toContain("greenhouse.io");
      expect(job.companyToken).toBe(TEST_BOARD);
      // Optional fields must be present as keys, null rather than omitted.
      expect(job).toHaveProperty("company");
      expect(job).toHaveProperty("location");
      expect(job).toHaveProperty("date");
    }
  });

  test("--limit caps the result count", async () => {
    const res = await runCLI(["search", "-c", TEST_BOARD, "--limit", "2"]);
    const body = parseJSON<SearchResponse>(res);
    expect(body.results.length).toBeLessThanOrEqual(2);
  });

  test("query terms are ANDed", async () => {
    const res = await runCLI([
      "search",
      "-q",
      "zzzznotarealterm engineer",
      "-c",
      TEST_BOARD,
    ]);
    const body = parseJSON<SearchResponse>(res);
    expect(body.results.length).toBe(0);
  });

  test("an unknown board is reported but does not fail the run", async () => {
    const res = await runCLI(["search", "-c", "definitely-not-a-real-board-xyz"]);
    expect(res.exitCode).toBe(0);
    const body = parseJSON<SearchResponse & { meta: { errors?: unknown[] } }>(res);
    expect(body.results.length).toBe(0);
    expect(body.meta.errors?.length).toBeGreaterThan(0);
  });
});

describe("detail (live)", () => {
  test("returns a readable description for a real posting", async () => {
    const search = await runCLI(["search", "-q", "engineer", "-c", TEST_BOARD, "--limit", "1"]);
    const body = parseJSON<SearchResponse>(search);
    expect(body.results.length).toBeGreaterThan(0);

    const res = await runCLI(["detail", body.results[0].id]);
    expect(res.exitCode).toBe(0);

    const job = parseJSON<{ id: string; title: string; description: string | null }>(res);
    expect(job.id).toBe(body.results[0].id);
    expect(job.title.length).toBeGreaterThan(0);
    expect(job.description).toBeTruthy();
    // Tags stripped and entities decoded.
    expect(job.description).not.toContain("<p>");
    expect(job.description).not.toContain("&amp;");
  });
});

describe("companies", () => {
  test("lists the configured fan-out boards", async () => {
    const res = await runCLI(["companies"]);
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toContain("TOKEN");
    expect(res.stdout).toContain(TEST_BOARD);
  });
});
