import { SEARCH_BASE, extractSlug, htmlFetch, parseJobDetail, writeError } from "../helpers.js"

export interface DetailOpts {
  id: string // a job slug or full /it-jobs/<slug> URL
  format: "json" | "plain"
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const slug = extractSlug(opts.id)
  if (!slug) {
    if (/^\d+$/.test(opts.id.trim())) {
      writeError(
        `ITviec detail needs the full job slug or URL (e.g. "backend-developer-golang-dnse-4853"), ` +
          `not a bare id like "${opts.id}". Copy the "url" field from a search result.`,
        "NEED_SLUG",
      )
    } else {
      writeError(`Could not parse a job slug from "${opts.id}"`, "BAD_ID")
    }
    return 1
  }
  try {
    // The lightweight `/content` partial returns clean job-description HTML.
    const html = await htmlFetch(`${SEARCH_BASE}/${slug}/content`)
    const job = html ? parseJobDetail(html, slug) : null
    if (!job) {
      writeError(`Job not found for slug "${slug}"`, "NOT_FOUND")
      return 1
    }

    if (opts.format === "plain") {
      const lines = [
        job.title,
        `${job.company || "—"} · ${job.location || "—"}` +
          `${job.workingModel ? " · " + job.workingModel : ""}` +
          `${job.date ? " · " + job.date : ""}`,
        job.salary ? `Salary: ${job.salary}` : "Salary: (sign-in required)",
        job.skills.length ? `Skills: ${job.skills.join(", ")}` : "",
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
