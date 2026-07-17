import { describe, test, expect } from "bun:test";
import {
  parseJobCards,
  parseJobDetail,
  parseItemList,
  extractSlug,
  idFromSlug,
  hyphenate,
} from "../src/helpers";
import { buildUrl } from "../src/commands/search";

// A realistic ITviec `.job-card` chunk, mirroring the live markup: the chunk is
// keyed by `data-search--job-selection-job-slug-value=`, the title is an <h3>
// tagged as the jobTitle target, the company is a /companies/ anchor (preceded
// by a logo anchor to the same href that wraps only an image), the location
// follows the map-pin icon, and the salary is sign-in gated.
function card(
  slug: string,
  title: string,
  company = "Acme",
  location = "Ha Noi",
  gated = true,
): string {
  const salary = gated
    ? `<a class="sign-in-view-salary text-reset" href="/sign_in">Sign in to view salary</a>`
    : `You'll love it`;
  return `<div class='job-card' data-job-key='uuid-${slug}'
    data-search--job-selection-job-slug-value='${slug}'
    data-search--job-selection-job-url-value='/it-jobs/${slug}/content'>
    <span class='small-text text-dark-grey'>Posted 1 day ago</span>
    <h3 class='imt-3 text-break' data-search--job-selection-target='jobTitle'
        data-url='https://itviec.com/it-jobs/${slug}'>${title}</h3>
    <a class="bg-white logo-employer-card" href="/companies/acme"><picture><img alt='logo'></picture></a>
    <span class='ims-2'><a class="text-rich-grey" href="/companies/acme">${company}</a></span>
    <div class='salary text-rich-grey'>
      <svg></svg>${salary}
    </div>
    <svg><use href="https://itviec.com/assets/sprite.svg#map-pin"></use></svg>
    <div class='text-rich-grey text-truncate stretched-link' title='${location}'>${location}</div>
    <div data-controller='responsive-tag-list'>
      <a data-responsive-tag-list-target="tag" href="/it-jobs/golang?click_source=Skill+tag">Golang</a>
      <a data-responsive-tag-list-target="tag" href="/it-jobs/kafka?click_source=Skill+tag">Kafka</a>
    </div>
  </div>`;
}

describe("parseJobCards", () => {
  test("parses a well-formed card into all fields", () => {
    const [c] = parseJobCards(card("backend-developer-golang-acme-1234", "Backend Developer (Golang)"));
    expect(c.id).toBe("1234");
    expect(c.title).toBe("Backend Developer (Golang)");
    expect(c.company).toBe("Acme");
    expect(c.companyUrl).toBe("https://itviec.com/companies/acme");
    expect(c.location).toBe("Ha Noi");
    expect(c.date).toBe("Posted 1 day ago");
    expect(c.salary).toBeNull(); // sign-in gated
    expect(c.skills).toEqual(["Golang", "Kafka"]);
    expect(c.url).toBe("https://itviec.com/it-jobs/backend-developer-golang-acme-1234");
  });

  test("preserves leading-zero ids as strings", () => {
    const [c] = parseJobCards(card("software-engineer-gfg-0004", "Software Engineer"));
    expect(c.id).toBe("0004");
  });

  test("decodes decimal and hex HTML entities in the title", () => {
    const [c] = parseJobCards(card("dev-1", "Sm&#xF8;rrebr&#248;d Dev &amp; Ops"));
    expect(c.title).toBe("Smørrebrød Dev & Ops");
  });

  test("parses multiple cards and skips a malformed one", () => {
    const good = card("job-one-11", "Job One");
    // A chunk that opens the split attribute but has no valid slug value.
    const bad = `<div data-search--job-selection-job-slug-value=></div>`;
    const good2 = card("job-two-22", "Job Two");
    const cards = parseJobCards(good + bad + good2);
    expect(cards.map((c) => c.id)).toEqual(["11", "22"]);
  });

  test("captures a visible (non-gated) salary when present", () => {
    const html = `<div data-search--job-selection-job-slug-value='paid-role-9'>
      <h3 data-search--job-selection-target='jobTitle'>Paid Role</h3>
      <div class='salary text-rich-grey'><svg></svg>$1,000 - $2,000</div></div>`;
    const [c] = parseJobCards(html);
    expect(c.salary).toBe("$1,000 - $2,000");
  });

  test("falls back to the ItemList when no cards parse", () => {
    const html = `<script type='application/ld+json'>
      {"@context":"https://schema.org/","@type":"ItemList","itemListElement":[
        {"@type":"ListItem","position":1,"url":"https://itviec.com/it-jobs/senior-golang-dev-masan-5734"}]}
    </script>`;
    const cards = parseJobCards(html);
    expect(cards).toHaveLength(1);
    expect(cards[0].id).toBe("5734");
    expect(cards[0].url).toBe("https://itviec.com/it-jobs/senior-golang-dev-masan-5734");
    expect(cards[0].title).toBe("Senior Golang Dev Masan");
  });
});

