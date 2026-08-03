import { BASE, htmlFetch, parseJobDetail, writeError } from "../helpers.js"

export interface DetailOpts {
  id: string
  format: "json" | "plain"
}

/**
 * Devwork detail URLs look like:
 *   https://devwork.vn/viec-lam/13758/full-stack-developer-(golang)
 * The numeric ID is what matters; the slug is cosmetic and the site resolves a
 * bare ID. Also accepts the /tuyen-dung/<id>/<slug> variant used by some links.
 */
export function normalizeTarget(input: string): { id: string; url: string } | null {
  const trimmed = input.trim()

  const fromUrl = trimmed.match(
    /devwork\.vn\/(?:viec-lam|tuyen-dung)\/(\d+)(?:\/([^?#]*))?/i,
  )
  if (fromUrl) {
    const slug = fromUrl[2] ? `/${fromUrl[2]}` : "/j"
    return { id: fromUrl[1], url: `${BASE}/viec-lam/${fromUrl[1]}${slug}` }
  }

  // Devwork requires a slug segment: /viec-lam/<id> renders the listing shell
  // with no job content, while /viec-lam/<id>/<anything> renders the posting.
  // The slug itself is not validated, so a placeholder resolves a bare ID.
  const bare = trimmed.match(/^(\d+)$/)
  if (bare) return { id: bare[1], url: `${BASE}/viec-lam/${bare[1]}/j` }

  return null
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const target = normalizeTarget(opts.id)
  if (!target) {
    writeError(`Could not parse a Devwork job ID or URL from "${opts.id}"`, "BAD_ID")
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
        job.deadline ? `Hạn nộp hồ sơ (deadline): ${job.deadline}` : "",
        job.level ? `Vị trí (level): ${job.level}` : "",
        job.experience ? `Kinh nghiệm (experience): ${job.experience}` : "",
        job.education ? `Trình độ: ${job.education}` : "",
        job.employmentType ? `Hình thức: ${job.employmentType}` : "",
        job.headcount ? `Số lượng: ${job.headcount}` : "",
        job.skills.length ? `Skills: ${job.skills.join(", ")}` : "",
        "",
        "## Mô tả công việc (Job description)",
        job.description || "(no description)",
        "",
        job.requirements ? "## Yêu cầu (Requirements)\n" + job.requirements + "\n" : "",
        job.benefits ? "## Quyền lợi (Benefits)\n" + job.benefits + "\n" : "",
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
