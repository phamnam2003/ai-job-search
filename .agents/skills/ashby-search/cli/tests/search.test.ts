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
    isRemote: boolean | null;
    secondaryLocations: string[];
  }>;
}

// These hit the live Ashby API against one small board, keeping request volume
// to a handful per run.
const TEST_BOARD = "skymavis";
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
      expect(job.url).toContain("ashbyhq.com");
      expect(job.companyToken).toBe(TEST_BOARD);
      // Optional fields must be present as keys, null rather than omitted.
      expect(job).toHaveProperty("company");
      expect(job).toHaveProperty("location");
      expect(job).toHaveProperty("date");
      if (job.date !== null) expect(job.date).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });

  test("--limit caps the result count", async () => {
    const res = await runCLI(["search", "-c", TEST_BOARD, "--limit", "2"]);
    const body = parseJSON<SearchResponse>(res);
    expect(body.results.length).toBeLessThanOrEqual(2);
  });

  test("query terms are ANDed", async () => {
    const res = await runCLI(["search", "-q", "zzzznotarealterm engineer", "-c", TEST_BOARD]);
    const body = parseJSON<SearchResponse>(res);
    expect(body.results.length).toBe(0);
  });

  test("--location matches the primary location", async () => {
    const res = await runCLI(["search", "-c", TEST_BOARD, "-l", "vietnam", "--limit", "5"]);
    const body = parseJSON<SearchResponse>(res);
    expect(body.results.length).toBeGreaterThan(0);
  });

  test("--location also searches secondaryLocations", async () => {
    // A Sky Mavis posting lists Vietnam primary and many secondary countries;
    // a country that appears only in secondaryLocations must still match.
    const res = await runCLI(["search", "-c", TEST_BOARD, "-l", "cambodia"]);
    const body = parseJSON<SearchResponse>(res);
    expect(body.results.length).toBeGreaterThan(0);
    for (const job of body.results) {
      const inPrimary = (job.location ?? "").toLowerCase().includes("cambodia");
      const inSecondary = job.secondaryLocations.some((l) => l.toLowerCase().includes("cambodia"));
      expect(inPrimary || inSecondary).toBe(true);
    }
  });

  test("--remote keeps only postings the employer flagged remote", async () => {
    const res = await runCLI(["search", "-c", TEST_BOARD, "--remote"]);
    const body = parseJSON<SearchResponse>(res);
    for (const job of body.results) {
      expect(job.isRemote).toBe(true);
    }
  });

  test("an unknown board is reported but does not fail the run", async () => {
    const res = await runCLI(["search", "-c", "definitely-not-a-real-board-xyz"]);
    expect(res.exitCode).toBe(0);
    const body = parseJSON<SearchResponse>(res);
    expect(body.results.length).toBe(0);
    expect(body.meta.errors?.length).toBeGreaterThan(0);
  });
});

describe("detail (live)", () => {
  test("returns a readable description for a real posting", async () => {
    const search = await runCLI(["search", "-c", TEST_BOARD, "--limit", "1"]);
    const body = parseJSON<SearchResponse>(search);
    expect(body.results.length).toBeGreaterThan(0);

    const res = await runCLI(["detail", body.results[0].id]);
    expect(res.exitCode).toBe(0);

    const job = parseJSON<{ id: string; title: string; description: string | null }>(res);
    expect(job.id).toBe(body.results[0].id);
    expect(job.description).toBeTruthy();
    expect(job.description).not.toContain("<p>");
    expect(job.description).not.toContain("&amp;");
  });

  test("a job id that is not on the board exits 1", async () => {
    const res = await runCLI(["detail", `${TEST_BOARD}/00000000-0000-0000-0000-000000000000`]);
    expect(res.exitCode).toBe(1);
    const err = JSON.parse(res.stderr) as { code: string };
    expect(err.code).toBe("NOT_FOUND");
  });
});

describe("companies", () => {
  test("lists the configured fan-out boards", async () => {
    const res = await runCLI(["companies"]);
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toContain("BOARD");
    expect(res.stdout).toContain(TEST_BOARD);
  });
});
