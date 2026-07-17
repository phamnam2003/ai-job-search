import {
  DETAIL_URL,
  DETAIL_FIELDS_JOB,
  jsonFetch,
  mapJobDetail,
  extractId,
  writeError,
  type JobDetail,
} from "../helpers.js"

export interface DetailOpts {
  id: string
  format: "json" | "plain"
}

interface DetailResponse {
  data?: Record<string, unknown>
}

function buildDetailUrl(id: string): string {
  return `${DETAIL_URL}/${id}?fields[job]=${DETAIL_FIELDS_JOB}&include=company`
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
    const body = await jsonFetch<DetailResponse>(buildDetailUrl(id))
    if (!body || !body.data) {
      writeError("Job not found", "NOT_FOUND")
      return 1
    }
    const job = mapJobDetail(body.data, id)

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
