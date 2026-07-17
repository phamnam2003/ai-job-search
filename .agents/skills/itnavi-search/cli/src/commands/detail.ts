import {
  DETAIL_BASE,
  extractSlug,
  fetchJobJson,
  htmlFetch,
  isNumericId,
  parseJobDetailHtml,
  parseJobDetailJson,
  writeError,
  type JobDetail,
} from "../helpers.js"

export interface DetailOpts {
  id: string // a numeric job id, a job slug, or a full /job-detail/<slug> URL
  format: "json" | "plain"
}

/**
 * Resolve a single job to its full detail. Two paths:
 *   - numeric id  → the get-job-by-id JSON endpoint (clean, complete).
 *   - slug / URL  → scrape the standalone /job-detail/<slug> page (the numeric id
 *                   needed by the JSON endpoint is not derivable from a slug).
 */
export async function runDetail(opts: DetailOpts): Promise<number> {
  const raw = opts.id.trim()
  try {
    let job: JobDetail | null = null

    if (isNumericId(raw)) {
      const data = await fetchJobJson(raw)
      job = data ? parseJobDetailJson(data) : null
    } else {
      const slug = extractSlug(raw)
      if (!slug) {
        writeError(`Could not parse a job id or slug from "${raw}"`, "BAD_ID")
        return 1
      }
      const html = await htmlFetch(`${DETAIL_BASE}/${slug}`)
      job = html ? parseJobDetailHtml(html, slug) : null
    }

    if (!job) {
      writeError(`Job not found for "${raw}"`, "NOT_FOUND")
      return 1
    }

    if (opts.format === "plain") {
      const lines = [
        job.title,
        `${job.company || "—"} · ${job.location || "—"}${job.date ? " · " + job.date : ""}`,
        job.salary ? `Salary: ${job.salary}` : "Salary: (login required)",
        job.skills.length ? `Skills: ${job.skills.join(", ")}` : "",
        "",
        job.description || "(no description)",
        "",
        `ID: ${job.id}`,
        job.url ? `URL: ${job.url}` : "",
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
