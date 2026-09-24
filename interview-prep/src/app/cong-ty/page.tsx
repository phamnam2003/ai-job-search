import type { Metadata } from 'next';
import { Check } from '@/components/Check';
import { ConfidenceChip } from '@/components/Chips';
import { KeyProgress } from '@/components/KeyProgress';
import { PageHeader } from '@/components/PageHeader';
import { Rich, RichText } from '@/components/Rich';
import { company, meta } from '@/content/nanyang-r1';
import { k } from '@/lib/keys';
import s from './page.module.css';

export const metadata: Metadata = { title: 'Công ty' };

export default function CompanyPage() {
  const { facts, questionsToAsk, unknowns } = company;
  const asks = [...questionsToAsk].sort((a, b) => a.priority - b.priority);
  const keep = asks.filter((q) => q.keepIfOnlyFour);
  const rest = asks.filter((q) => !q.keepIfOnlyFour);

  return (
    <div className={s.page}>
      <PageHeader
        eyebrow="Công ty"
        title={meta.company}
        lede="Biết đủ để hỏi một câu mà chỉ người đã đọc về họ mới hỏi được — và biết rõ chỗ nào mình chỉ đọc được một nguồn, để không nói chắc hơn những gì mình biết."
        aside={
          facts.length > 0 ? (
            <KeyProgress
              keys={facts.map((f) => k.fact(f.id))}
              label="đã đọc"
            />
          ) : null
        }
      />

      {/* --- what we know ------------------------------------------------- */}
      {facts.length === 0 ? (
        <p className={s.empty}>Chưa có dữ kiện nào được nạp vào đây.</p>
      ) : (
        <section className={s.section}>
          <h2 className={s.h2}>Những gì đã tra được</h2>
          <p className={s.sectionNote}>
            Nhãn &ldquo;đã kiểm chứng&rdquo; nghĩa là có nguồn độc lập với tin
            tuyển dụng. &ldquo;Một nguồn nói&rdquo; thì trong phòng phải nói kèm
            &ldquo;em đọc được là…&rdquo;, đừng khẳng định.
          </p>

          <ul className={s.facts}>
            {facts.map((f) => (
              <li key={f.id} className={s.fact}>
                <div className={s.factHead}>
                  <h3 className={s.factTitle}>{f.title}</h3>
                  <ConfidenceChip confidence={f.confidence} />
                </div>

                <RichText className={s.factBody}>{f.body}</RichText>

                {f.sayThis ? (
                  <p className={s.say}>
                    <span className={s.sayTag}>Nói thế này</span>
                    <span className={s.sayText}>
                      <Rich>{f.sayThis}</Rich>
                    </span>
                  </p>
                ) : null}

                {f.neverSay ? (
                  <p className={s.never}>
                    <span className={s.neverTag} aria-hidden="true">
                      ×
                    </span>
                    <span>
                      <strong>Đừng nói: </strong>
                      <Rich>{f.neverSay}</Rich>
                    </span>
                  </p>
                ) : null}

                <div className={s.factFoot}>
                  {f.source ? <span className={s.source}>{f.source}</span> : null}
                  <Check k={k.fact(f.id)} label="Đã đọc" />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* --- what to ask --------------------------------------------------- */}
      {asks.length > 0 ? (
        <section className={s.section}>
          <h2 className={s.h2}>Câu em hỏi lại họ</h2>
          <p className={s.sectionNote}>
            Phần này là nơi ứng viên hay bỏ trống, và nó là nơi rẻ nhất để ghi
            điểm. Về lương: hỏi band của họ trước, đừng tự nêu con số.
          </p>

          {keep.length > 0 ? (
            <div className={s.keepBox}>
              <h3 className={s.keepH}>
                Nếu chỉ còn thời gian cho {keep.length} câu thì hỏi đúng {keep.length} câu này
              </h3>
              <ol className={s.keepList}>
                {keep.map((q) => (
                  <li key={q.id} className={s.keepItem}>
                    <p className={s.askQ}>
                      <Rich>{q.q}</Rich>
                    </p>
                    <p className={s.askWhy}>{q.why}</p>
                    <Check k={k.ask(q.id)} field="spoken" label="Đã tập hỏi" />
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {rest.length > 0 ? (
            <ul className={s.asks}>
              {rest.map((q) => (
                <li key={q.id} className={s.ask}>
                  <p className={s.askQ}>
                    <Rich>{q.q}</Rich>
                  </p>
                  <p className={s.askWhy}>{q.why}</p>
                  <Check k={k.ask(q.id)} field="spoken" label="Đã tập hỏi" />
                </li>
              ))}
            </ul>
          ) : null}
        </section>
      ) : null}

      {/* --- what we do not know ------------------------------------------- */}
      {unknowns.length > 0 ? (
        <section className={s.unknown}>
          <h2 className={s.unknownH}>Chưa tra được — và không đoán</h2>
          <ul className={s.unknownList}>
            {unknowns.map((u) => (
              <li key={u}>
                <Rich>{u}</Rich>
              </li>
            ))}
          </ul>
          <p className={s.unknownNote}>
            Nếu bị hỏi trúng một trong những chỗ này, câu trả lời đúng là
            &ldquo;chỗ đó em chưa tra được, anh nói thêm giúp em&rdquo; — rồi
            hỏi lại. Đoán bừa là cách nhanh nhất để mất uy tín cho cả những câu
            mình nói đúng.
          </p>
        </section>
      ) : null}
    </div>
  );
}
