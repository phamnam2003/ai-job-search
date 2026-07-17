import { describe, test, expect } from "bun:test";
import {
  parseJobCards,
  parseJobDetail,
  idFromUrl,
  resolveCity,
  estimateDays,
  resolveDetailTarget,
  hyphenate,
} from "../src/helpers";
import { buildUrl } from "../src/commands/search";

// A realistic TopCV `.job-item-search-result` chunk, mirroring the live markup:
// the container class is the split key, the id is the `data-job-id` attribute,
// the title is the <h3 class="title"> anchor (a tooltip span), the company is
// the .company-name span, salary/location/freshness live in the .info block.
function card(
  id: string,
  title: string,
  {
    company = "Acme Corp",
    companyUrl = "https://www.topcv.vn/cong-ty/acme/123.html",
    salary = "Thoả thuận",
    city = "Hà Nội",
    date = "2 tuần trước",
    brand = false,
    slug = "backend-developer",
  }: Partial<{
    company: string;
    companyUrl: string;
    salary: string;
    city: string;
    date: string;
    brand: boolean;
    slug: string;
  }> = {},
): string {
  const url = brand
    ? `https://www.topcv.vn/brand/acme/tuyen-dung/${slug}-j${id}.html`
    : `https://www.topcv.vn/viec-lam/${slug}/${id}.html`;
  return `<div class="job-item-search-result  bg-highlight "
    data-job-id="${id}" data-job-position="1">
    <div class="avatar">
      <a aria-label="${title}" target="_blank" href="${url}?ta_source=JobSearchList">
        <img data-src="logo.jpg" class="w-100 lazy" alt="${company}">
      </a>
    </div>
    <div class="body">
      <div class="body-content">
        <div class="title-block"><div>
          <h3 class="title  highlight ">
            <div class="box-label-top"></div>
            <a target="_blank" class="highlight" href="${url}?ta_source=JobSearchList">
              <span data-toggle="tooltip" data-container="body" title="${title}">${title}</span>
            </a>
          </h3>
          <a class="company job-pro" href="${companyUrl}" target="_blank">
            <div class="job-pro-wrap"><span class="job-pro-icon">Pro</span></div>
            <span class="company-name" data-toggle="tooltip" title="${company}">${company}</span>
          </a>
        </div></div>
      </div>
      <div class="info"><div class="label-content">
        <label class="salary"><span> ${salary} </span></label>
        <label class="address mobile-hidden label-update" data-toggle="tooltip"
               title="Cập nhật 11 phút trước"><span class="hidden-on-quick-view">Đăng </span> ${date} </label>
        <label class="address truncate" data-toggle="tooltip" title="tooltip">
          <span class="city-text"> ${city} </span>
        </label>
        <label class="exp"><span> 1 năm </span></label>
      </div></div>
    </div>
  </div>`;
}

describe("parseJobCards", () => {
  test("parses a well-formed viec-lam card into all fields", () => {
    const [c] = parseJobCards(card("2231500", "Backend Developer"));
    expect(c.id).toBe("2231500");
    expect(c.title).toBe("Backend Developer");
    expect(c.company).toBe("Acme Corp");
    expect(c.companyUrl).toBe("https://www.topcv.vn/cong-ty/acme/123.html");
    expect(c.location).toBe("Hà Nội");
    expect(c.salary).toBe("Thoả thuận");
    expect(c.date).toBe("Đăng 2 tuần trước");
    expect(c.url).toBe("https://www.topcv.vn/viec-lam/backend-developer/2231500.html");
  });

  test("parses a brand-shape card and strips the tracking query from the url", () => {
    const [c] = parseJobCards(
      card("2230618", "Senior Java Developer", { brand: true, slug: "senior-java-developer-id8016" }),
    );
    expect(c.id).toBe("2230618");
    expect(c.url).toBe(
      "https://www.topcv.vn/brand/acme/tuyen-dung/senior-java-developer-id8016-j2230618.html",
    );
  });

  test("decodes decimal/hex/named HTML entities in the title", () => {
    const [c] = parseJobCards(card("1", "C&#43;&#43; Dev &amp; Sm&#xF8;rrebr&#248;d"));
    expect(c.title).toBe("C++ Dev & Smørrebrød");
  });

  test("parses multiple cards and skips one with no data-job-id", () => {
    const good = card("11", "Job One");
    const bad = `<div class="job-item-search-result">no id here</div>`;
    const good2 = card("22", "Job Two");
    const cards = parseJobCards(good + bad + good2);
    expect(cards.map((c) => c.id)).toEqual(["11", "22"]);
  });

  test("captures a numeric salary range verbatim", () => {
    const [c] = parseJobCards(card("9", "Paid Role", { salary: "20 - 30 triệu" }));
    expect(c.salary).toBe("20 - 30 triệu");
  });

  test("multi-city location text is preserved", () => {
    const [c] = parseJobCards(card("7", "Role", { city: "Hà Nội, Hồ Chí Minh" }));
    expect(c.location).toBe("Hà Nội, Hồ Chí Minh");
  });
});

