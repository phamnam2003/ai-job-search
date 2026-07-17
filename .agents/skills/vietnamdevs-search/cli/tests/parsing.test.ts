import { describe, test, expect } from "bun:test";
import {
  parseJobCards,
  parseJobDetail,
  hyphenate,
  isRemoteLocation,
  relativeAgeToDays,
  resolveDetailTarget,
} from "../src/helpers";
import { buildUrl } from "../src/commands/search";

// A realistic VietnamDevs `.card-hoverable` block, mirroring the live markup: the
// company is carried by the logo <img alt="<Company>'s logo">, the detail link is
// /jobs/<id>/<slug>, the location + employment type share a grey <p> separated by a
// U+00B7 middot, the posted age sits in a right-hand column, and the tag <ul> uses
// orange-label (Remote working), yellow-label (Hybrid working), green-label
// (salary) and gray-label (skills).
function card(opts: {
  id: string;
  slug: string;
  title: string;
  company?: string;
  location?: string;
  type?: string;
  age?: string;
  model?: "remote" | "hybrid" | "none";
  salary?: string | null;
  skills?: string[];
}): string {
  const {
    id,
    slug,
    title,
    company = "Acme",
    location = "Ha Noi",
    type = "Full-time",
    age = "3d",
    model = "none",
    salary = null,
    skills = ["Golang", "Kafka"],
  } = opts;
  const modelLabel =
    model === "remote"
      ? `<li class="orange-label">Remote working</li>`
      : model === "hybrid"
        ? `<li class="yellow-label">Hybrid working</li>`
        : "";
  const salaryLabel = salary ? `<li class="green-label">${salary}</li>` : "";
  const skillLabels = skills.map((s) => `<li class="gray-label">${s}</li>`).join("");
  return `<div class="card-hoverable border-t md:border grid grid-cols-12 relative gap-2 p-4">
    <div class="col-span-12 md:col-span-11 flex items-start gap-3">
        <div class="shrink-0">
            <img src="https://res.cloudinary.com/x/${slug}" alt="${company}&#039;s logo" loading="lazy" class="size-12 block object-contain">
        </div>
        <div class="flex flex-col items-start justify-between gap-3">
            <div>
                <h2>
                    <a class="font-source-sans font-semibold md:font-bold text-xl leading-tight line-clamp-1"
                       href="https://vietnamdevs.com/jobs/${id}/${slug}"
                       rel="noopener noreferrer">
                        <span class="absolute inset-0"></span>
                        ${title}
                    </a>
                </h2>
                <p class="font-source-sans md:pt-1.5 md:pb-1.5 text-gray-500">
                    ${location} · ${type}
                </p>
            </div>
        </div>
    </div>
    <div class="hidden md:block md:col-span-1 text-sm text-right text-gray-500">
        <p>${age}</p>
    </div>
    <div class="col-span-12 mt-2 md:mt-4">
        <ul class="list-none p-0 m-0 flex flex-wrap gap-2 text-xs">
            ${modelLabel}
            ${salaryLabel}
            ${skillLabels}
        </ul>
    </div>
</div>`;
}

