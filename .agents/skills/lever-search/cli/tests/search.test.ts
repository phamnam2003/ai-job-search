import { describe, expect, test } from "bun:test";
import { runCLI, parseJSON } from "./helpers";

interface SearchResponse {
  meta: { count: number; page: number; totalMatched: number; boardsQueried: number; errors?: unknown[] };
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

// These hit the live Lever API against one small board, keeping request volume
// to a handful per run.
const TEST_BOARD = "amanotes";
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";

describe("search (live)", () => {
  test("returns real, well-formed results", async () => {
    const res = await runCLI(["search", "-c", TEST_BOARD, "--limit", "5"]);
    expect(res.exitCode).toBe(0);

    const body = parseJSON<SearchResponse>(res);
    expect(body.results.length).toBeGreaterThan(0);
    expect(body.meta.boardsQueried).toBe(1);

    for (const job of body.results) {
      expect(job.id).toMatch(new RegExp(`^${TEST_BOARD}/${UUID}$`));
      expect(job.title.length).toBeGreaterThan(0);
      expect(job.url).toContain("lever.co");
      expect(job.companyToken).toBe(TEST_BOARD);
      // Optional fields must be present as keys, null rather than omitted.
      expect(job).toHaveProperty("company");
      expect(job).toHaveProperty("location");
      expect(job).toHaveProperty("date");
      // createdAt is epoch ms upstream; we must emit ISO 8601.
      if (job.date !== null) expect(job.date).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  test("--limit caps the result count", async () => {
    const res = await runCLI(["search", "-c", TEST_BOARD, "--limit", "2"]);
    const body = parseJSON<SearchResponse>(res);
    expect(body.results.length).toBeLessThanOrEqual(2);
  });

  test("query terms are ANDed", async () => {
    const res = await runCLI(["search", "-q", "zzzznotarealterm product", "-c", TEST_BOARD]);
    const body = parseJSON<SearchResponse>(res);
    expect(body.results.length).toBe(0);
  });

  test("--location filters client-side", async () => {
    const res = await runCLI(["search", "-c", TEST_BOARD, "-l", "vietnam", "--limit", "5"]);
    const body = parseJSON<SearchResponse>(res);
    expect(body.results.length).toBeGreaterThan(0);
    for (const job of body.results) {
      expect((job.location ?? "").toLowerCase()).toContain("vietnam");
    }
  });

  test("an unknown board is reported but does not fail the run", async () => {
    // Lever answers an unknown token with 200 + {ok:false}, not a 404 — the
    // non-array shape is what has to be detected.
    const res = await runCLI(["search", "-c", "definitely-not-a-real-board-xyz"]);
    expect(res.exitCode).toBe(0);
    const body = parseJSON<SearchResponse>(res);
    expect(body.results.length).toBe(0);
    expect(body.meta.errors?.length).toBeGreaterThan(0);
  });

  test("the leverdemo board is not in the fan-out list", async () => {
    const res = await runCLI(["companies"]);
    expect(res.stdout).not.toContain("leverdemo");
  });
});

describe("detail (live)", () => {
  test("composes a readable description from Lever's split fields", async () => {
    const search = await runCLI(["search", "-c", TEST_BOARD, "--limit", "1"]);
    const body = parseJSON<SearchResponse>(search);
    expect(body.results.length).toBeGreaterThan(0);

    const res = await runCLI(["detail", body.results[0].id]);
    expect(res.exitCode).toBe(0);

    const job = parseJSON<{ id: string; title: string; description: string | null }>(res);
    expect(job.id).toBe(body.results[0].id);
    expect(job.description).toBeTruthy();
    // Tags stripped and entities decoded.
    expect(job.description).not.toContain("<p>");
    expect(job.description).not.toContain("&amp;");
    expect(job.description).not.toContain("&nbsp;");
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