describe("idFromUrl", () => {
  test("brand shape: digits after -j", () => {
    expect(
      idFromUrl("https://www.topcv.vn/brand/vpbank/tuyen-dung/senior-java-developer-id8016-j2230618.html"),
    ).toBe("2230618");
  });
  test("viec-lam shape: trailing numeric id", () => {
    expect(idFromUrl("https://www.topcv.vn/viec-lam/backend-developer/2231500.html")).toBe("2231500");
  });
  test("no id found", () => {
    expect(idFromUrl("https://www.topcv.vn/tim-viec-lam-backend")).toBeNull();
  });
});

describe("resolveCity", () => {
  test("canonical slugs resolve to TopCV kl ids", () => {
    expect(resolveCity("ha-noi")).toEqual({ slug: "ha-noi", id: 1 });
    expect(resolveCity("ho-chi-minh")).toEqual({ slug: "ho-chi-minh", id: 2 });
    expect(resolveCity("da-nang")).toEqual({ slug: "da-nang", id: 8 });
  });
  test("accent + shorthand aliases resolve", () => {
    expect(resolveCity("Hà Nội")).toEqual({ slug: "ha-noi", id: 1 });
    expect(resolveCity("hcm")).toEqual({ slug: "ho-chi-minh", id: 2 });
    expect(resolveCity("saigon")).toEqual({ slug: "ho-chi-minh", id: 2 });
  });
  test("unknown city returns null (client-side fallback upstream)", () => {
    expect(resolveCity("atlantis")).toBeNull();
  });
});

describe("estimateDays", () => {
  test("weeks/days/months convert to approximate days", () => {
    expect(estimateDays("Đăng 2 tuần trước")).toBe(14);
    expect(estimateDays("3 ngày trước")).toBe(3);
    expect(estimateDays("1 tháng trước")).toBe(30);
  });
  test("minutes/hours/today are 0 days", () => {
    expect(estimateDays("5 giờ trước")).toBe(0);
    expect(estimateDays("30 phút trước")).toBe(0);
    expect(estimateDays("Hôm nay")).toBe(0);
  });
  test("unparseable / null returns null (card kept when filtering)", () => {
    expect(estimateDays("who knows")).toBeNull();
    expect(estimateDays(null)).toBeNull();
  });
});

describe("resolveDetailTarget", () => {
  test("accepts a full viec-lam url", () => {
    const t = resolveDetailTarget("https://www.topcv.vn/viec-lam/backend-developer/2231500.html");
    expect(t).toEqual({
      url: "https://www.topcv.vn/viec-lam/backend-developer/2231500.html",
      id: "2231500",
    });
  });
  test("accepts a full brand url", () => {
    const t = resolveDetailTarget(
      "https://www.topcv.vn/brand/vpbank/tuyen-dung/senior-java-developer-id8016-j2230618.html",
    );
    expect(t?.id).toBe("2230618");
  });
  test("reconstructs a bare numeric id via the slug-agnostic viec-lam shape", () => {
    expect(resolveDetailTarget("2231500")).toEqual({
      url: "https://www.topcv.vn/viec-lam/j/2231500.html",
      id: "2231500",
    });
  });
  test("rejects non-url, non-numeric garbage", () => {
    expect(resolveDetailTarget("backend developer")).toBeNull();
  });
});

