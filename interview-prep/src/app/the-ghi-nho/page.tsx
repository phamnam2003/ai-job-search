import type { Metadata } from 'next';
import Link from 'next/link';
import { Deck } from '@/components/Deck';
import { KeyProgress } from '@/components/KeyProgress';
import { PageHeader } from '@/components/PageHeader';
import { topics } from '@/content/nanyang-r1';
import { k } from '@/lib/keys';
import s from './page.module.css';

export const metadata: Metadata = { title: 'Thẻ ghi nhớ' };

export default async function CardsPage({
  searchParams,
}: PageProps<'/the-ghi-nho'>) {
  // Next 16: searchParams is a Promise — it must be awaited before use.
  const sp = await searchParams;
  const raw = sp?.topic;
  const wanted = Array.isArray(raw) ? raw[0] : raw;
  const initialTopic = topics.some((t) => t.id === wanted) ? wanted : undefined;

  const total = topics.reduce((n, t) => n + t.flashcards.length, 0);

  return (
    <div className={s.page}>
      <PageHeader
        eyebrow="Thẻ ghi nhớ"
        title={`${total} thẻ, mỗi lần một thẻ`}
        lede="Trả lời thành tiếng trước khi lật. Nếu lật ra rồi mới gật gù “à đúng rồi” thì đó chưa phải là nhớ — đó là nhận ra. Chấm thật, thẻ nào chấm 1 sẽ quay lại."
      />

      {/* key: remount when the deep link changes topic, so the select follows. */}
      <Deck key={initialTopic ?? 'all'} topics={topics} initialTopic={initialTopic} />

      <section className={s.byTopic}>
        <h2 className={s.h2}>Vào thẳng một chủ đề</h2>
        <table className={s.table}>
          <thead>
            <tr>
              <th scope="col">Chủ đề</th>
              <th scope="col">Thẻ</th>
              <th scope="col">Đã chấm</th>
            </tr>
          </thead>
          <tbody>
            {topics.map((t) => (
              <tr key={t.id}>
                <th scope="row">
                  <Link href={`/the-ghi-nho?topic=${t.id}`}>{t.title}</Link>
                </th>
                <td>{t.flashcards.length}</td>
                <td>
                  <KeyProgress
                    keys={t.flashcards.map((_, i) => k.card(t.id, i))}
                    label="đã chấm"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
