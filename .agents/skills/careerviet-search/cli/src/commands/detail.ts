import { BASE, htmlFetch, parseJobDetail, writeError } from "../helpers.js"

export interface DetailOpts {
  id: string
  format: "json" | "plain"
}

/**
 * CareerViet detail URLs look like:
 *   https://careerviet.vn/vi/tim-viec-lam/<slug>.<ID>.html
 * The ID is an uppercase hex-ish token (e.g. 35C7E79E). Accept a full URL or a
 * bare ID; a bare ID needs no slug — the site resolves `/vi/tim-viec-lam/j.<ID>.html`
 * by redirect, so we keep whatever slug we were given when we have one.
 */
export function normalizeTarget(input: string): { id: string; url: string } | null {
  const trimmed = input.trim()

  const fromUrl = trimmed.match(
    /careerviet\.vn\/(?:vi|en)\/tim-viec-lam\/([^/]+)\.([A-Za-z0-9]+)\.html/i,
  )
  if (fromUrl) {
    return {
      id: fromUrl[2],
      url: `${BASE}/vi/tim-viec-lam/${fromUrl[1]}.${fromUrl[2]}.html`,
    }
  }

  const bare = trimmed.match(/^([A-Za-z0-9]{6,})$/)
  if (bare) {
    return { id: bare[1], url: `${BASE}/vi/tim-viec-lam/j.${bare[1]}.html` }
  }

  return null
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const target = normalizeTarget(opts.id)
  if (!target) {
    writeError(`Could not parse a CareerViet job ID or URL from "${opts.id}"`, "BAD_ID")
    return 1
  }
  try {
    const html = await htmlFetch(target.url)
    if (!html) {
      writeError("Job not found", "NOT_FOUND")
      return 1
    }
    const job = parseJobDetail(html, target.id, target.url)

    if (opts.format === "plain") {
      const lines = [
        job.title,
        `${job.company || "—"} · ${job.location || "—"} · ${job.salary || "—"}`,
        job.deadline ? `Hạn nộp (deadline): ${job.deadline}` : "",
        job.employmentType ? `Hình thức: ${job.employmentType}` : "",
        job.industry ? `Ngành nghề: ${job.industry}` : "",
        "",
        "## Mô tả công việc (Job description)",
        job.description || "(no description)",
        "",
        job.benefits ? "## Phúc lợi (Benefits)\n" + job.benefits + "\n" : "",
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
