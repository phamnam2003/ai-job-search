import {
  BASE,
  fetchText,
  feedUrls,
  resolveCategories,
  mergeFeeds,
  descriptionToText,
  htmlToText,
  extractSlug,
  writeError,
  type FeedItem,
} from "../helpers.js"

export interface DetailOpts {
  id: string
  category?: string
  format: "json" | "plain"
}

export interface JobDetail {
  id: string
  title: string | null
  company: string | null
  location: string | null
  date: string | null
  url: string
  type: string | null
  category: string | null
  skills: string | null
  description: string | null
}

/**
 * Best-effort description extraction from a WWR job page. In practice the job
 * pages are Cloudflare-fronted and return 403 (fetchText yields ""), so this rarely
 * runs — the RSS <description> is the reliable source. Kept so the CLI uses the
 * richer page body if WWR ever serves it directly.
 */
function extractPageDescription(html: string): string | null {
  const m =
    html.match(/class="[^"]*lis-container__job__content__description[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/<section[^>]*class="[^"]*job-listing-show[^"]*"[^>]*>([\s\S]*?)<\/section>/i)
  if (!m) return null
  const text = htmlToText(m[1])
  return text || null
}

function renderPlain(job: JobDetail): string {
  const lines = [
    job.title || "(untitled)",
    `${job.company || "—"} · ${job.location || "—"} · ${job.type || "—"}`,
    job.skills ? `Skills: ${job.skills}` : "",
    job.date ? `Posted: ${job.date}` : "",
    "",
    job.description || "(no description)",
    "",
    `URL: ${job.url}`,
  ].filter((l) => l !== "")
  return lines.join("\n")
}

export async function runDetail(opts: DetailOpts): Promise<number> {
  const slug = extractSlug(opts.id)
  if (!slug) {
    writeError(`Could not parse a job slug from "${opts.id}"`, "BAD_ID")
    return 1
  }

  const keys = resolveCategories(opts.category)
  if (keys.length === 0) {
    writeError(
      `--category "${opts.category}" matched no feeds (valid: backend, fullstack, frontend, devops, all)`,
      "BAD_CATEGORY",
    )
    return 1
  }

  try {
    const pageUrl = `${BASE}/remote-jobs/${slug}`

    // 1) Try the job page (usually Cloudflare-blocked -> ""), 2) scan the RSS feeds
    // for the item (authoritative metadata + full <description> fallback).
    const [page, ...xmls] = await Promise.all([
      fetchText(pageUrl),
      ...feedUrls(keys).map((u) => fetchText(u)),
    ])
    const pageDescription = page ? extractPageDescription(page) : null

    const item: FeedItem | undefined = mergeFeeds(xmls).find((it) => it.id === slug)
    if (!item && !pageDescription) {
      writeError(
        "Job not found in the We Work Remotely feeds (it may have expired or be in another category — try --category all)",
        "NOT_FOUND",
      )
      return 1
    }

    const description =
      pageDescription ?? (item ? descriptionToText(item.descriptionHtml) : null)

    const job: JobDetail = {
      id: slug,
      title: item?.title ?? null,
      company: item?.company ?? null,
      location: item?.location ?? null,
      date: item?.date ?? null,
      url: item?.url ?? pageUrl,
      type: item?.type ?? null,
      category: item?.category ?? null,
      skills: item?.skills ?? null,
      description: description || null,
    }

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
