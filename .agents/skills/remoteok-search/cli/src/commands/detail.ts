import {
  API_URL,
  jsonFetch,
  isJobEntry,
  mapJobDetail,
  extractId,
  writeError,
  type JobDetail,
} from "../helpers.js"

export interface DetailOpts {
  id: string
  format: "json" | "plain"
}

function renderPlain(job: JobDetail): string {
  const lines = [
    job.title || "(untitled)",
    `${job.company || "—"} · ${job.location || "—"}`,
    job.salary ? `Salary: ${job.salary}` : "",
    job.tags && job.tags.length ? `Tags: ${job.tags.join(", ")}` : "",
    job.date ? `Posted: ${job.date}` : "",
    "",
    job.description || "(no description)",
    "",
    `URL: ${job.url || "—"}`,
  ].filter((l) => l !== "")
  return lines.join("\n")
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const id = extractId(opts.id)
  if (!id) {
    writeError(`Could not parse a job id from "${opts.id}"`, "BAD_ID")
    return 1
  }
  try {
    // RemoteOK has no per-id JSON endpoint, so we fetch the feed and find the
    // matching record. Only jobs still in the latest ~100 are retrievable.
    const body = await jsonFetch<unknown[]>(API_URL)
    const jobs = (Array.isArray(body) ? body : []).filter(isJobEntry)
    const found = jobs.find((r) => String(r.id) === id)
    if (!found) {
      writeError(
        `Job ${id} not found in the current RemoteOK feed (it may have aged out of the latest ~100 postings)`,
        "NOT_FOUND",
      )
      return 1
    }
    const job = mapJobDetail(found)

    if (opts.format === "plain") {
      process.stdout.write(renderPlain(job) + "\n")
    } else {
      process.stdout.write(JSON.stringify(job, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "DETAIL_FAILED")
    return 1
  }
}
