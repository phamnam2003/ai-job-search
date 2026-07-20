import {
  API_BASE,
  jsonFetch,
  loadCompanies,
  parseId,
  normalizeJob,
  jobDescription,
  writeError,
  type AshbyJob,
  type Company,
  type JobDetail,
} from "../helpers.js"

export interface DetailOpts {
  id: string
  company?: string // supplies the board name when the id alone cannot
  format: "json" | "plain"
}

interface BoardResponse {
  jobs?: AshbyJob[]
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const parsed = parseId(opts.id)
  if (!parsed) {
    writeError(
      `Could not parse a job id from "${opts.id}" — expected "<board>/<uuid>" (e.g. skymavis/a4dc737a-1893-4981-844c-2153ad06be75) or a jobs.ashbyhq.com URL`,
      "BAD_ID",
    )
    return 1
  }

  const token = parsed.token || opts.company
  if (!token) {
    writeError(`That id is a bare job UUID — pass the board with --company (e.g. --company skymavis)`, "NO_COMPANY")
    return 1
  }

  try {
    // Ashby's posting API has no by-id endpoint: the board is the only entry
    // point, so fetch it and pick the job out. Descriptions ride along in the
    // list response, so this is still a single request.
    const body = await jsonFetch<BoardResponse>(
      `${API_BASE}/${encodeURIComponent(token)}?includeCompensation=true`,
    )
    if (!body || !Array.isArray(body.jobs)) {
      writeError(`Board "${token}" not found`, "NOT_FOUND")
      return 1
    }

    const job = body.jobs.find((j) => j && j.id === parsed.jobId)
    if (!job) {
      writeError(`Job ${parsed.jobId} not found on board "${token}" (it may have been closed)`, "NOT_FOUND")
      return 1
    }

    // Prefer the curated display name when the board is in companies.json.
    let company: Company = { token, name: token }
    try {
      const known = loadCompanies().find((c) => c.token === token)
      if (known) company = known
    } catch {
      // companies.json is optional for detail lookups — fall back to the board name.
    }

    const card = normalizeJob(job, company)
    const detail: JobDetail = {
      ...card,
      description: jobDescription(job),
      applyUrl: job.applyUrl ?? null,
    }

    if (opts.format === "plain") {
      const lines = [
        detail.title,
        `${detail.company || "—"} · ${detail.location || "—"}`,
        detail.secondaryLocations.length ? `Also open in: ${detail.secondaryLocations.join("; ")}` : "",
        detail.department ? `Department: ${detail.department}` : "",
        detail.team ? `Team: ${detail.team}` : "",
        detail.employmentType ? `Employment: ${detail.employmentType}` : "",
        detail.workplaceType ? `Workplace: ${detail.workplaceType}` : "",
        detail.isRemote === true ? "Remote: yes" : detail.isRemote === false ? "Remote: no" : "",
        detail.date ? `Posted: ${detail.date.slice(0, 10)}` : "",
        "",
        detail.description || "(no description)",
        "",
        `URL: ${detail.url}`,
        detail.applyUrl ? `Apply: ${detail.applyUrl}` : "",
      ].filter((l) => l !== "")
      process.stdout.write(lines.join("\n") + "\n")
    } else {
      process.stdout.write(JSON.stringify(detail, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "DETAIL_FAILED")
    return 1
  }
}
