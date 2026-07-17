import { describe, test, expect } from "bun:test";
import {
  parseJobCards,
  parseJobDetailJson,
  parseJobDetailHtml,
  parseAge,
  extractSlug,
  isNumericId,
  hyphenate,
  slugSegment,
} from "../src/helpers";
import { buildUrl, type SearchOpts } from "../src/commands/search";

// A realistic ITNavi `.jsl-item` search card, mirroring the live markup: the div
// carries a numeric `data-id` (and NO detail hyperlink), the title is an <h2> with
// class jsl-item__name, the company is a <p class="jsl-item__cpn">, the location a
// <p class="jsl-item__location">, and the posted age a <p class="jsl-item__sm">.
function card(
  id: string,
  title: string,
  company = "Acme",
  location = "Hà Nội",
  age = "5 d",
): string {
  return `<div class="jsl-item jsl_item " data-id="${id}">
    <div class="jsl-item__logo"><img src="logo.png" alt=""></div>
    <div class="jsl-item--right">
      <div class="jsl-item--line">
        <h2 class="jsl-item__name">${title}</h2>
        <a href="https://itnavi.com.vn/login" class="jsl-item__save"><i class="far fa-heart"></i></a>
      </div>
      <div class="jsl-item--line"><p class="jsl-item__cpn">${company}</p></div>
      <div class="jsl-item--line">
        <p class="jsl-item__location">${location}</p>
        <p class="jsl-item__sm">${age}</p>
      </div>
    </div>
  </div>`;
}

describe("parseJobCards", () => {
  test("parses a well-formed card into all card fields", () => {
    const [c] = parseJobCards(card("23677", "Senior Backend Developer (Python)", "DIGI-TEXX", "Hồ Chí Minh", "1 d"));
    expect(c.id).toBe("23677");
    expect(c.title).toBe("Senior Backend Developer (Python)");
    expect(c.company).toBe("DIGI-TEXX");
    expect(c.location).toBe("Hồ Chí Minh");
    expect(c.date).toBe("1 day ago");
    expect(c.ageDays).toBe(1);
    // url/slug/salary/posted are only filled by enrichment.
    expect(c.url).toBeNull();
    expect(c.slug).toBeNull();
    expect(c.salary).toBeNull();
    expect(c.posted).toBeNull();
  });

  test("decodes decimal and hex HTML entities in the title", () => {
    const [c] = parseJobCards(card("1", "Sm&#xF8;rrebr&#248;d Dev &amp; Ops"));
    expect(c.title).toBe("Smørrebrød Dev & Ops");
  });

  test("parses multiple cards and skips chunks without a valid id or title", () => {
    const good = card("11", "Job One");
    const noTitle = `<div class="jsl-item" data-id="99"><p class="jsl-item__cpn">NoTitle Co</p></div>`;
    const nonNumeric = `<div data-id="abc"><h2 class="jsl-item__name">Bad Id</h2></div>`;
    const good2 = card("22", "Job Two");
    const cards = parseJobCards(good + noTitle + nonNumeric + good2);
    expect(cards.map((c) => c.id)).toEqual(["11", "22"]);
  });

  test("returns an empty array when there are no cards", () => {
    expect(parseJobCards("<div>no jobs here</div>")).toEqual([]);
  });
});

describe("parseAge", () => {
  test("days", () => {
    expect(parseAge("5 d")).toEqual({ days: 5, human: "5 days ago" });
    expect(parseAge("1 d")).toEqual({ days: 1, human: "1 day ago" });
    expect(parseAge("0 d")).toEqual({ days: 0, human: "today" });
  });
  test("weeks / months / years", () => {
    expect(parseAge("3 w")).toEqual({ days: 21, human: "3 weeks ago" });
    expect(parseAge("2 mo")).toEqual({ days: 60, human: "2 months ago" });
    expect(parseAge("1 y")).toEqual({ days: 365, human: "1 year ago" });
  });
  test("hours collapse to today", () => {
    expect(parseAge("8 h")).toEqual({ days: 0, human: "today" });
  });
  test("unparseable input keeps days null (never filtered out)", () => {
    expect(parseAge("")).toEqual({ days: null, human: null });
    expect(parseAge("just now")).toEqual({ days: null, human: "just now" });
  });
});

describe("parseJobDetailJson (get-job-by-id endpoint)", () => {
  const data = {
    job_id: 24005,
    job_name: "Golang Backend Developer - BNPL Project",
    job_slug: "https://itnavi.com.vn/job-detail/golang-backend-developer-bnpl-project",
    job_published_at: "Jul 16, 2026",
    job_addresses: "Hồ Chí Minh",
    job_salary: "Thương lượng",
    company_name: "HDBank",
    job_content:
      '<div class="imy-5 paragraph"><p><span>Golang Backend Developer to build the BNPL core &amp; RESTFUL API.</span></p><ul>\n<li><span>Collaborate with cross functional teams</span></li>\n<li><span>Design efficient code</span></li>\n</ul></div>',
    skill: [
      { name: "Golang", slug: "https://itnavi.com.vn/job/golang" },
      { name: "Flutter", slug: "https://itnavi.com.vn/job/flutter" },
    ],
  };

  test("maps every field from the JSON data object", () => {
    const job = parseJobDetailJson(data);
    expect(job.id).toBe("24005");
    expect(job.title).toBe("Golang Backend Developer - BNPL Project");
    expect(job.company).toBe("HDBank");
    expect(job.location).toBe("Hồ Chí Minh");
    expect(job.date).toBe("Jul 16, 2026");
    expect(job.salary).toBe("Thương lượng");
    expect(job.skills).toEqual(["Golang", "Flutter"]);
    expect(job.url).toBe("https://itnavi.com.vn/job-detail/golang-backend-developer-bnpl-project");
    expect(job.description).toContain("Golang Backend Developer");
    expect(job.description).toContain("Collaborate with cross functional teams");
    expect(job.description).toContain("&"); // entity decoded from &amp;
  });

  test("treats a sign-in-gated salary as absent", () => {
    const job = parseJobDetailJson({ ...data, job_salary: "Đăng nhập để xem" });
    expect(job.salary).toBeNull();
  });
});

