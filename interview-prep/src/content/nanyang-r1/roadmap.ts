import type { CutListEntry, RoadmapDay } from '../types';

/**
 * Transcribed from `interview_schedule_round1.md`, then re-planned on 24/09 once
 * the interview was confirmed as a Google Meet call. Durations are the source of
 * truth for the timeline chart, so `m` must always equal `e - s`.
 *
 * Assumptions carried from that file: he works Wed and Thu as normal and
 * evenings are free from ~20:00. The Friday slot is no longer an assumption —
 * HR confirmed 10:00 on 23/09, which is why that morning has a second speaking
 * block where the 09:00 draft only had one.
 *
 * What the online format changes here: Friday morning no longer contains a
 * commute. The 40 minutes that were travel to Trần Xuân Soạn are now a device /
 * room pre-flight plus one rehearsal in front of the webcam, and Thursday night's
 * admin block is a full dry run of the Meet link instead of a route check. Only
 * the INTERVIEW moved online — the job itself is unchanged and still onsite, so
 * nothing outside this file's Friday logistics should be rewritten for it.
 *
 * Settled on 24/09 and no longer carried as open items: the Friday morning is
 * booked off at AIONtech, and the meeting link is pinned in his own mail. Earlier
 * drafts of this file chased both; they are gone rather than softened, because a
 * checklist that keeps re-asking a settled question trains him to skim it.
 *
 * Also confirmed 24/09: the interviewer is Mr. Thanh, Senior Software Developer.
 * That does not move any block on this schedule, but it changes what the Thursday
 * rehearsal blocks are rehearsing FOR — a technical conversation with a peer, not
 * a screening call. The content files carry that; the clock does not.
 *
 * NOTHING IN HERE IS WRITTEN RELATIVE TO NOW. Tags name what a session is for,
 * and prose says "tối 24/09", never "tối nay" — every relative phrase in the
 * first draft had gone stale within a day of being written, and a schedule that
 * is wrong about today is worse than no schedule. Past / running / upcoming is
 * derived from `iso` + the clock at render time; see `src/lib/schedule.ts`.
 */
