import { describe, expect, test } from "bun:test"
import { parseJobDetail } from "../src/helpers.js"

// Offline detail fixture cut down from a live job page (2026-10-30). The live
// headings are "Yêu cầu công việc" and "Quyền lợi ứng viên", not the bare
// "Yêu cầu" / "Quyền lợi" the parser used to require.
const DETAIL = `<html><body><h1></h1><h1>Backend Developer (Golang)</h1>
<h2 class="block-title" data-v-6a2f8de8>
                Mô tả công việc
              </h2> <div class="block-desc" data-v-6a2f8de8>- Phát triển microservice backend<br>
- Viết unit test</div>
<h2 class="block-title" data-v-6a2f8de8>
                Yêu cầu công việc
              </h2> <div class="block-desc" data-v-6a2f8de8>- Tốt nghiệp Đại học CNTT<br>
- 2 năm Golang</div>
<h2 class="block-title" data-v-6a2f8de8>
                Quyền lợi ứng viên
              </h2> <div class="block-desc" data-v-6a2f8de8>- Range thu nhập: Upto 40M<br>
- Thưởng Tết</div>
</body></html>`

describe("devwork detail sections (offline)", () => {
  const job = parseJobDetail(DETAIL, "13629", "https://devwork.vn/viec-lam/13629/j")

  test("requirements are read under the live 'Yêu cầu công việc' heading", () => {
    expect(job.requirements).toBe("- Tốt nghiệp Đại học CNTT\n- 2 năm Golang")
  })

  test("benefits are read under the live 'Quyền lợi ứng viên' heading", () => {
    expect(job.benefits).toBe("- Range thu nhập: Upto 40M\n- Thưởng Tết")
  })

  test("the description still parses", () => {
    expect(job.description).toBe("- Phát triển microservice backend\n- Viết unit test")
  })
})
