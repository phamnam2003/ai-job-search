import type { Metadata } from 'next';
import { MockRunner } from '@/components/MockRunner';
import { PageHeader } from '@/components/PageHeader';
import { bank, stars, topics } from '@/content/nanyang-r1';
import s from './page.module.css';

export const metadata: Metadata = { title: 'Mô phỏng' };

export default function MockPage() {
  return (
    <div className={s.page}>
      <PageHeader
        eyebrow="Mô phỏng"
        title="Chạy thử, có đồng hồ"
        lede="Mọi trang khác là đọc. Trang này là nói. Câu hỏi hiện lên, đáp án thì không, và đồng hồ chạy — vì cái hỏng trong phòng phỏng vấn thường là câu trả lời dài bốn phút, chứ không phải câu trả lời sai."
      />
      <MockRunner topics={topics} stars={stars} bank={bank} />
    </div>
  );
}