describe("parseJobCards", () => {
  test("parses a well-formed card into all fields", () => {
    const [c] = parseJobCards(
      card({ id: "928767371223434", slug: "golang-developer", title: "Golang Developer" }),
    );
    expect(c.id).toBe("928767371223434");
    expect(c.title).toBe("Golang Developer");
    expect(c.company).toBe("Acme"); // "Acme&#039;s logo" → Acme
    expect(c.location).toBe("Ha Noi");
    expect(c.employmentType).toBe("Full-time");
    expect(c.date).toBe("3d");
    expect(c.workingModel).toBeNull();
    expect(c.salary).toBeNull();
    expect(c.tags).toEqual(["Golang", "Kafka"]);
    expect(c.url).toBe("https://vietnamdevs.com/jobs/928767371223434/golang-developer");
  });

  test("splits '<City> · <Type>' on the middot separator", () => {
    const [c] = parseJobCards(
      card({ id: "1", slug: "x", title: "X", location: "Ho Chi Minh City", type: "Contract" }),
    );
    expect(c.location).toBe("Ho Chi Minh City");
    expect(c.employmentType).toBe("Contract");
  });

  test("captures remote/hybrid working model and a green-label salary", () => {
    const [remote] = parseJobCards(
      card({ id: "2", slug: "r", title: "R", model: "remote", salary: "$3k - $4k/month" }),
    );
    expect(remote.workingModel).toBe("Remote");
    expect(remote.salary).toBe("$3k - $4k/month");
    const [hybrid] = parseJobCards(card({ id: "3", slug: "h", title: "H", model: "hybrid" }));
    expect(hybrid.workingModel).toBe("Hybrid");
  });

  test("strips a bare ' logo' alt with no possessive", () => {
    const html = `<div class="card-hoverable">
      <img alt="Binance logo">
      <a class="line-clamp-1" href="https://vietnamdevs.com/jobs/9/binance-dev"><span></span>Dev</a></div>`;
    const [c] = parseJobCards(html);
    expect(c.company).toBe("Binance");
  });

  test("decodes HTML entities in the title", () => {
    const [c] = parseJobCards(
      card({ id: "4", slug: "d", title: "Sm&#xF8;rrebr&#248;d Dev &amp; Ops" }),
    );
    expect(c.title).toBe("Smørrebrød Dev & Ops");
  });

  test("parses multiple cards and skips a chunk with no job link", () => {
    const good = card({ id: "11", slug: "one", title: "Job One" });
    const promo = `<div class="card-hoverable">Follow us on LinkedIn</div>`;
    const good2 = card({ id: "22", slug: "two", title: "Job Two" });
    const cards = parseJobCards(good + promo + good2);
    expect(cards.map((c) => c.id)).toEqual(["11", "22"]);
  });

  test("returns [] when there are no cards", () => {
    expect(parseJobCards("<html><body>nothing here</body></html>")).toEqual([]);
  });
});

describe("parseJobDetail", () => {
  const jobHtml = `
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      "title": "Golang Developer",
      "description": "What we needMashed body text.",
      "hiringOrganization": { "@type": "Organization", "name": "Oivan", "sameAs": "https://vietnamdevs.com/companies/oivan" },
      "jobLocation": { "@type": "Place", "address": { "@type": "PostalAddress", "addressCountry": "VN", "addressLocality": "Ho Chi Minh City" } },
      "datePosted": "2026-06-07T09:18:43.000000Z",
      "validThrough": "2026-08-07T09:18:43.000000Z",
      "employmentType": "FULL_TIME",
      "url": "https://vietnamdevs.com/jobs/928767371223434/golang-developer",
      "identifier": { "@type": "PropertyValue", "name": "VietnamDevs", "value": "928767371223434" }
    }
    </script>
    <ul><li class=" tag-item gray-label">Golang</li><li class=" tag-item gray-label">Backend</li></ul>
    <div class="typography"><h2>What we need</h2><p>Build <strong>Go</strong> services.</p>
      <h2>What you'll do</h2><ul><li><p>Design APIs</p></li><li><p>Scale systems</p></li></ul></div>`;

  test("parses metadata from the JobPosting ld+json", () => {
    const job = parseJobDetail(jobHtml, "928767371223434")!;
    expect(job).not.toBeNull();
    expect(job.id).toBe("928767371223434");
    expect(job.title).toBe("Golang Developer");
    expect(job.company).toBe("Oivan");
    expect(job.companyUrl).toBe("https://vietnamdevs.com/companies/oivan");
    expect(job.location).toBe("Ho Chi Minh City");
    expect(job.employmentType).toBe("Full-Time");
    expect(job.date).toBe("2026-06-07T09:18:43.000000Z");
    expect(job.deadline).toBe("2026-08-07T09:18:43.000000Z");
    expect(job.url).toBe("https://vietnamdevs.com/jobs/928767371223434/golang-developer");
    expect(job.tags).toEqual(["Golang", "Backend"]);
  });

  test("builds a readable description from the .typography block (not the ld+json)", () => {
    const job = parseJobDetail(jobHtml, "928767371223434")!;
    expect(job.description).toContain("What we need");
    expect(job.description).toContain("Build Go services.");
    expect(job.description).toContain("- Design APIs");
    expect(job.description).toContain("What you'll do");
    // Headings must not run into the body the way the ld+json description does.
    expect(job.description).not.toContain("What we needBuild");
  });

  test("returns null when there is no JobPosting ld+json", () => {
    expect(parseJobDetail(`<html><h1>Oops, not found</h1></html>`, "1")).toBeNull();
  });
});

