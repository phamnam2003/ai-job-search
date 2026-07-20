import { existsSync, readFileSync } from "fs"
import { readInbox, parsePost, writeError, type FbJobDetail } from "../helpers.js"

export interface DetailOpts {
  idOrFile: string
  inbox: string
  format: "json" | "plain"
}

export function runDetail(opts: DetailOpts): number {
  try {
    let job: FbJobDetail | undefined

    // Accept a direct file path...
    if (existsSync(opts.idOrFile) && /\.(txt|md)$/i.test(opts.idOrFile)) {
      job = parsePost(readFileSync(opts.idOrFile, "utf8"), opts.idOrFile)
    } else {
      // ...or an id from a prior `search` over the inbox.
      job = readInbox(opts.inbox).find((j) => j.id === opts.idOrFile)
    }

    if (!job) {
      writeError(
        `no inbox post found with id "${opts.idOrFile}" (run \`search\` to list ids, or pass a .txt file path)`,
        "NOT_FOUND",
      )
      return 1
    }

    if (opts.format === "plain") {
      process.stdout.write(
        `${job.title}\n${job.company || "—"} · ${job.location || "—"} · ${job.salary || "—"}` +
          (job.date ? ` · deadline ${job.date}` : "") +
          `\ntags: ${job.tags.join(", ") || "—"}\nlink: ${job.url || "(none)"}\n\n${job.description}\n`,
      )
    } else {
      process.stdout.write(JSON.stringify(job, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "DETAIL_FAILED")
    return 1
  }
}
