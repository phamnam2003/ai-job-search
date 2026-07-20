import { describe, expect, test } from "bun:test";
import { runCLI } from "./helpers";

function expectJSONError(stderr: string, code: string): void {
  const parsed = JSON.parse(stderr) as { error: string; code: string };
  expect(parsed.code).toBe(code);
  expect(typeof parsed.error).toBe("string");
  expect(parsed.error.length).toBeGreaterThan(0);
}

describe("flag validation", () => {
  test("an unknown flag exits 1 with a JSON error on stderr", async () => {
    const res = await runCLI(["search", "--bogus", "x"]);
    expect(res.exitCode).toBe(1);
    expect(res.stdout).toBe("");
    expectJSONError(res.stderr, "BAD_FLAG");
  });

  test("a non-numeric --limit exits 1", async () => {
    const res = await runCLI(["search", "--limit", "abc"]);
    expect(res.exitCode).toBe(1);
    expectJSONError(res.stderr, "BAD_ARG");
  });

  test("an invalid --match exits 1", async () => {
    const res = await runCLI(["search", "--match", "sideways"]);
    expect(res.exitCode).toBe(1);
    expectJSONError(res.stderr, "BAD_ARG");
  });

  test("detail without an id exits 1", async () => {
    const res = await runCLI(["detail"]);
    expect(res.exitCode).toBe(1);
    expectJSONError(res.stderr, "NO_ID");
  });

  test("detail with an unparseable id exits 1", async () => {
    const res = await runCLI(["detail", "not an id"]);
    expect(res.exitCode).toBe(1);
    expectJSONError(res.stderr, "BAD_ID");
  });

  test("a bare job UUID without --company exits 1", async () => {
    const res = await runCLI(["detail", "a4dc737a-1893-4981-844c-2153ad06be75"]);
    expect(res.exitCode).toBe(1);
    expectJSONError(res.stderr, "NO_COMPANY");
  });

  test("an unknown command exits 1", async () => {
    const res = await runCLI(["frobnicate"]);
    expect(res.exitCode).toBe(1);
    expectJSONError(res.stderr, "BAD_CMD");
  });

  test("an unknown --tag exits 1 rather than silently searching everything", async () => {
    const res = await runCLI(["search", "--tag", "no-such-tag-here"]);
    expect(res.exitCode).toBe(1);
    expectJSONError(res.stderr, "NO_COMPANIES");
  });

  test("--help prints usage and exits 0", async () => {
    const res = await runCLI(["search", "--help"]);
    expect(res.exitCode).toBe(0);
    expect(res.stdout).toContain("USAGE");
  });
});