export const roadmap: RoadmapDay[] = [
  {
    id: 't4',
    label: 'Thứ 4',
    date: '23/09',
    iso: '2026-09-23',
    tag: 'Buổi nền',
    items: [
      {
        s: '20:00',
        e: '20:15',
        m: 15,
        kind: 'admin',
        title: 'Trả lời mail HR',
        info: 'Giờ chốt là 10:00 thứ 6 và buổi phỏng vấn diễn ra qua Google Meet, nên thứ phải khớp trong thư mời là link Meet + giờ, không còn là địa chỉ văn phòng. Câu hỏi về lương đi chung tin nhắn đó.',
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
        info: 'Đọc thôi, chưa luyện. Đánh dấu mọi câu bạn không thể nói ra ngay lúc này — những dấu đó định ưu tiên cho buổi tối 24/09.',
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
    iso: '2026-09-24',
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
        title: 'Chạy thử Meet một lượt',
        info: 'Không còn đường đi nào để kiểm tra, nhưng có một buổi tổng duyệt kỹ thuật — và nó phải xong trong tối 24/09, vì đó là lúc cuối cùng còn thời gian sửa nếu hỏng. Mở thư mời đã pin, bấm đúng link trong đó và vào thử một lượt: camera lên hình, tai nghe CÓ DÂY (loa laptop sẽ vọng tiếng), thử mic, thử luôn chia sẻ màn hình, và sửa tên hiển thị thành "Phạm Hải Nam" chứ không để biệt danh hay địa chỉ mail. Lúc bấm link, nhìn xem trình duyệt đang đăng nhập tài khoản Google nào — phải là tài khoản nhận thư mời; vào nhầm tài khoản thì phía họ trông y hệt như em không đến. Không in gì cả: buổi này không đưa CV cho ai, và thứ duy nhất được phép ra giấy là tờ bốn câu hỏi ngược. Quần áo đủ bộ, kể cả quần dài — có lúc phải đứng lên. 15 phút này chỉ đủ khi mọi thứ chạy ngay; vướng cái gì thì xử lý nốt ngay trong tối đó, đừng để sang sáng.',
        links: [{ label: 'Checklist hậu cần', href: '/hau-can#toi-nay' }],
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
    iso: '2026-09-25',
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
        info: 'Slot 10:00 cho bạn thêm gần một tiếng rưỡi so với bản nháp 09:00 — và đây là chỗ duy nhất đáng tiêu nó. Không phải học thêm: nói to phần mở đầu và một STAR STM, đúng một lượt mỗi câu, để giọng đã ấm sẵn trước khi camera bật. Qua Meet, ngôn ngữ cơ thể gần như mất hết và giọng phải gánh phần còn lại — vào phòng với giọng nguội là mất trắng ba phút đầu. Nói sai chỗ nào thì kệ, không sửa, không làm lại.',
        links: [{ label: 'STM — hiệu năng', href: '/star/stm-performance' }],
      },
      { brk: 'nghỉ 25′' },
      {
        s: '09:05',
        e: '09:25',
        m: 20,
        kind: 'admin',
        title: 'Kiểm tra máy, mạng, phòng',
        info: 'Làm lúc 09:05 chứ không phải 09:45: hỏng cái gì thì bạn còn gần một tiếng để xoay, thay vì năm phút. Mở lại thư mời để lấy đúng link và đối chiếu lại giờ, rồi mở màn hình kiểm tra thiết bị của Meet — chưa bấm vào phòng. Chạy hết mục “Sáng phỏng vấn, trước 9h30” và phần còn sót của “Tối trước ngày phỏng vấn” trong Hậu cần; khối này chỉ giữ chỗ thời gian cho nó. Một thứ không nằm trong checklist: nói với người trong nhà rằng từ 10h em bận một tiếng, cửa đóng.',
        links: [{ label: 'Checklist hậu cần', href: '/hau-can#sang-mai' }],
      },
      { brk: 'nghỉ 10′' },
      {
        s: '09:35',
        e: '09:50',
        m: 15,
        kind: 'speak',
        title: 'Diễn thử trước camera',
        info: 'Một lượt duy nhất, ở màn hình kiểm tra thiết bị của Meet (trang trước khi bấm Tham gia) chứ KHÔNG vào phòng phỏng vấn — vào sớm 25 phút là có lúc họ vào và nghe thấy bạn đang tập. Nói phần mở đầu giới thiệu bản thân, nhìn vào ống kính chứ không nhìn vào khuôn mặt mình trên màn hình. Bạn đang soi ba thứ mà chỉ camera mới chỉ ra được: khung hình (đầu không chạm mép trên, mặt đủ sáng), mắt có rời ống kính khi bí không, và nhịp nói — đường truyền có độ trễ nên phải chậm hơn thường lệ và để hẳn một nhịp sau khi họ dứt câu, đừng nói chồng lên. Một lượt trước camera đáng hơn một lượt đọc lại tài liệu.',
        links: [{ label: 'Bộ ba câu sáng thứ 6', href: '/mo-phong?set=morning' }],
      },
      {
        s: '09:50',
        e: '10:00',
        m: 10,
        kind: 'admin',
        title: 'Vào phòng Meet sớm',
        info: '09:50 dọn bàn: cốc nước, tờ bốn câu hỏi ngược, hết — không tài liệu, không CV mở trên màn hình. 09:55 vào phòng và bật camera ngay: vào sớm năm phút là tín hiệu rẻ nhất bạn có, và nó cũng là năm phút cuối còn kịp phát hiện mic câm. Ngồi thẳng, thở ra một hơi dài trước khi họ vào.',
        links: [{ label: 'Câu hỏi ngược', href: '/cong-ty#hoi-nguoc' }],
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
        when: '09:55',
        what: 'Vào phòng sớm 5 phút, KHÔNG mở lại tài liệu',
        note: 'Phỏng vấn ở nhà thì tài liệu nằm trong tầm với — đó chính là cái bẫy. Đọc trên màn hình lộ ra ngay ở mắt đảo ngang và giọng đọc thuộc, và ống kính phóng đại cả hai. Thứ duy nhất được nằm trước mặt là tờ bốn câu hỏi ngược.',
      },
      {
        when: 'Trong ngày',
        what: 'Ghi lại mọi câu họ hỏi, rồi gửi thư cảm ơn',
        note: 'Ghi trong vòng 2 tiếng khi còn nhớ — feedback vòng 1 là đầu vào giá trị nhất cho vòng 2. Sau đó chạy /outcome nanyang.',
      },
      {
        when: 'Nếu rớt mạng',
        what: 'Vào lại phòng ngay, rồi nhắn vào đúng luồng mail mời',
        note: 'Mở sẵn luồng mail đó ở một tab trước 10:00. Rớt 30 giây rồi vào lại thì không ai chấm điểm; im lặng năm phút mới là vấn đề. Mạng chính không lên lại thì chuyển sang 4G điện thoại — đã bật sẵn từ 09:05.',
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
