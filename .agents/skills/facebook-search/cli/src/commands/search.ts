import { readInbox, deaccent, writeError, type FbJob, type FbJobDetail } from "../helpers.js"

export interface SearchOpts {
  query?: string
  location?: string
  inbox: string
  limit?: number
  format: "json" | "table" | "plain"
}

function strip(job: FbJobDetail): FbJob {
  const { description: _d, ...rest } = job
  return rest
}

function matches(job: FbJobDetail, query?: string, location?: string): boolean {
  if (query) {
    const hay = deaccent(`${job.title} ${job.company ?? ""} ${job.tags.join(" ")} ${job.description}`).toLowerCase()
    const needle = deaccent(query).toLowerCase()
    if (!hay.includes(needle)) return false
  }
  if (location) {
    const loc = deaccent(job.location ?? "").toLowerCase()
    if (!loc.includes(deaccent(location).toLowerCase())) return false
  }
  return true
}

function renderTable(jobs: FbJob[]): string {
  if (jobs.length === 0) return "No results. (Paste Facebook posts into the inbox folder first — see inbox/README.md.)"
  const rows = jobs.map((j) => {
    const id = (j.id || "").slice(0, 20).padEnd(20)
    const title = (j.title || "").slice(0, 40).padEnd(40)
    const company = (j.company || "—").slice(0, 24).padEnd(24)
    const loc = (j.location || "—").slice(0, 18).padEnd(18)
    return `${id} ${title} ${company} ${loc} ${j.salary || "—"}`
  })
  const header =
    "ID".padEnd(20) + " " + "TITLE".padEnd(40) + " " + "COMPANY".padEnd(24) + " " + "LOCATION".padEnd(18) + " SALARY"
  return [header, "-".repeat(header.length), ...rows].join("\n")
}

export function runSearch(opts: SearchOpts): number {
  try {
    let jobs = readInbox(opts.inbox).filter((j) => matches(j, opts.query, opts.location))
    if (opts.limit !== undefined && opts.limit >= 0) jobs = jobs.slice(0, opts.limit)

    if (opts.format === "table") {
      process.stdout.write(renderTable(jobs.map(strip)) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(
        jobs
          .map(
            (j) =>
              `${j.title}\n  ${j.company || "—"} · ${j.location || "—"} · ${j.salary || "—"}\n  id: ${j.id}  source: ${j.source}\n  ${j.url || "(no link in post)"}`,
          )
          .join("\n\n") + "\n",
      )
    } else {
      process.stdout.write(
        JSON.stringify({ meta: { count: jobs.length, page: 1 }, results: jobs.map(strip) }, null, 2) + "\n",
      )
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "SEARCH_FAILED")
    return 1
  }
}
