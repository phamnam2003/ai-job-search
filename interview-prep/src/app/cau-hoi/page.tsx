import type { Metadata } from 'next';
import { BankBoard } from '@/components/BankBoard';
import { PageHeader } from '@/components/PageHeader';
import { bank, stars } from '@/content/nanyang-r1';
import s from './page.module.css';

export const metadata: Metadata = { title: 'Ngân hàng câu hỏi' };

export default function BankPage() {
  const starTitles = Object.fromEntries(stars.map((st) => [st.id, st.title]));

  return (
    <div className={s.page}>
      <PageHeader
        eyebrow="Ngân hàng câu hỏi"
        title={`${bank.length} câu có thể bị hỏi`}
        lede="Con số duy nhất đáng nhìn ở đây là 'chưa nói' trong nhóm gần như chắc hỏi. Đọc đáp án không làm nó giảm — chỉ có nói thành tiếng mới làm nó giảm."
      />
      <BankBoard questions={bank} starTitles={starTitles} />
    </div>
  );
}
