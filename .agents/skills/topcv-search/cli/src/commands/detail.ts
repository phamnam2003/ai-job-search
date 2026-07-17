import { htmlFetch, parseJobDetail, resolveDetailTarget, writeError } from "../helpers.js"

export interface DetailOpts {
  id: string // a full TopCV job URL or a bare numeric job id
  format: "json" | "plain"
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const target = resolveDetailTarget(opts.id)
  if (!target) {
    writeError(
      `Could not parse a TopCV job URL or id from "${opts.id}". Pass the full job ` +
        `URL from a search result (its "url" field) or a numeric job id.`,
      "BAD_ID",
    )
    return 1
  }
  try {
    const html = await htmlFetch(target.url)
    const job = html ? parseJobDetail(html, target.url) : null
    if (!job) {
      // A bare id that doesn't resolve to a live posting: reconstruction failed.
      // A full URL that 404s / has no job sections: genuinely not found.
      if (/^\d+$/.test(opts.id.trim())) {
        writeError(
          `Could not resolve id "${opts.id}" to a live TopCV job. Pass the full job ` +
            `URL from a search result instead (detail prefers the full URL).`,
          "NEED_URL",
        )
      } else {
        writeError(`Job not found at "${target.url}"`, "NOT_FOUND")
      }
      return 1
    }

    if (opts.format === "plain") {
      const lines = [
        job.title,
        `${job.company || "—"} · ${job.location || "—"}` +
          `${job.salary ? " · " + job.salary : ""}` +
          `${job.deadline ? " · deadline " + job.deadline : ""}`,
        "",
        "## Mô tả công việc (Job description)",
        job.description || "(none)",
        "",
        "## Yêu cầu ứng viên (Requirements)",
        job.requirements || "(none)",
        "",
        "## Quyền lợi (Benefits)",
        job.benefits || "(none)",
        "",
        `URL: ${job.url}`,
      ]
      process.stdout.write(lines.join("\n") + "\n")
    } else {
      process.stdout.write(JSON.stringify(job, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "DETAIL_FAILED")
    return 1
  }
}
