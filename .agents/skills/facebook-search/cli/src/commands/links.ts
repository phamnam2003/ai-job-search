import { buildLinks, readGroups, writeError, type FbLink } from "../helpers.js"

export interface LinksOpts {
  query: string
  location?: string
  groupsPath: string
  format: "json" | "table" | "plain"
}

function renderTable(links: FbLink[]): string {
  const rows = links.map((l) => `${l.type.padEnd(16)} ${l.url}`)
  return ["TYPE".padEnd(16) + " URL", "-".repeat(60), ...rows].join("\n")
}

export function runLinks(opts: LinksOpts): number {
  try {
    const links = buildLinks(opts.query, opts.location, readGroups(opts.groupsPath))
    if (opts.format === "table") {
      process.stdout.write(renderTable(links) + "\n")
    } else if (opts.format === "plain") {
      process.stdout.write(links.map((l) => `${l.label}\n  ${l.url}`).join("\n\n") + "\n")
    } else {
      process.stdout.write(JSON.stringify({ meta: { count: links.length }, results: links }, null, 2) + "\n")
    }
    return 0
  } catch (e) {
    writeError(e instanceof Error ? e.message : String(e), "LINKS_FAILED")
    return 1
  }
}
