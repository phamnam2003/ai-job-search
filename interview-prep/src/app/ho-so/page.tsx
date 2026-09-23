import type { Metadata } from 'next';
import { Check } from '@/components/Check';
import { RiskChip } from '@/components/Chips';
import { KeyProgress } from '@/components/KeyProgress';
import { PageHeader } from '@/components/PageHeader';
import { QA, Answer } from '@/components/QA';
import { Rich } from '@/components/Rich';
import { SplitBar, type Slice } from '@/components/SplitBar';
import { consistency } from '@/content/nanyang-r1';
import type { Risk } from '@/content/types';
import { k } from '@/lib/keys';
import s from './page.module.css';

export const metadata: Metadata = { title: 'Khớp hồ sơ' };

const RISK_ORDER: Risk[] = ['high', 'medium', 'low'];

const RISK_LABEL: Record<Risk, string> = {
  high: 'Rủi ro cao',
  medium: 'Rủi ro vừa',
  low: 'Rủi ro thấp',
};

const RISK_NOTE: Record<Risk, string> = {
  high: 'Gần như chắc bị hỏi tới, và trả lời hụt là mất điểm ngay.',
  medium: 'Có thể bị hỏi. Biết trước thì trả lời gọn.',
  low: 'Ít khi bị đào, nhưng đừng để tự mâu thuẫn.',
};

/* Ordered levels — one hue, đậm dần. Cao/vừa/thấp là ba mức của một thang,
   không phải ba loại khác nhau. */
const RISK_COLOR: Record<Risk, string> = {
  high: 'var(--ord-3)',
  medium: 'var(--ord-2)',
  low: 'var(--ord-1)',
};

/* The ink that goes ON that fill. The lightest step will not carry white. */
const RISK_INK: Record<Risk, string> = {
  high: 'var(--ord-3-ink)',
  medium: 'var(--ord-2-ink)',
  low: 'var(--ord-1-ink)',
};

export default function DossierPage() {
  const keys = consistency.map((c) => k.claim(c.id));

  const slices: Slice[] = RISK_ORDER.map((r) => ({
    id: r,
    label: RISK_LABEL[r],
    value: consistency.filter((c) => c.risk === r).length,
    color: RISK_COLOR[r],
    ink: RISK_INK[r],
    note: RISK_NOTE[r],
  })).filter((x) => x.value > 0);

  return (
    <div className={s.page}>
      <PageHeader
        eyebrow="Khớp hồ sơ"
        title="Những gì hồ sơ đã hứa hộ em"
        lede="CV và thư xin việc đã nói trước một số câu. Người phỏng vấn sẽ chọn một dòng bất kỳ trong đó và hỏi sâu — và đó là dòng em phải bảo vệ được bằng việc mình làm thật, không phải bằng cách nói lại chính câu đã viết."
        aside={
          keys.length > 0 ? (
            <KeyProgress keys={keys} label="đã nói thành tiếng" field="spoken" />
          ) : null
        }
      />

      <aside className={s.rule}>
        <h2 className={s.ruleH}>Hai câu không được nói sai, dù bị hỏi kiểu gì</h2>
        <ol className={s.ruleList}>
          <li>
            <strong>Phạm vi:</strong> em <em>đề xuất</em> mô hình dữ liệu và stack
            cho phần mình làm, bản thiết kế được review và duyệt rồi mới build.
            Không bao giờ nói &ldquo;em kiến trúc cả hệ thống&rdquo;.
          </li>
          <li>
            <strong>Hồ sơ:</strong> CV và thư xin việc được soạn bằng{' '}
            <strong>Claude Code</strong>, em là người chỉnh và chịu trách nhiệm nội
            dung. Nếu họ khen câu chữ hoặc hỏi &ldquo;em tự viết à&rdquo;, nói thẳng
            là có dùng AI — đây là công ty dùng AI, giấu mới là điểm trừ.
          </li>
        </ol>
      </aside>

      {consistency.length === 0 ? (
        <p className={s.empty}>Chưa có dòng nào được nạp vào đây.</p>
      ) : (
        <>
          <figure className={s.chart}>
            <figcaption className={s.chartHead}>
              <span className={s.chartTitle}>
                {consistency.length} dòng trong hồ sơ cần bảo vệ được
              </span>
            </figcaption>
            <SplitBar
              slices={slices}
              unit="dòng"
              caption="Số dòng hồ sơ theo mức rủi ro bị đào sâu"
            />
          </figure>

          {RISK_ORDER.map((r) => {
            const rows = consistency.filter((c) => c.risk === r);
            if (rows.length === 0) return null;
            return (
              <section key={r} className={s.group}>
                <h2 className={s.groupH}>
                  <RiskChip risk={r} />
                  <span className={s.groupNote}>{RISK_NOTE[r]}</span>
                </h2>

                <ul className={s.claims}>
                  {rows.map((c) => (
                    <li key={c.id} className={s.claim} data-risk={r}>
                      <div className={s.claimHead}>
                        <p className={s.claimText}>
                          <Rich>{c.claim}</Rich>
                        </p>
                        <p className={s.where}>{c.where}</p>
                      </div>

                      <div className={s.defend}>
                        <h3 className={s.defendH}>Phải chứng minh được</h3>
                        <p className={s.defendP}>
                          <Rich>{c.mustDefend}</Rich>
                        </p>
                      </div>

                      <QA id={k.claim(c.id)} question={c.drillQ}>
                        <Answer>{c.drillA}</Answer>
                      </QA>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

          <section className={s.close}>
            <h2 className={s.closeH}>Trước khi đi ngủ hôm thứ 5</h2>
            <div className={s.closeChecks}>
              <Check
                k="fact:reread-cv"
                label="Đọc lại CV đã nộp một lượt"
                hint="Để không bị bất ngờ bởi chính câu mình viết"
              />
              <Check
                k="fact:reread-cover"
                label="Đọc lại thư xin việc một lượt"
              />
              <Check
                k="fact:scope-line"
                field="spoken"
                label="Nói thành tiếng câu giữ phạm vi"
                hint="&ldquo;Em đề xuất, bản thiết kế được duyệt rồi em build&rdquo;"
              />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
