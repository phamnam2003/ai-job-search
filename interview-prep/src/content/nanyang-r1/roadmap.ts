import type { CutListEntry, RoadmapDay } from '../types';

/**
 * Transcribed from `interview_schedule_round1.md`. Durations are the source of
 * truth for the timeline chart, so `m` must always equal `e - s`.
 *
 * Assumptions carried from that file: he works Wed and Thu as normal and
 * evenings are free from ~20:00. The Friday slot is no longer an assumption —
 * HR confirmed 10:00 on 23/09, which is why that morning has a second speaking
 * block where the 09:00 draft only had one.
 */
export const roadmap: RoadmapDay[] = [
  {
    id: 't4',
    label: 'Thứ 4',
    date: '23/09',
    tag: 'Tối nay',
    items: [
      {
        s: '20:00',
        e: '20:15',
        m: 15,
        kind: 'admin',
        title: 'Trả lời mail HR',
        info: 'Giờ đã chốt: 10:00 thứ 6. Còn hai việc trong một tin nhắn ngắn: xác nhận địa chỉ (có ba địa chỉ NYB ở Hà Nội đang lưu hành — đừng mặc định Trần Xuân Soạn), và trả lời câu hỏi về lương. Gửi tối nay; trả lời trưa mai là muộn khi phỏng vấn vào thứ 6.',
        links: [{ label: 'Câu hỏi về lương', href: '/cau-hoi?cat=hr' }],
      },
      {
        s: '20:15',
        e: '20:45',
        m: 30,
        kind: 'write',
        title: 'Viết STAR Kubernetes',
        info: 'Khung S/T/A/R này vẫn rỗng trong 07-interview-prep.md, và nó là câu trả lời tốt nhất cho gap managed cloud — câu chuyện duy nhất tạo khác biệt ở một công ty chạy Equinix colocation chứ không phải hyperscaler. Hai ranh giới phải tự nói ra: hạ tầng tự dựng chứ không phải production ops ở quy mô lớn; và không để nó biến buổi phỏng vấn thành phỏng vấn DevOps.',
        links: [{ label: 'STAR Kubernetes', href: '/star/k8s-vmware' }],
      },
      {
        s: '20:45',
        e: '21:15',
        m: 30,
        kind: 'read',
        title: 'Đọc hết một lượt',
        info: 'Đọc thôi, chưa luyện. Đánh dấu mọi câu bạn không thể nói ra ngay lúc này — những dấu đó định ưu tiên cho tối mai.',
        links: [
          { label: 'Kiến thức kỹ thuật', href: '/ky-thuat' },
          { label: 'Ngân hàng câu hỏi', href: '/cau-hoi' },
        ],
      },
      {
        s: '21:15',
        e: '22:00',
        m: 45,
        kind: 'speak',
        title: 'Cặp STAR về STM',
        info: 'Nói thành tiếng, ba lượt mỗi câu: mở đầu giới thiệu bản thân, STAR STM hiệu năng, STAR STM tính đúng đắn. Mở bằng sự cố — “luồng export bị OOM-kill, có lúc không sinh ra được file nào” — chứ không phải “em tối ưu export”.',
        links: [
          { label: 'STM — hiệu năng', href: '/star/stm-performance' },
          { label: 'STM — tính đúng đắn', href: '/star/stm-correctness' },
        ],
      },
    ],
    extras: [
      {
        when: '22:00',
        what: 'Dừng lại, đi ngủ',
        note: 'Ngủ đáng giá hơn một lượt luyện thứ tư.',
      },
    ],
  },
  {
    id: 't5',
    label: 'Thứ 5',
    date: '24/09',
    tag: 'Buổi chính',
    items: [
      {
        s: '12:30',
        e: '12:45',
        m: 15,
        kind: 'speak',
        title: 'Nhẩm 3 câu',
        info: 'Trên đường đi làm hoặc giờ nghỉ trưa, không cần laptop: câu ranh giới graph database, câu về identity resolution, câu về mốc thời gian tốt nghiệp. Nhẩm đến khi bật ra không cần nghĩ.',
        links: [{ label: 'Ba câu này', href: '/mo-phong?set=micro' }],
      },
      { brk: 'nghỉ 7h15' },
      {
        s: '20:00',
        e: '20:40',
        m: 40,
        kind: 'speak',
        title: 'Bốn câu về gap',
        info: 'NestJS · graph database · chuẩn y tế · managed cloud. Chính lá thư của bạn đã khai ra bốn cái này và họ vẫn mời — nghĩa là họ đã đọc. Với graph: nói “chưa từng dùng” trước, rõ ràng, rồi mới bắc cầu sang ScyllaDB.',
        links: [{ label: 'Câu hỏi về gap', href: '/cau-hoi?cat=gap' }],
      },
      {
        s: '20:40',
        e: '21:20',
        m: 40,
        kind: 'speak',
        title: 'Các câu hỏi khó',
        info: 'Theo thứ tự: sao ứng tuyển Junior · tại sao NYB · rời AIONtech · điểm yếu (chọn code review, KHÔNG chọn tiếng Anh) · 5 năm nữa.',
        links: [{ label: 'Câu hỏi khó', href: '/cau-hoi?cat=tough' }],
      },
      {
        s: '21:20',
        e: '21:45',
        m: 25,
        kind: 'read',
        title: 'Tự kiểm tra hồ sơ',
        info: 'Che đáp án và trả lời từ trí nhớ: mỗi claim trên giấy của bạn, nếu bị hỏi sâu thì nói gì. Hai chỗ phải chuẩn — heading “data isolation” và đồ án tốt nghiệp.',
        links: [{ label: 'Hồ sơ nhất quán', href: '/ho-so' }],
      },
      {
        s: '21:45',
        e: '22:00',
        m: 15,
        kind: 'speak',
        title: 'Câu hỏi ngược',
        info: 'Chọn 4 trong 6 và nói thành tiếng. Giữ câu 1 (Patient 360 nằm đâu trong ba trụ cột) và câu 2 (ai quyết định schema) — hai câu đó quyết định bạn có muốn nhận việc này không.',
        links: [{ label: 'Câu hỏi ngược', href: '/cong-ty#hoi-nguoc' }],
      },
      {
        s: '22:00',
        e: '22:15',
        m: 15,
        kind: 'admin',
        title: 'In CV, soạn đồ',
        info: 'In HAI bản CV bạn đã gửi — bản tùy chỉnh trong submissions/, không phải bản cũ. Quần áo, sạc điện thoại, kiểm tra đường đi theo địa chỉ HR đã xác nhận.',
      },
    ],
    extras: [
      {
        when: '23:00',
        what: 'Tắt đèn',
        note: 'Không thương lượng — bạn phỏng vấn buổi sáng.',
      },
    ],
  },
  {
    id: 't6',
    label: 'Thứ 6',
    date: '25/09',
    tag: 'Ngày phỏng vấn',
    items: [
      {
        s: '07:00',
        e: '07:25',
        m: 25,
        kind: 'speak',
        title: 'Ôn nhẹ, 3 câu',
        info: 'Không học thêm gì mới. Đúng ba câu, mỗi câu một lần: mở đầu STM, câu Junior/Experienced, câu ranh giới graph database.',
        links: [{ label: 'Bộ ba câu sáng thứ 6', href: '/mo-phong?set=morning' }],
      },
      { brk: 'nghỉ 50′' },
      {
        s: '08:15',
        e: '08:40',
        m: 25,
        kind: 'speak',
        title: 'Khởi động giọng',
        info: 'Slot 10:00 cho bạn thêm gần một tiếng rưỡi so với bản nháp 09:00 — và đây là chỗ duy nhất đáng tiêu nó. Không phải học thêm: nói to phần mở đầu và một STAR STM, đúng một lượt mỗi câu, để giọng đã ấm trước khi bước vào phòng. Nói sai chỗ nào thì kệ, không sửa, không làm lại.',
        links: [{ label: 'STM — hiệu năng', href: '/star/stm-performance' }],
      },
      { brk: 'nghỉ 15′' },
      {
        s: '08:55',
        e: '09:35',
        m: 40,
        kind: 'admin',
        title: 'Di chuyển',
        info: 'Đi lúc 08:55 là đã qua đỉnh giờ cao điểm, nhưng vẫn để nguyên 40 phút vào Hai Bà Trưng — thà ngồi chờ 25 phút còn hơn chạy vội. Đến nơi thì ngồi gần đó, KHÔNG đọc lại tài liệu, chỉ xem bốn câu hỏi ngược của bạn.',
      },
    ],
    cap: { t: '10:00', n: 'Vào phỏng vấn' },
    extras: [
      {
        when: '07:25',
        what: 'Ăn sáng tử tế, tắm, mặc đồ',
        note: 'Bạn sẽ nói liên tục khoảng một tiếng. Trong khoảng này đừng mở tài liệu ra lần nào.',
      },
      {
        when: '09:35',
        what: 'Đến sớm 25 phút, KHÔNG đọc lại tài liệu',
        note: 'Đọc lại lúc này chỉ khiến bạn đọc thuộc thay vì trò chuyện. Chỉ xem bốn câu hỏi ngược.',
      },
      {
        when: 'Trong ngày',
        what: 'Ghi lại mọi câu họ hỏi, rồi gửi thư cảm ơn',
        note: 'Ghi trong vòng 2 tiếng khi còn nhớ — feedback vòng 1 là đầu vào giá trị nhất cho vòng 2. Sau đó chạy /outcome nanyang.',
      },
    ],
  },
];

