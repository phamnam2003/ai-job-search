import { htmlFetch, parseJobDetail, resolveDetailTarget, writeError } from "../helpers.js"

export interface DetailOpts {
  id: string // a bare numeric id, an "<id>/<slug>" fragment, or a full job URL
  format: "json" | "plain"
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const target = resolveDetailTarget(opts.id)
  if (!target) {
    writeError(
      `Could not parse a VietnamDevs job id from "${opts.id}". Pass a numeric id ` +
        `(e.g. 928767371223434), an "<id>/<slug>" fragment, or the full job URL.`,
      "BAD_ID",
    )
    return 1
  }
  try {
    const html = await htmlFetch(target.url)
    const job = html ? parseJobDetail(html, target.id) : null
    if (!job) {
      writeError(`Job not found for "${opts.id}"`, "NOT_FOUND")
      return 1
    }

    if (opts.format === "plain") {
      const lines = [
        job.title,
        `${job.company || "—"} · ${job.location || "—"}` +
          `${job.employmentType ? " · " + job.employmentType : ""}` +
          `${job.date ? " · posted " + job.date : ""}`,
        job.deadline ? `Apply by: ${job.deadline}` : "",
        job.tags.length ? `Tags: ${job.tags.join(", ")}` : "",
        "",
        job.description || "(no description)",
        "",
        `URL: ${job.url}`,
      ].filter((l) => l !== "")
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
