import {
  SEARCH_URL,
  jsonPost,
  mapJobDetail,
  extractId,
  writeError,
  type JobDetail,
  type RawJob,
} from "../helpers.js"

export interface DetailOpts {
  id: string
  format: "json" | "plain"
}

interface DetailResponse {
  meta?: { nbHits?: number }
  data?: RawJob[]
  errors?: { detail?: string }
}

// The detail body is served by the SAME search endpoint: filtering by jobId
// returns a single record that additionally carries jobDescription /
// jobRequirement / skills / benefits (which the list view omits).
function buildDetailBody(id: string): Record<string, unknown> {
  return {
    userId: 0,
    query: "",
    filter: [{ field: "jobId", value: id }],
    ranges: [],
    order: [],
    hitsPerPage: 1,
    page: 0,
  }
}

function renderPlain(job: JobDetail): string {
  const lines = [
    job.title || "(untitled)",
    `${job.company || "—"} · ${job.location || "—"}`,
    job.salary ? `Salary: ${job.salary}` : "",
    job.skills ? `Skills: ${job.skills}` : "",
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
    const body = await jsonPost<DetailResponse>(SEARCH_URL, buildDetailBody(id))
    if (body?.errors) {
      writeError(body.errors.detail || "API returned an error", "DETAIL_FAILED")
      return 1
    }
    const rec = body && Array.isArray(body.data) ? body.data[0] : null
    if (!rec) {
      writeError("Job not found", "NOT_FOUND")
      return 1
    }
    const job = mapJobDetail(rec, id)

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
