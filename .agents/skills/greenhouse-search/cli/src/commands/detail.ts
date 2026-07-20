import {
  API_BASE,
  jsonFetch,
  loadCompanies,
  parseId,
  decodeContent,
  decodeHtmlEntities,
  makeId,
  writeError,
  type GhJob,
  type JobDetail,
} from "../helpers.js"

export interface DetailOpts {
  id: string
  company?: string // supplies the board token when the id alone cannot
  format: "json" | "plain"
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const parsed = parseId(opts.id)
  if (!parsed) {
    writeError(
      `Could not parse a job id from "${opts.id}" — expected "<board-token>/<job-id>" (e.g. tailscale/4707636005) or a greenhouse.io job URL`,
      "BAD_ID",
    )
    return 1
  }

  const token = parsed.token || opts.company
  if (!token) {
    writeError(
      `That id carries only a job number — pass the board with --company (e.g. --company tailscale)`,
      "NO_COMPANY",
    )
    return 1
  }

  try {
    const job = await jsonFetch<GhJob>(
      `${API_BASE}/${encodeURIComponent(token)}/jobs/${encodeURIComponent(parsed.jobId)}?questions=false`,
    )
    if (!job || !job.id) {
      writeError("Job not found", "NOT_FOUND")
      return 1
    }

    // Prefer the curated display name when the board is in companies.json.
    let companyName = job.company_name ?? null
    try {
      const known = loadCompanies().find((c) => c.token === token)
      if (known?.name) companyName = known.name
    } catch {
      // companies.json is optional for detail lookups — fall back to the API value.
    }

    const url = job.absolute_url || `https://job-boards.greenhouse.io/${token}/jobs/${job.id}`
    const detail: JobDetail = {
      id: makeId(token, job.id),
      title: job.title ? decodeHtmlEntities(job.title).trim() : "(untitled)",
      company: companyName,
      companyToken: token,
      location: job.location?.name ? decodeHtmlEntities(job.location.name).trim() : null,
      date: job.first_published || job.updated_at || null,
      url,
      department: job.departments?.[0]?.name ? String(job.departments[0].name) : null,
      region: null,
      tags: [],
      description: job.content ? decodeContent(job.content) : null,
      updatedAt: job.updated_at ?? null,
      applyUrl: url,
    }

    if (opts.format === "plain") {
      const lines = [
        detail.title,
        `${detail.company || "—"} · ${detail.location || "—"}`,
        detail.department ? `Department: ${detail.department}` : "",
        detail.date ? `Posted: ${detail.date.slice(0, 10)}` : "",
        "",
        detail.description || "(no description)",
        "",
        `URL: ${detail.url}`,
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