describe("resolveDetailTarget", () => {
  test("resolves a full job URL", () => {
    expect(resolveDetailTarget("https://vietnamdevs.com/jobs/928767371223434/golang-developer")).toEqual({
      id: "928767371223434",
      url: "https://vietnamdevs.com/jobs/928767371223434/golang-developer",
    });
  });
  test("resolves an '<id>/<slug>' fragment", () => {
    expect(resolveDetailTarget("928767371223434/golang-developer")).toEqual({
      id: "928767371223434",
      url: "https://vietnamdevs.com/jobs/928767371223434/golang-developer",
    });
  });
  test("resolves a bare numeric id by appending a dummy slug (server redirects)", () => {
    expect(resolveDetailTarget("928767371223434")).toEqual({
      id: "928767371223434",
      url: "https://vietnamdevs.com/jobs/928767371223434/job",
    });
  });
  test("returns null for a non-numeric, non-URL string", () => {
    expect(resolveDetailTarget("not-a-job")).toBeNull();
  });
});

describe("hyphenate / isRemoteLocation / relativeAgeToDays", () => {
  test("hyphenate normalizes to a category slug", () => {
    expect(hyphenate("Ho Chi Minh")).toBe("ho-chi-minh");
    expect(hyphenate("back end")).toBe("back-end");
    expect(hyphenate("Golang")).toBe("golang");
  });

  test("isRemoteLocation matches 'remote' and 'remote working'", () => {
    expect(isRemoteLocation("remote")).toBe(true);
    expect(isRemoteLocation("Remote Working")).toBe(true);
    expect(isRemoteLocation("ha-noi")).toBe(false);
    expect(isRemoteLocation(undefined)).toBe(false);
  });

  test("relativeAgeToDays parses the card's age labels", () => {
    expect(relativeAgeToDays("3d")).toBe(3);
    expect(relativeAgeToDays("1w")).toBe(7);
    expect(relativeAgeToDays("1mo")).toBe(30);
    expect(relativeAgeToDays("2mos")).toBe(60);
    expect(relativeAgeToDays("5h")).toBe(0);
    expect(relativeAgeToDays("1y")).toBe(365);
    expect(relativeAgeToDays("today")).toBe(0);
    expect(relativeAgeToDays("garbage")).toBeNull();
    expect(relativeAgeToDays(null)).toBeNull();
  });
});

describe("buildUrl", () => {
  test("keyword only", () => {
    expect(buildUrl({ query: "golang", jobage: 9999, page: 1, format: "json" })).toBe(
      "https://vietnamdevs.com/jobs/golang",
    );
  });
  test("keyword + city", () => {
    expect(
      buildUrl({ query: "golang", location: "ha-noi", jobage: 9999, page: 1, format: "json" }),
    ).toBe("https://vietnamdevs.com/jobs/golang/ha-noi");
  });
  test("city only", () => {
    expect(buildUrl({ location: "ho-chi-minh", jobage: 9999, page: 1, format: "json" })).toBe(
      "https://vietnamdevs.com/jobs/ho-chi-minh",
    );
  });
  test("remote is NOT a path segment (filtered client-side)", () => {
    expect(
      buildUrl({ query: "golang", location: "remote", jobage: 9999, page: 1, format: "json" }),
    ).toBe("https://vietnamdevs.com/jobs/golang");
  });
  test("pagination appends ?page=n only when > 1", () => {
    expect(buildUrl({ query: "golang", jobage: 9999, page: 2, format: "json" })).toBe(
      "https://vietnamdevs.com/jobs/golang?page=2",
    );
    expect(buildUrl({ jobage: 9999, page: 1, format: "json" })).toBe("https://vietnamdevs.com/jobs");
  });
});
