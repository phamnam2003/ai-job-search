import type { PrepMeta } from '../types';

export const meta: PrepMeta = {
  slug: 'nanyang-r1',
  company: 'Nanyang Biologics Vietnam',
  role: 'Junior Full Stack Engineer — Patient 360',
  round: 'Vòng 1',
  // Wall-clock Hanoi time. Confirmed with HR on 23/09 — this is the slot itself,
  // not the "be in the lobby by" time; arriving early is a roadmap item.
  startsAt: '2026-09-25T10:00',
  dateLabel: 'Thứ 6, 25/09/2026 — 10:00 sáng',
  location: 'Onsite · No. 45-57 Trần Xuân Soạn, Hai Bà Trưng, Hà Nội',
  format: 'Round 1, nhiều khả năng là HR + kỹ thuật gộp làm một',
  language: 'Tiếng Việt',
  sources: [
    'documents/applications/nanyang_biologics_vietnam_junior_full_stack_engineer_patient_360/interview_prep_round1.md',
    'documents/applications/nanyang_biologics_vietnam_junior_full_stack_engineer_patient_360/interview_schedule_round1.md',
    'documents/applications/nanyang_biologics_vietnam_junior_full_stack_engineer_patient_360/job_posting.md',
    'company_research/nanyang-biologics-vietnam.json',
    '.claude/skills/job-application-assistant/01-candidate-profile.md',
    '.claude/skills/job-application-assistant/02-behavioral-profile.md',
    '.claude/skills/job-application-assistant/07-interview-prep.md',
  ],
  warnings: [
    'Địa chỉ phải hỏi lại. Có ba địa chỉ NYB ở Hà Nội đang lưu hành: 45-57 Trần Xuân Soạn (trên tin tuyển dụng, là địa chỉ có thẩm quyền cho vị trí này), 82 Phố Thợ Nhuộm (Hoàn Kiếm), và pháp nhân đăng ký ở số 38 ngách 89 Vũ Đức Thận (Long Biên).',
    'Tên và chức danh người phỏng vấn chưa được ghi lại.',
    'Không có con số lương nào trong app này. Repo là public — hỏi band của họ trước, không tự nêu số.',
  ],
};
