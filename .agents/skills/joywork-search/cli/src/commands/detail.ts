import {
  API_URL,
  jsonFetch,
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
  data?: { job?: RawJob }
}

function renderPlain(job: JobDetail): string {
  const facts = [job.level, job.experience, job.employmentType].filter(Boolean).join(" · ")
  const header = [
    `${job.title || "(untitled)"}${job.expired ? "  [EXPIRED]" : ""}`,
    `${job.company || "—"} · ${job.location || "—"}`,
    job.salary ? `Salary: ${job.salary}` : "",
    facts ? `Level: ${facts}` : "",
    job.department ? `Department: ${job.department}` : "",
    job.address ? `Address: ${job.address}` : "",
    job.workingHours ? `Working hours: ${job.workingHours}` : "",
    `Posted: ${job.date?.slice(0, 10) || "—"} · Deadline: ${job.deadline?.slice(0, 10) || "—"}`,
  ].filter(Boolean)
  return [...header, "", job.description || "(no description)", "", `URL: ${job.url || "—"}`].join("\n")
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const id = extractId(opts.id)
  if (!id) {
    writeError(
      `Could not parse a job id from "${opts.id}" - pass the id from search results or a joywork.vn/jobs/<slug>--<id> URL`,
      "BAD_ID",
    )
    return 1
  }
  try {
    const body = await jsonFetch<DetailResponse>(`${API_URL}/${id}`)
    const raw = body?.data?.job
    if (!raw) {
      writeError(`Job ${id} not found`, "NOT_FOUND")
      return 1
    }
    const job = mapJobDetail(raw)

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