export const cutList: CutListEntry[] = [
  {
    rank: 1,
    title: 'STAR STM — tính đúng đắn dữ liệu',
    why: 'Must-have họ ghi rõ, CV bạn có claim, mà bạn chưa luyện lần nào. Đây là chỗ dễ trả lời hời hợt nhất cho một câu bạn thừa sức trả lời hay.',
  },
  {
    rank: 2,
    title: 'Bốn câu trả lời về gap',
    why: 'Chính lá thư của bạn đã khai ra, và họ vẫn mời. Nghĩa là họ đã đọc. Gần như chắc chắn sẽ hỏi.',
  },
  {
    rank: 3,
    title: '“Sao ứng tuyển Junior khi đã 3 năm?”',
    why: 'Câu hỏi của riêng đơn này. Trước đây không có câu trả lời mẫu nào; câu hiện tại là mới viết và chưa luyện.',
  },
  {
    rank: 4,
    title: 'STAR STM hiệu năng + mở đầu',
    why: 'Câu chuyện duy nhất có số liệu cứng. Nội dung đã tốt rồi — cần cách nói, không cần xây lại.',
  },
  {
    rank: 5,
    title: 'Tại sao NYB · rời AIONtech · điểm yếu',
    why: 'Đã chuẩn bị và đã nằm trên giấy. Mỗi câu một lượt là đủ.',
  },
  {
    rank: 6,
    title: 'Chọn 4 câu hỏi ngược',
    why: 'Ít công, tín hiệu cao. Làm cuối cùng cũng được.',
  },
];
