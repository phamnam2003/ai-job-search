import type { LogisticsItem } from '../types';

/**
 * The remote pre-flight checklist for round 1.
 *
 * Authored on 2026-09-24, the evening the round moved from the Trần Xuân Soạn
 * office to Google Meet. Only the INTERVIEW moved — the job itself is still
 * onsite five days a week, so nothing in here may be read as the role going
 * remote.
 *
 * Selection rule for every row: it has to be something he could get wrong
 * tomorrow, with a consequence a reader can name. Generic "be prepared" advice
 * was left out. `critical` is deliberately rare — six of these actually cost him
 * the interview; if everything were marked, the mark would say nothing.
 *
 * Nothing here is `unresolved` any more. Two rows were, on the evening this was
 * written: where he would sit at 10:00, and whether he had the meeting link. He
 * settled both the same evening — the morning is booked off at AIONtech and the
 * link is pinned in his own mail — so they are gone rather than restated as
 * questions. The flag stays in the type because a future round will need it.
 *
 * The link, the interviewer's phone number and any invitation wording are NOT in
 * this repo and are not invented here; it is public.
 */
export const logistics: LogisticsItem[] = [
  /* --- tối nay (thứ 5, 24/09) --------------------------------------------- */
  {
    id: 'dung-tai-khoan-google',
    when: 'toi-nay',
    what: 'Mở thư mời đã pin, bấm thử link một lượt tối nay và nhìn xem trình duyệt đang đăng nhập tài khoản Google nào — phải là tài khoản nhận được thư mời.',
    why: 'Vào nhầm tài khoản thì phía họ trông y hệt như em không đến, và nó chỉ lộ ra khi em đã ngồi trong phòng chờ — lúc đó không còn thời gian để sửa.',
    critical: true,
    unresolved: false,
  },
  {
    id: 'tai-nghe-co-day',
    when: 'toi-nay',
    what: 'Lấy tai nghe có dây ra, cắm vào máy sẽ dùng, thu thử 30 giây rồi nghe lại chính giọng mình.',
    why: 'Loa laptop tạo tiếng vọng và làm máy tự cắt tiếng khi hai bên cùng nói — âm thanh hỏng thì nội dung hay đến mấy cũng không tới được người nghe.',
    critical: true,
    unresolved: false,
  },
  {
    id: 'cat-het-ghi-chu',
    when: 'toi-nay',
    what: 'Cất hết ghi chú câu trả lời: đóng file, đóng tab, gỡ giấy dán quanh màn hình. Thứ duy nhất được phép nằm trên bàn là tờ 4 câu hỏi ngược.',
    why: 'Ngồi ở nhà thì lần đầu tiên em đọc được ghi chú — và đó chính là cái bẫy: mắt chạy ngang màn hình, câu trả lời ra giọng đọc bài, người đối diện nhận ra trước khi em nói hết câu.',
    critical: true,
    unresolved: false,
  },
  {
    id: 'bon-cau-hoi-ra-giay',
    when: 'toi-nay',
    what: 'Chép tay hoặc in đúng 4 câu hỏi ngược ra một tờ giấy, đặt cạnh máy.',
    why: 'Đây là ngoại lệ duy nhất của luật trên: hỏi lại là phần dễ mất điểm nhất vì quên, mà nhìn xuống một tờ giấy bốn dòng thì không giống đang đọc bài.',
    critical: false,
    unresolved: false,
  },
  {
    id: 'ten-hien-thi-meet',
    when: 'toi-nay',
    what: 'Kiểm tra tên hiển thị của tài khoản Google sẽ dùng để vào phòng — phải đọc ra là "Phạm Hải Nam". Nếu vào mà không đăng nhập, Meet sẽ hỏi tên: gõ đúng họ tên, không gõ biệt danh.',
    why: 'Tên đó nằm dưới khung hình em suốt buổi và là thứ họ đối chiếu với CV; một biệt danh hay một chuỗi email lạ bắt họ phải đoán ai vừa vào phòng.',
    critical: false,
    unresolved: false,
  },
  {
    id: 'dung-goc-may-anh-sang',
    when: 'toi-nay',
    what: 'Dựng sẵn chỗ ngồi tối nay: kê laptop lên sách cho camera ngang tầm mắt, để đèn hoặc cửa sổ ở phía trước mặt, phía sau lưng là mảng tường gọn.',
    why: 'Camera thấp hơn mặt cho góc nhìn hất từ dưới lên, còn cửa sổ sau lưng biến mặt em thành một vệt tối — cả buổi họ nói chuyện với một cái bóng.',
    critical: false,
    unresolved: false,
  },
  {
    id: 'mang-du-phong-4g',
    when: 'toi-nay',
    what: 'Kiểm tra điện thoại còn dung lượng 4G, bật thử chế độ phát wifi một lần và cho laptop kết nối vào để biết chắc nó vào được.',
    why: 'Phương án dự phòng chưa bao giờ bật thử thì lúc mạng chính chết nó chỉ là một ý định, không phải một phương án.',
    critical: false,
    unresolved: false,
  },
  {
    id: 'sac-may-va-dien-thoai',
    when: 'toi-nay',
    what: 'Cắm sạc laptop vào điện và cắm sạc điện thoại qua đêm.',
    why: 'Máy tụt pin giữa buổi là mất kết nối đúng vào lúc cái điện thoại hết pin cũng không báo lại được cho ai.',
    critical: false,
    unresolved: false,
  },

  /* --- sáng mai, trước 9h30 ------------------------------------------------ */
  {
    id: 'dung-40-phut-khong-phai-di-duong',
    when: 'sang-mai',
    what: 'Phần nói thành tiếng của sáng mai nằm ở hai khối đã có trong lộ trình: 08:15–08:40 nói to phần mở đầu và STAR số 1 một lượt, rồi 09:35–09:50 diễn lại đúng phần mở đầu trước camera. Đừng lấp quãng trống còn lại bằng tài liệu mới.',
    why: 'Buổi online trả lại quãng đi đường, nhưng lộ trình đã tiêu nó vào tiền trạm thiết bị lúc 09:05 — không có khối 40 phút tự do nào để luyện thêm, và đi tìm nó thì chỉ lỡ mất hai khối trên.',
    critical: false,
    unresolved: false,
  },
  {
    id: 'mac-do-day-du',
    when: 'sang-mai',
    what: 'Mặc nguyên bộ như đi phỏng vấn trực tiếp, kể cả phần dưới.',
    why: 'Chỉnh tề mỗi nửa trên là đánh cược rằng suốt một tiếng không có lý do nào khiến em phải đứng dậy.',
    critical: false,
    unresolved: false,
  },
  {
    id: 'tat-thong-bao-hai-may',
    when: 'sang-mai',
    what: 'Bật Do Not Disturb trên cả laptop và điện thoại; thoát Zalo, Telegram và mail trên máy sẽ dùng. Điện thoại để im lặng, úp màn hình xuống, nhưng vẫn trong tầm với.',
    why: 'Một thông báo nhảy lên giữa lúc đang chia sẻ màn hình là thứ không rút lại được — nhưng tắt hẳn điện thoại thì mất luôn đường dây dự phòng, nên là im lặng chứ không phải tắt nguồn.',
    critical: false,
    unresolved: false,
  },
  {
    id: 'don-man-hinh-truoc-khi-share',
    when: 'sang-mai',
    what: 'Đóng hết tab và cửa sổ không liên quan. Mở sẵn đúng những gì muốn cho xem: github.com/phamnam2003 và phần kiến thức trong app này.',
    why: 'Họ có thể xin xem GitHub hoặc code; lúc đó màn hình em là một phần hồ sơ, và một desktop đầy tab lạ nói về em nhiều hơn em định nói.',
    critical: false,
    unresolved: false,
  },
  {
    id: 'tat-thu-an-bang-thong',
    when: 'sang-mai',
    what: 'Tắt những thứ ăn băng thông: đồng bộ cloud, tải cập nhật, và người khác trong nhà đang xem video.',
    why: 'Mạng nhà đủ cho một cuộc gọi video, không đủ cho một cuộc gọi video cộng một bản cập nhật vài GB tải nền.',
    critical: false,
    unresolved: false,
  },

  /* --- 9h50 – 10h00 -------------------------------------------------------- */
  {
    id: 'thu-mic-camera-trong-meet',
    when: 'truoc-gio',
    what: 'Vào phần cài đặt âm thanh của Meet, chọn đúng tai nghe làm micro và loa, thu thử một câu rồi nghe lại.',
    why: 'Meet mặc định lấy thiết bị của hệ thống chứ không lấy cái tai nghe em vừa cắm — thử tai nghe tối qua không có nghĩa là Meet đang dùng nó.',
    critical: false,
    unresolved: false,
  },
  {
    id: 'vao-phong-som-5-phut',
    when: 'truoc-gio',
    what: '9h55 vào phòng, bật camera, kiểm tra khung hình và ánh sáng lần cuối rồi ngồi yên chờ.',
    why: 'Năm phút đó là lúc duy nhất còn sửa được hình và tiếng mà không ai nhìn; vào đúng 10h00 là vào cùng lúc với người phỏng vấn, mọi thứ lệch đều phơi ra.',
    critical: true,
    unresolved: false,
  },
  {
    id: 'nuoc-va-nha-ve-sinh',
    when: 'truoc-gio',
    what: 'Đi vệ sinh, để một cốc nước trong tầm tay ngoài khung hình.',
    why: 'Một tiếng nói gần như liên tục làm khô họng nhanh hơn em tưởng, và trên Meet thì không có cái cớ tự nhiên nào để rời chỗ.',
    critical: false,
    unresolved: false,
  },

  /* --- trong buổi ---------------------------------------------------------- */
  {
    id: 'cho-mot-nhip-moi-noi',
    when: 'trong-buoi',
    what: 'Đợi trọn một nhịp sau khi họ dứt câu rồi mới bắt đầu trả lời.',
    why: 'Đường truyền trễ khoảng nửa giây, nên nói chen lên qua mạng nghe ra là cắt lời chứ không phải là sốt sắng — và lặp lại suốt một tiếng thì thành ấn tượng về tính cách.',
    critical: false,
    unresolved: false,
  },
  {
    id: 'nhin-vao-ong-kinh',
    when: 'trong-buoi',
    what: 'Ở những đoạn quan trọng — câu mở đầu, câu chốt của mỗi STAR — nhìn vào ống kính chứ không nhìn khuôn mặt trên màn hình.',
    why: 'Nhìn màn hình thì phía bên kia thấy em đang nhìn xuống; chỉ khi nhìn ống kính mới ra ánh mắt giao tiếp.',
    critical: false,
    unresolved: false,
  },
  {
    id: 'xin-nhac-lai-khi-vo-tieng',
    when: 'trong-buoi',
    what: 'Nghe tiếng vỡ hoặc mất chữ thì nói ngay: "em nghe chưa rõ, anh nhắc lại giúp em" — không đoán câu hỏi.',
    why: 'Trả lời trúng một câu mình nghe nhầm còn tệ hơn xin nhắc lại: họ sẽ kết luận là em không hiểu câu hỏi, chứ không kết luận là mạng lag.',
    critical: false,
    unresolved: false,
  },
  {
    id: 'khong-tra-cuu-giua-buoi',
    when: 'trong-buoi',
    what: 'Không mở tab tra cứu hay trợ lý AI giữa buổi, kể cả khi bí.',
    why: 'Khoảng lặng để đọc màn hình hiện rất rõ trên video, và một câu trả lời không phải của mình sẽ vỡ ngay ở câu hỏi đào sâu tiếp theo — câu "chỗ đó em chưa làm" luôn an toàn hơn.',
    critical: false,
    unresolved: false,
  },
  {
    id: 'share-dung-mot-cua-so',
    when: 'trong-buoi',
    what: 'Nếu được yêu cầu chia sẻ màn hình, chọn đúng một cửa sổ, không chọn toàn màn hình.',
    why: 'Chia sẻ toàn màn hình là chia sẻ luôn mọi thông báo bật lên và mọi thứ còn mở phía sau.',
    critical: false,
    unresolved: false,
  },

  /* --- nếu rớt mạng -------------------------------------------------------- */
  {
    id: 'vao-lai-ngay-bang-4g',
    when: 'neu-hong',
    what: 'Rớt mạng thì bật 4G điện thoại, nối laptop vào và bấm lại link ngay — vào lại trước, xin lỗi sau.',
    why: 'Một phút im lặng mà phía họ không biết chuyện gì đang xảy ra là kịch bản xấu nhất; quay lại trong vòng một phút thì sự cố chỉ là sự cố.',
    critical: true,
    unresolved: false,
  },
  {
    id: 'mo-san-luong-mail',
    when: 'neu-hong',
    what: 'Mở sẵn luồng mail thư mời trên điện thoại để reply được trong vòng một phút nếu không vào lại được.',
    why: 'Khi không vào lại được, thứ quyết định là họ biết em đang cố vào lại hay họ nghĩ em bỏ buổi.',
    critical: false,
    unresolved: false,
  },
  {
    id: 'mat-hinh-thi-giu-tieng',
    when: 'neu-hong',
    what: 'Hình giật mà tiếng còn nghe được thì chủ động tắt camera và nói rõ là em tắt hình cho đỡ nghẽn.',
    why: 'Dồn băng thông cho tiếng thì buổi phỏng vấn còn chạy tiếp; cố giữ cả hình lẫn tiếng là mất cả hai.',
    critical: false,
    unresolved: false,
  },
  {
    id: 'khong-tu-chot-lich-moi',
    when: 'neu-hong',
    what: 'Nếu buổi phải dừng giữa chừng, đừng tự chốt lịch mới trong lúc đang rối — nói "em chờ anh xếp lại giúp em" rồi xác nhận bằng mail sau.',
    why: 'Một lời hẹn nói vội qua đường truyền chập chờn là lời hẹn hai bên nhớ khác nhau, và người chịu thiệt là người đến nhầm giờ.',
    critical: false,
    unresolved: false,
  },
];
