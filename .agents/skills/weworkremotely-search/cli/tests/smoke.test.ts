import { describe, test, expect } from "bun:test"
import { runCLI, parseJSON } from "./helpers"
import {
  parseFeed,
  parseItem,
  mergeFeeds,
  decodeHtmlEntities,
  htmlToText,
  descriptionToText,
  extractSlug,
  slugFromUrl,
  resolveCategories,
  foldDiacritics,
} from "../src/helpers"

interface SearchOut {
  meta: { count: number; page: number }
  results: Array<{
    id: string
    title: string | null
    company: string | null
    location: string | null
    url: string
  }>
}

// --- Offline RSS fixture ---------------------------------------------------
// Mirrors the real We Work Remotely feed shape: "Company: Role" <title>, XML-escaped
// HTML <description> (note the double-escaped &amp;nbsp; / &amp;amp;), <region>,
// <pubDate>, <type>, <skills>, <category>, media logo, <guid>/<link>.
const BACKEND_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss">
  <channel>
    <title>We Work Remotely: Back-End Programming Jobs</title>
    <link>https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss</link>
    <item>
      <media:content url="https://wwr-pro.s3.amazonaws.com/logos/0084/0935/logo.gif" type="image/png"/>
      <title>Proxify AB: Senior Java Backend Developer</title>
      <region>Anywhere in the World</region>
      <country></country>
      <skills>Java and Back-End Dev</skills>
      <category>Back-End Programming</category>
      <type>Full-Time</type>
      <description>&lt;p&gt;&lt;strong&gt;Headquarters:&lt;/strong&gt; Sweden&lt;/p&gt;&lt;h4&gt;What we are looking for:&lt;/h4&gt;&lt;ul&gt;&lt;li&gt;Expert Java&amp;nbsp;and Spring&lt;/li&gt;&lt;li&gt;Go &amp;amp; Kafka&lt;/li&gt;&lt;/ul&gt;</description>
      <pubDate>Mon, 13 Jul 2026 13:41:15 +0000</pubDate>
      <guid>https://weworkremotely.com/remote-jobs/proxify-ab-senior-java-backend-developer</guid>
      <link>https://weworkremotely.com/remote-jobs/proxify-ab-senior-java-backend-developer</link>
    </item>
    <item>
      <title>Acme &amp; Co: Backend Engineer: Payments Platform</title>
      <region></region>
      <skills>Go, PostgreSQL</skills>
      <category>Back-End Programming</category>
      <type>Contract</type>
      <description>&lt;p&gt;Build payment rails with Go.&lt;/p&gt;</description>
      <pubDate>Tue, 07 Jul 2026 12:49:42 +0000</pubDate>
      <link>https://weworkremotely.com/remote-jobs/acme-co-backend-engineer-payments</link>
    </item>
  </channel>
</rss>`

// A second feed that repeats the Proxify item (dedupe) plus one unique React role.
const FULLSTACK_FIXTURE = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss">
  <channel>
    <title>We Work Remotely: Full-Stack Programming Jobs</title>
    <item>
      <title>Proxify AB: Senior Java Backend Developer</title>
      <region>Anywhere in the World</region>
      <type>Full-Time</type>
      <description>&lt;p&gt;dup&lt;/p&gt;</description>
      <pubDate>Mon, 13 Jul 2026 13:41:15 +0000</pubDate>
      <link>https://weworkremotely.com/remote-jobs/proxify-ab-senior-java-backend-developer</link>
    </item>
    <item>
      <title>Steady Vision: Senior React Developer</title>
      <region>India</region>
      <type>Full-Time</type>
      <description>&lt;p&gt;React and TypeScript.&lt;/p&gt;</description>
      <pubDate>Wed, 08 Jul 2026 09:00:00 +0000</pubDate>
      <link>https://weworkremotely.com/remote-jobs/steady-vision-senior-react-developer</link>
    </item>
  </channel>
</rss>`

describe("parseFeed / parseItem", () => {
  const items = parseFeed(BACKEND_FIXTURE)

  test("parses every <item> in the feed", () => {
    expect(items.length).toBe(2)
  })

  test("splits the title on the FIRST ': ' into company + role", () => {
    expect(items[0].company).toBe("Proxify AB")
    expect(items[0].title).toBe("Senior Java Backend Developer")
  })

  test("keeps a colon inside the role, and decodes '&' in the company", () => {
    expect(items[1].company).toBe("Acme & Co")
    expect(items[1].title).toBe("Backend Engineer: Payments Platform")
  })

  test("derives the id from the <link>'s last path segment", () => {
    expect(items[0].id).toBe("proxify-ab-senior-java-backend-developer")
    expect(items[0].url).toBe(
      "https://weworkremotely.com/remote-jobs/proxify-ab-senior-java-backend-developer",
    )
  })

  test("location comes from <region>, falling back to 'Remote' when empty", () => {
    expect(items[0].location).toBe("Anywhere in the World")
    expect(items[1].location).toBe("Remote")
  })

  test("carries pubDate, type, skills and category through", () => {
    expect(items[0].date).toContain("2026")
    expect(items[0].type).toBe("Full-Time")
    expect(items[1].type).toBe("Contract")
    expect(items[0].skills).toContain("Java")
    expect(items[0].category).toBe("Back-End Programming")
    expect(items[0].logo).toContain("logo.gif")
  })

  test("a link-less block yields no item", () => {
    expect(parseItem("<title>No Link: Role</title>")).toBeNull()
  })
})

describe("descriptionToText", () => {
  const text = descriptionToText(parseFeed(BACKEND_FIXTURE)[0].descriptionHtml)

  test("strips tags and bullets list items", () => {
    expect(text).not.toContain("<")
    expect(text).toContain("• Expert Java")
    expect(text).toContain("Headquarters:")
  })

  test("decodes the double-escaped entities (&amp;nbsp; -> space, &amp;amp; -> &)", () => {
    expect(text).toContain("Java and Spring")
    expect(text).toContain("Go & Kafka")
  })
})

