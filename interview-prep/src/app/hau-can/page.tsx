import type { Metadata } from 'next';
import { Check } from '@/components/Check';
import { KeyProgress } from '@/components/KeyProgress';
import { PageHeader } from '@/components/PageHeader';
import { logistics } from '@/content/nanyang-r1';
import type { LogisticsStage } from '@/content/types';
import { logisticsKey } from '@/lib/sections';
import s from './page.module.css';

export const metadata: Metadata = { title: 'Hậu cần' };

/**
 * The stages, in clock order, with the Vietnamese wording they render as.
 *
 * Same split as `Chips.tsx`: the ordered enum belongs to the content model, the
 * words belong to the view. Driving the page from this array rather than from
 * the order rows happen to sit in means a row added to the middle of the content
 * file still lands under the right heading.
 *
 * The labels name a DAY, not a distance from today. The stage ids are still
 * `toi-nay` / `sang-mai` — they are anchors and progress keys and must not move
 * — but the words next to them were read at 07:00 on the morning of the
 * interview, when "sáng mai" pointed at the day after it was any use.
 */
const STAGES: {
  id: LogisticsStage;
  label: string;
  clock: string;
  note: string;
}[] = [
  {
    id: 'toi-nay',
    label: 'Tối trước ngày phỏng vấn',
    clock: 'Thứ 5, 24/09',
    note: 'Gần hết việc hậu cần nằm ở đây. Sáng hôm sau không còn thời gian để mua, sửa hay quyết định bất cứ thứ gì.',
  },
  {
    id: 'sang-mai',
    label: 'Sáng phỏng vấn, trước 9h30',
    clock: 'Thứ 6, 25/09',
    note: 'Dọn đường trước 9h30. Sau đó lộ trình còn đúng hai việc: diễn thử một lượt trước camera lúc 9h35, rồi vào phòng.',
  },
  {
    id: 'truoc-gio',
    label: 'Mười phút cuối',
    clock: '9h50 – 10h00',
    note: 'Không ôn thêm chữ nào trong mười phút này. Chỉ kiểm tra máy và vào phòng.',
  },
  {
    id: 'trong-buoi',
    label: 'Trong lúc phỏng vấn',
    clock: 'Từ lúc vào phòng',
    note: 'Những thứ khác đi so với ngồi đối diện nhau — chủ yếu là nhịp nói và cái màn hình.',
  },
  {
    id: 'neu-hong',
    label: 'Nếu rớt mạng',
    clock: 'Kịch bản dự phòng',
    note: 'Đọc trước để lúc hỏng không phải nghĩ. Mạng rớt giữa buổi không phải lỗi của em; xử lý lúng túng thì mới là.',
  },
];

export default function LogisticsPage() {
  const open = logistics.filter((x) => x.unresolved);
  const criticals = logistics.filter((x) => x.critical);
  // Not every critical row can be done tonight: one of them happens at 9h55 and
  // one only happens if the line drops. The "if you only manage N things
  // tonight" sentence has to count the ones tonight can actually reach.
  const criticalTonight = criticals.filter((x) => x.when === 'toi-nay').length;
  const allKeys = logistics.map((x) => logisticsKey(x.id));
  const stages = STAGES.filter((stage) =>
    logistics.some((x) => x.when === stage.id),
  );

  return (
    <div className={s.page}>
      <PageHeader
        eyebrow="Hậu cần"
        title="Buổi phỏng vấn chuyển sang Google Meet"
        lede="Đến hết 23/09 vòng này còn là onsite ở Trần Xuân Soạn. Giờ nó diễn ra qua Google Meet, nên toàn bộ rủi ro chuyển từ đường đi sang cái bàn em ngồi: tiếng, mạng, ánh sáng, và những gì còn mở trên màn hình. Công việc thì không đổi — vị trí vẫn là onsite 5 ngày một tuần; chỉ buổi phỏng vấn là online."
        aside={<KeyProgress keys={allKeys} label="đã xong" />}
      />

      {/* --- jump straight to the stage the clock is on --------------------
          This page is read twice: once tonight, top to bottom, and once at
          09:50 tomorrow when only the last two stages matter and everything
          above them is a wall of last night's jobs. The page is static, so it
          cannot know which one it is — but the clock in the label lets him
          decide in a glance instead of scrolling. */}
      <nav className={s.jump} aria-label="Nhảy tới từng mốc">
        {stages.map((stage) => (
          <a key={stage.id} href={`#${stage.id}`} className={s.jumpLink}>
            <span className={s.jumpLabel}>{stage.label}</span>
            <span className={s.jumpClock}>{stage.clock}</span>
          </a>
        ))}
      </nav>

      {/* --- what is still open ------------------------------------------- */}
      {open.length > 0 ? (
        <section className={s.open}>
          <h2 className={s.openH}>
            Chưa chốt — {open.length} việc app không tự biết
          </h2>
          <ul className={s.openList}>
            {open.map((x) => (
              <li key={x.id}>
                <strong className={s.openWhat}>{x.what}</strong>
                <span className={s.openWhy}>{x.why}</span>
              </li>
            ))}
          </ul>
          <p className={s.openNote}>
            Repo này là public nên không giữ link Meet, không giữ số điện thoại
            nào. Những dòng trên phải tự mở thư mời ra kiểm tra rồi chốt. Ô tick
            của chúng nằm trong các mục bên dưới — tick khi đã làm thật, tick
            cho xong là tick vào một chỗ trống.
          </p>
        </section>
      ) : null}

      <p className={s.legend}>
        <span className={s.tag}>Không được sót</span> đánh dấu {criticals.length}{' '}
        trên {logistics.length} mục: đó là những mục mà sót một cái là mất buổi
        phỏng vấn, chứ không phải mất điểm. Phần còn lại vẫn nên làm, nhưng nếu
        tối 24/09 chỉ đủ sức làm {criticalTonight} việc thì làm đúng{' '}
        {criticalTonight} việc được đánh dấu trong mục “{STAGES[0].label}”.
      </p>

      {/* --- the checklist, by stage --------------------------------------- */}
      {stages.map((stage) => {
        const items = logistics.filter((x) => x.when === stage.id);

        return (
          <section key={stage.id} id={stage.id} className={s.stage}>
            <div className={s.stageHead}>
              <div className={s.stageTitle}>
                <h2 className={s.h2}>{stage.label}</h2>
                <p className={s.clock}>{stage.clock}</p>
              </div>
              <KeyProgress
                keys={items.map((x) => logisticsKey(x.id))}
                label="đã xong"
              />
            </div>
            <p className={s.stageNote}>{stage.note}</p>

            <ul className={s.items}>
              {items.map((x) => (
                <li
                  key={x.id}
                  className={`${s.item} ${x.critical ? s.itemCritical : ''}`}
                >
                  {x.critical ? (
                    <p className={s.itemTag}>
                      <span className={s.tag}>Không được sót</span>
                    </p>
                  ) : null}
                  <Check k={logisticsKey(x.id)} label={x.what} hint={x.why} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
