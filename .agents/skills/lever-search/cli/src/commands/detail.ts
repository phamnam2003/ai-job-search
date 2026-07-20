import {
  API_BASE,
  jsonFetch,
  loadCompanies,
  parseId,
  composeDescription,
  decodeHtmlEntities,
  makeId,
  writeError,
  type LeverPosting,
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
      `Could not parse a posting id from "${opts.id}" — expected "<board-token>/<uuid>" (e.g. amanotes/9c9416dd-bff1-4cf8-a4a7-b11150e37526) or a jobs.lever.co URL`,
      "BAD_ID",
    )
    return 1
  }

  const token = parsed.token || opts.company
  if (!token) {
    writeError(
      `That id is a bare posting UUID — pass the board with --company (e.g. --company amanotes)`,
      "NO_COMPANY",
    )
    return 1
  }

  try {
    const posting = await jsonFetch<LeverPosting | { ok?: boolean; error?: string }>(
      `${API_BASE}/${encodeURIComponent(token)}/${encodeURIComponent(parsed.postingId)}`,
    )
    // Lever answers an unknown board or posting with 200 + {ok:false}, not a 404.
    if (!posting || typeof (posting as LeverPosting).id !== "string") {
      writeError("Job not found", "NOT_FOUND")
      return 1
    }
    const p = posting as LeverPosting

    // Prefer the curated display name when the board is in companies.json.
    let companyName: string = token
    let region: string | null = null
    let tags: string[] = []
    try {
      const known = loadCompanies().find((c) => c.token === token)
      if (known) {
        companyName = known.name || token
        region = known.region ?? null
        tags = known.tags ?? []
      }
    } catch {
      // companies.json is optional for detail lookups — fall back to the token.
    }

    const cats = p.categories ?? {}
    const detail: JobDetail = {
      id: makeId(token, p.id),
      title: p.text ? decodeHtmlEntities(p.text).trim() : "(untitled)",
      company: companyName,
      companyToken: token,
      location: cats.location ? decodeHtmlEntities(cats.location).trim() : null,
      date: typeof p.createdAt === "number" ? new Date(p.createdAt).toISOString() : null,
      url: p.hostedUrl || `https://jobs.lever.co/${token}/${p.id}`,
      department: cats.department ?? null,
      team: cats.team ?? null,
      commitment: cats.commitment ?? null,
      workplaceType: p.workplaceType ?? null,
      region,
      tags,
      description: composeDescription(p),
      allLocations: cats.allLocations ?? [],
      applyUrl: p.applyUrl ?? null,
    }

    if (opts.format === "plain") {
      const lines = [
        detail.title,
        `${detail.company || "—"} · ${detail.location || "—"}`,
        detail.allLocations.length > 1 ? `All locations: ${detail.allLocations.join("; ")}` : "",
        detail.department ? `Department: ${detail.department}` : "",
        detail.team ? `Team: ${detail.team}` : "",
        detail.commitment ? `Commitment: ${detail.commitment}` : "",
        detail.workplaceType ? `Workplace: ${detail.workplaceType}` : "",
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