describe("parseItemList", () => {
  test("extracts the authoritative job urls", () => {
    const html = `<script type='application/ld+json'>
      {"@type":"ItemList","itemListElement":[
        {"@type":"ListItem","position":1,"url":"https://itviec.com/it-jobs/a-1"},
        {"@type":"ListItem","position":2,"url":"https://itviec.com/it-jobs/b-2"}]}</script>`;
    expect(parseItemList(html)).toEqual([
      "https://itviec.com/it-jobs/a-1",
      "https://itviec.com/it-jobs/b-2",
    ]);
  });

  test("ignores malformed ld+json blocks", () => {
    expect(parseItemList(`<script type='application/ld+json'>{ not json </script>`)).toEqual([]);
  });
});

describe("parseJobDetail", () => {
  const jobHtml = `
    <h2 class='text-it-black'>Backend Developer (Golang)</h2>
    <section class='preview-job-overview'>
      <span class='small-text text-rich-grey'>63 Ngo Thi Nham, Ha Noi</span>
      <span class='small-text text-rich-grey ms-1'>At office</span>
      <span class='small-text text-rich-grey'>2 days ago</span>
      <a class="itag" href="/it-jobs/golang?click_source=Skill+tag">Golang</a>
    </section>
    <section class='reasons-join-us'><h2>Top 3 reasons to join us</h2></section>
    <ul><li>Competitive salary</li></ul>
    <section class='job-description'><h2>Job description</h2>
      <div class='paragraph'><ul><li>Build APIs</li><li>Scale systems</li></ul></div></section>
    <section class='job-experiences'><h2>Your skills and experience</h2>
      <div class='paragraph'><ul><li>3+ years Golang</li></ul></div></section>
    <section class='company-infos'><h2>Acme Corp</h2></section>`;

  test("parses a valid job page", () => {
    const job = parseJobDetail(jobHtml, "backend-developer-golang-acme-1234")!;
    expect(job).not.toBeNull();
    expect(job.id).toBe("1234");
    expect(job.title).toBe("Backend Developer (Golang)");
    expect(job.company).toBe("Acme Corp");
    expect(job.location).toBe("63 Ngo Thi Nham, Ha Noi");
    expect(job.workingModel).toBe("At office");
    expect(job.date).toBe("2 days ago");
    expect(job.skills).toEqual(["Golang"]);
    expect(job.url).toBe("https://itviec.com/it-jobs/backend-developer-golang-acme-1234");
    expect(job.description).toContain("Build APIs");
    expect(job.description).toContain("Competitive salary");
    expect(job.description).toContain("Your skills and experience");
  });

  test("returns null for the ITviec 'Oops' fallback (no job sections)", () => {
    const oops = `<h2>This page has found a better job.</h2><div>Oops!</div>`;
    expect(parseJobDetail(oops, "whatever-4853")).toBeNull();
  });
});

describe("extractSlug", () => {
  test("accepts a bare slug ending in -<id>", () => {
    expect(extractSlug("backend-developer-golang-dnse-4853")).toBe("backend-developer-golang-dnse-4853");
  });
  test("accepts a full itviec url", () => {
    expect(extractSlug("https://itviec.com/it-jobs/backend-developer-golang-dnse-4853")).toBe(
      "backend-developer-golang-dnse-4853",
    );
  });
  test("accepts a /content url", () => {
    expect(extractSlug("https://itviec.com/it-jobs/tech-lead-mdm-golang-2554/content")).toBe(
      "tech-lead-mdm-golang-2554",
    );
  });
  test("rejects a bare numeric id (cannot resolve without the slug)", () => {
    expect(extractSlug("4853")).toBeNull();
  });
});

describe("idFromSlug / hyphenate / buildUrl", () => {
  test("idFromSlug takes the trailing number", () => {
    expect(idFromSlug("senior-backend-engineer-golang-masan-group-5734")).toBe("5734");
    expect(idFromSlug("no-number-here")).toBeNull();
  });

  test("hyphenate normalizes multi-word queries", () => {
    expect(hyphenate("Backend Developer")).toBe("backend-developer");
    expect(hyphenate("  React.js / Next  ")).toBe("react-js-next");
  });

  test("buildUrl composes keyword + city + pagination", () => {
    expect(buildUrl({ query: "golang", jobage: 9999, page: 1, format: "json" })).toBe(
      "https://itviec.com/it-jobs/golang",
    );
    expect(
      buildUrl({ query: "backend developer", location: "ha-noi", jobage: 9999, page: 1, format: "json" }),
    ).toBe("https://itviec.com/it-jobs/backend-developer/ha-noi");
    expect(buildUrl({ location: "ha-noi", jobage: 9999, page: 2, format: "json" })).toBe(
      "https://itviec.com/it-jobs/ha-noi?page=2",
    );
    expect(buildUrl({ jobage: 9999, page: 1, format: "json" })).toBe("https://itviec.com/it-jobs");
  });
});
