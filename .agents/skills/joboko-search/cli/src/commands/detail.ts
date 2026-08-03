import { BASE, htmlFetch, parseJobDetail, writeError } from "../helpers.js"

export interface DetailOpts {
  id: string
  format: "json" | "plain"
}

/**
 * Joboko detail URLs look like:
 *   https://vn.joboko.com/viec-lam-<slug>-xvi<ID>
 * The slug is part of the route, so a bare ID cannot be resolved without it —
 * unlike most portals. Pass the full URL (which is what `search` emits).
 */
export function normalizeTarget(input: string): { id: string; url: string } | null {
  const trimmed = input.trim()

  const fromUrl = trimmed.match(/joboko\.com\/(viec-lam-[^/?#]*xvi(\d+))/i)
  if (fromUrl) return { id: fromUrl[2], url: `${BASE}/${fromUrl[1]}` }

  const pathOnly = trimmed.match(/^\/?(viec-lam-[^/?#]*xvi(\d+))$/i)
  if (pathOnly) return { id: pathOnly[2], url: `${BASE}/${pathOnly[1]}` }

  return null
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const target = normalizeTarget(opts.id)
  if (!target) {
    writeError(
      `Joboko detail needs the full posting URL or path (…/viec-lam-<slug>-xvi<id>) — ` +
        `a bare ID cannot be resolved because the slug is part of the route. Got "${opts.id}"`,
      "BAD_ID",
    )
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
        job.expired ? "*** EXPIRED — this posting is closed ***" : "",
        job.deadline ? `Hạn nộp (deadline): ${job.deadline}` : "",
        job.date ? `Đăng ngày (posted): ${job.date}` : "",
        job.employmentType ? `Hình thức: ${job.employmentType}` : "",
        job.industry ? `Ngành nghề: ${job.industry}` : "",
        "",
        "## Mô tả công việc (Job description)",
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