describe("mergeFeeds", () => {
  test("de-duplicates a job that appears in more than one feed, by slug", () => {
    const merged = mergeFeeds([BACKEND_FIXTURE, FULLSTACK_FIXTURE])
    const ids = merged.map((m) => m.id)
    expect(ids.filter((id) => id === "proxify-ab-senior-java-backend-developer").length).toBe(1)
    expect(merged.length).toBe(3)
    expect(ids).toContain("steady-vision-senior-react-developer")
  })
})

describe("entity + html helpers", () => {
  test("decodeHtmlEntities: named, decimal, hex and supplementary-plane", () => {
    expect(decodeHtmlEntities("R&amp;D &ndash; team")).toBe("R&D – team")
    expect(decodeHtmlEntities("caf&#233; &#x1F600;")).toBe("café 😀")
  })

  test("htmlToText: breaks + bullets, no residual tags", () => {
    const t = htmlToText("<p>Overview</p><ul><li>Go</li><li>Kafka</li></ul>")
    expect(t).toContain("Overview")
    expect(t).toContain("• Go")
    expect(t).toContain("• Kafka")
    expect(t).not.toContain("<")
  })

  test("foldDiacritics enables accent-insensitive location matching", () => {
    expect(foldDiacritics("Attica")).toBe("attica")
    expect(foldDiacritics("Île-de-France")).toContain("ile-de-france")
  })
})

describe("extractSlug / slugFromUrl", () => {
  test("accepts a bare slug, a full WWR url, and a remote-jobs path", () => {
    expect(extractSlug("proxify-ab-senior-java-backend-developer")).toBe(
      "proxify-ab-senior-java-backend-developer",
    )
    expect(
      extractSlug("https://weworkremotely.com/remote-jobs/acme-co-backend-engineer?utm=x"),
    ).toBe("acme-co-backend-engineer")
    expect(extractSlug("remote-jobs/steady-vision-senior-react-developer")).toBe(
      "steady-vision-senior-react-developer",
    )
  })

  test("rejects a non-slug argument", () => {
    expect(extractSlug("not a slug")).toBeNull()
    expect(extractSlug("")).toBeNull()
  })

  test("slugFromUrl takes the last path segment, minus query", () => {
    expect(slugFromUrl("https://weworkremotely.com/remote-jobs/foo-bar?a=1")).toBe("foo-bar")
  })
})

describe("resolveCategories", () => {
  test("defaults to the three programming feeds", () => {
    expect(resolveCategories(undefined)).toEqual(["backend", "fullstack", "frontend"])
  })

  test("resolves aliases and the 'all' keyword, de-duplicated", () => {
    expect(resolveCategories("be,fe")).toEqual(["backend", "frontend"])
    expect(resolveCategories("all")).toEqual(["backend", "fullstack", "frontend", "devops"])
    expect(resolveCategories("backend,backend")).toEqual(["backend"])
  })

  test("returns [] when a provided flag matches nothing valid", () => {
    expect(resolveCategories("zzz")).toEqual([])
  })
})

// --- Live smoke tests (hit the public We Work Remotely RSS feeds) ----------
describe("search (live)", () => {
  test("returns at least one real result with a split company + title and a url", async () => {
    const res = await runCLI(["search", "-q", "backend", "--limit", "3", "--format", "json"])
    expect(res.exitCode).toBe(0)
    const out = parseJSON<SearchOut>(res)
    expect(out.results.length).toBeGreaterThan(0)
    const first = out.results[0]
    expect(first.id).toBeTruthy()
    expect(first.title).toBeTruthy()
    expect(first.company).toBeTruthy()
    expect(first.url).toContain("weworkremotely.com/remote-jobs/")
  })

  test("table format prints a header", async () => {
    const res = await runCLI(["search", "-q", "backend", "--limit", "3", "--format", "table"])
    expect(res.exitCode).toBe(0)
    expect(res.stdout).toContain("TITLE")
  })

  test("detail (via a live slug) returns a readable description", async () => {
    const s = await runCLI(["search", "-q", "backend", "--limit", "1", "--format", "json"])
    const out = parseJSON<SearchOut>(s)
    if (out.results.length === 0) return // nothing to detail today; skip gracefully
    const slug = out.results[0].id
    const res = await runCLI(["detail", slug, "--format", "plain"])
    expect(res.exitCode).toBe(0)
    expect(res.stdout.length).toBeGreaterThan(80)
    expect(res.stdout).toMatch(/[A-Za-z]{4,}/)
  })
})

// --- Error handling --------------------------------------------------------
describe("errors", () => {
  test("detail with no id exits 1 with a JSON error on stderr", async () => {
    const res = await runCLI(["detail"])
    expect(res.exitCode).toBe(1)
    expect(res.stdout).toBe("")
    const err = JSON.parse(res.stderr) as { error: string; code: string }
    expect(err.code).toBe("NO_ID")
  })

  test("unknown command exits 1 with a JSON error on stderr", async () => {
    const res = await runCLI(["frobnicate"])
    expect(res.exitCode).toBe(1)
    const err = JSON.parse(res.stderr) as { error: string; code: string }
    expect(err.code).toBe("BAD_CMD")
  })

  test("an unknown --category exits 1 with BAD_CATEGORY", async () => {
    const res = await runCLI(["search", "--category", "zzz", "--format", "json"])
    expect(res.exitCode).toBe(1)
    const err = JSON.parse(res.stderr) as { error: string; code: string }
    expect(err.code).toBe("BAD_CATEGORY")
  })
})