describe("parseJobDetailHtml (standalone /job-detail/<slug> page)", () => {
  const slug = "senior-backend-developer-python";
  const jobHtml = `
    <div class="hot-jobs-content">
      <h3>Senior Backend Developer (Python)</h3>
      <p class="sub-title">DIGI-TEXX VIETNAM</p>
      <ul><li><span>Lương:</span><a href="https://itnavi.com.vn/login"><strong>Đăng nhập để xem</strong></a></li></ul>
    </div>
    <p class="d-none d-md-block"><span>Ngày đăng: Jul 16, 2026</span></p>
    <ul class="overview">
      <li><i class="fas fa-wallet"></i><p><a href="https://itnavi.com.vn/login"><strong>Đăng nhập để xem</strong></a></p></li>
      <li class="location "><i class="fas fa-circle"></i><p> Hồ Chí Minh , Hồ Chí Minh</p></li>
      <li><i class="fas fa-qrcode"></i><p>ID: 23677</p></li>
    </ul>
    <div class="job-details-content"><h3>Mô tả công việc</h3>
      <div class="content-strip"><div class="imy-5 paragraph"><p>We are seeking a highly skilled Senior Python Developer to join our team.</p></div>
      <div class="imy-5 paragraph"><h2>Yêu cầu công việc</h2><p>3+ years of Python experience.</p></div>
      </div></div>
    <h4>Tags:</h4>
    <div class="job-details-tags"><a href="https://itnavi.com.vn/job/biopython">Biopython</a><a href="https://itnavi.com.vn/job/golang">Golang</a></div>`;

  test("parses a valid job page", () => {
    const job = parseJobDetailHtml(jobHtml, slug)!;
    expect(job).not.toBeNull();
    expect(job.id).toBe("23677");
    expect(job.title).toBe("Senior Backend Developer (Python)");
    expect(job.company).toBe("DIGI-TEXX VIETNAM");
    expect(job.location).toBe("Hồ Chí Minh"); // duplicate collapsed
    expect(job.date).toBe("Jul 16, 2026");
    expect(job.salary).toBeNull(); // login-gated
    expect(job.skills).toEqual(["Biopython", "Golang"]);
    expect(job.url).toBe("https://itnavi.com.vn/job-detail/senior-backend-developer-python");
    expect(job.description).toContain("Senior Python Developer");
    expect(job.description).toContain("3+ years");
    expect(job.description).not.toContain("Tags"); // description stops before the tags block
  });

  test("returns null when the page is not a real job", () => {
    expect(parseJobDetailHtml("<html><body><h1>ITNavi</h1></body></html>", "whatever")).toBeNull();
  });
});

describe("extractSlug / isNumericId", () => {
  test("accepts a full /job-detail URL", () => {
    expect(extractSlug("https://itnavi.com.vn/job-detail/senior-backend-developer-python")).toBe(
      "senior-backend-developer-python",
    );
  });
  test("accepts a bare slug, including a random uniqueness suffix", () => {
    expect(extractSlug("game-developer-O8qvL")).toBe("game-developer-O8qvL");
  });
  test("accepts a /job-detail path", () => {
    expect(extractSlug("/job-detail/golang-backend-developer-bnpl-project")).toBe(
      "golang-backend-developer-bnpl-project",
    );
  });
  test("returns null for a bare numeric id (routed to the JSON endpoint instead)", () => {
    expect(extractSlug("24005")).toBeNull();
  });
  test("isNumericId distinguishes ids from slugs", () => {
    expect(isNumericId("24005")).toBe(true);
    expect(isNumericId(" 24005 ")).toBe(true);
    expect(isNumericId("golang-dev")).toBe(false);
  });
});

describe("hyphenate / slugSegment / buildUrl", () => {
  test("hyphenate normalizes multi-word queries", () => {
    expect(hyphenate("Backend Developer")).toBe("backend-developer");
    expect(hyphenate("  React.js / Next  ")).toBe("react-js-next");
  });

  test("slugSegment takes the last path segment, stripping query/hash", () => {
    expect(slugSegment("https://itnavi.com.vn/job-detail/foo-bar-123?x=1#y")).toBe("foo-bar-123");
    expect(slugSegment("https://itnavi.com.vn/job-detail/foo/")).toBe("foo");
  });

  const base: Omit<SearchOpts, "query" | "location" | "page"> = {
    jobage: 9999,
    enrich: false,
    format: "json",
  };

  test("buildUrl composes keyword + city + pagination (path-based)", () => {
    expect(buildUrl({ ...base, query: "golang", page: 1 })).toBe("https://itnavi.com.vn/job/golang");
    expect(buildUrl({ ...base, query: "backend developer", location: "ha-noi", page: 1 })).toBe(
      "https://itnavi.com.vn/job/backend-developer/ha-noi",
    );
    expect(buildUrl({ ...base, location: "ha-noi", page: 2 })).toBe("https://itnavi.com.vn/job/ha-noi?page=2");
    expect(buildUrl({ ...base, page: 1 })).toBe("https://itnavi.com.vn/job");
  });
});