describe("parseJobDetail", () => {
  const jobHtml = `
    <title>Tuyển Backend Developer làm việc tại Acme Corp lương Thoả thuận</title>
    <h1 class="box-header-job__title">
      <a href="https://www.topcv.vn/tim-viec-lam-backend">Backend Developer</a>
      <span class="icon-verified-employer level-five"><i title="Nhà tuyển dụng đã được xác thực"></i></span>
    </h1>
    <div class="box-header-job__salary"> Thoả thuận </div>
    <div class="box-header-job-list-info__item">
      <svg><path d="M0"/></svg>
      <div class="box-header-job-list-info__item--title">Địa điểm</div>
      <div class="box-header-job-list-info__item--content">Hà Nội</div>
    </div>
    <div class="box-header-job-list-info__item">
      <svg></svg>
      <div class="box-header-job-list-info__item--title">Hạn ứng tuyển</div>
      <div class="box-header-job-list-info__item--content">08/08/2026</div>
    </div>
    <a href="https://www.topcv.vn/cong-ty/acme/123.html" target="_blank">Acme Corp</a>
    <div class="box-job-information-detail-item">
      <div class="box-job-information-detail-item__title"><h2 class="box-job-information-detail-item__title--title">Mô tả công việc</h2></div>
      <div class="box-job-information-detail-item__text"><ul><li>Build APIs</li><li>Scale systems</li></ul></div>
    </div>
    <div class="box-job-information-detail-item box-job-information-required-candidate">
      <div class="box-job-information-detail-item__title"><h2 class="box-job-information-detail-item__title--title">Yêu cầu ứng viên</h2></div>
      <div class="box-job-information-detail-item__text"><ul><li>3+ years Go</li></ul></div>
    </div>
    <div class="box-job-information-detail-item">
      <div class="box-job-information-detail-item__title"><h2 class="box-job-information-detail-item__title--title">Quyền lợi ứng viên</h2></div>
      <div class="box-job-information-detail-item__text"><ul><li>Lương tháng 13</li></ul></div>
    </div>`;

  test("parses a valid job page (viec-lam url)", () => {
    const job = parseJobDetail(jobHtml, "https://www.topcv.vn/viec-lam/backend-developer/2231500.html")!;
    expect(job).not.toBeNull();
    expect(job.id).toBe("2231500");
    expect(job.title).toBe("Backend Developer"); // verified-employer badge stripped
    expect(job.company).toBe("Acme Corp");
    expect(job.companyUrl).toBe("https://www.topcv.vn/cong-ty/acme/123.html");
    expect(job.salary).toBe("Thoả thuận");
    expect(job.location).toBe("Hà Nội");
    expect(job.deadline).toBe("08/08/2026");
    expect(job.description).toContain("Build APIs");
    expect(job.description).toContain("Scale systems");
    expect(job.requirements).toContain("3+ years Go");
    expect(job.benefits).toContain("Lương tháng 13");
  });

  test("returns null when the page carries no job sections", () => {
    expect(parseJobDetail("<h1>Some unrelated page</h1>", "https://www.topcv.vn/viec-lam/x/999.html")).toBeNull();
  });
});

describe("buildUrl / hyphenate", () => {
  test("keyword only", () => {
    expect(buildUrl({ query: "backend", jobage: 9999, page: 1, format: "json" })).toBe(
      "https://www.topcv.vn/tim-viec-lam-backend",
    );
  });
  test("multi-word keyword is hyphenated", () => {
    expect(buildUrl({ query: "backend developer", jobage: 9999, page: 1, format: "json" })).toBe(
      "https://www.topcv.vn/tim-viec-lam-backend-developer",
    );
  });
  test("keyword + resolvable city appends the -tai-<slug>-kl<id> filter", () => {
    expect(
      buildUrl({ query: "golang", location: "ha-noi", jobage: 9999, page: 1, format: "json" }),
    ).toBe("https://www.topcv.vn/tim-viec-lam-golang-tai-ha-noi-kl1");
  });
  test("unknown city is NOT put in the slug (client-side filter handles it)", () => {
    expect(
      buildUrl({ query: "golang", location: "atlantis", jobage: 9999, page: 1, format: "json" }),
    ).toBe("https://www.topcv.vn/tim-viec-lam-golang");
  });
  test("no query defaults the keyword to 'it'; page adds ?page", () => {
    expect(buildUrl({ jobage: 9999, page: 2, format: "json" })).toBe(
      "https://www.topcv.vn/tim-viec-lam-it?page=2",
    );
  });
  test("hyphenate normalizes punctuation", () => {
    expect(hyphenate("React.js / Next")).toBe("react-js-next");
  });
});
