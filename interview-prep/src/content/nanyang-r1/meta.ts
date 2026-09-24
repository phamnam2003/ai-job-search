import type { PrepMeta } from '../types';

export const meta: PrepMeta = {
  slug: 'nanyang-r1',
  company: 'Nanyang Biologics Vietnam',
  role: 'Junior Full Stack Engineer — Patient 360',
  round: 'Vòng 1',
  // Wall-clock Hanoi time. Confirmed with HR on 23/09 and unchanged by the
  // 24/09 switch to Google Meet — this is the slot itself, not the time to
  // click Join; being in the Meet room a few minutes early is a roadmap item.
  startsAt: '2026-09-25T10:00',
  dateLabel: 'Thứ 6, 25/09/2026 — 10:00 sáng',
  location: 'Online · Google Meet — cập nhật 24/09, không đến văn phòng nữa',
  format:
    'Người phỏng vấn là anh Thanh, Senior Software Developer — kỹ sư chứ không phải tuyển dụng, nhiều khả năng chính là người sẽ review code của bạn. Vòng 1 vì thế nghiêng hẳn về kỹ thuật; câu hỏi kiểu HR vẫn có thể hỏi, nhưng hỏi ngắn và hỏi thật. Công ty chưa nói thời lượng — cứ chuẩn bị nói liên tục khoảng một tiếng. Công việc thì vẫn onsite ở Trần Xuân Soạn, chỉ buổi phỏng vấn này là online.',
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
    'Xưng hô: gọi "anh", không phải "anh/chị". Đã biết người phỏng vấn là anh Thanh, và nói "anh/chị" với một người mình đã biết tên nghe như đọc kịch bản soạn sẵn.',
    'Anh Thanh là dân kỹ thuật, nên câu trả lời hụt độ sâu sẽ bị hỏi tiếp ngay chứ không trôi. Chỗ nào bạn định nói chung chung cho an toàn thì gọi thẳng tên cơ chế ra — với một người tự tay dựng thứ đó, nói mơ hồ nghe như đang chém.',
    'Chỉ biết một người trong phòng. Nếu có người thứ hai vào — HR ngồi cùng là chuyện bình thường ở vòng 1 — thì đừng khựng: chào lại, rồi trả lời cho người vừa hỏi.',
    'Không có con số lương nào trong app này. Repo là public — hỏi band của họ trước, không tự nêu số.',
  ],
};
