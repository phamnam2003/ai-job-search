import { describe, expect, test } from "bun:test"
import { parseJobCards } from "../src/helpers.js"

// Offline card fixture cut down from a live search page (2026-10-30). The live
// location div carries a `title` attribute and an inline icon <svg> before the
// <ul>, which a bare `<div class="location">` match never reached.
const CARD = `<div class="job-item " id="job-item-35C8B92A">
<a class="job_link" title="Backend Developer (Golang)" href="https://careerviet.vn/vi/tim-viec-lam/j.35C8B92A.html">x</a>
<a class="company-name" title="Công ty ABC" href="/vi/nha-tuyen-dung/abc.html">ABC</a>
<div class="salary"><p>Lương<!-- -->: <!-- -->Cạnh tranh</p></div>
<div class="location" title="Hà Nội"><svg width="13" height="14" aria-hidden="true" focusable="false"><path d="M5 3Z" fill="currentColor"></path></svg><ul><li>Hà Nội</li><li>Hồ Chí Minh</li></ul></div>
<div class="time"><ul><li><span>Hạn nộp<!-- -->: </span><time>21-11-2026</time></li><li><span>Cập nhật<!-- -->:</span> <time>28-10-2026</time></li></ul></div>
</div>`

describe("careerviet card fields (offline)", () => {
  test("location is read from a location div that carries attributes", () => {
    const [card] = parseJobCards(CARD)
    expect(card).toBeDefined()
    expect(card.location).toBe("Hà Nội, Hồ Chí Minh")
  })

  test("the other card fields still parse", () => {
    const [card] = parseJobCards(CARD)
    expect(card.title).toBe("Backend Developer (Golang)")
    expect(card.company).toBe("Công ty ABC")
    expect(card.salary).toBe("Cạnh tranh")
  })
})
