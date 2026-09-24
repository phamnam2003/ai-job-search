import type { ReactNode } from 'react';
import s from './PageHeader.module.css';

export function PageHeader({
  eyebrow,
  title,
  lede,
  aside,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  aside?: ReactNode;
}) {
  return (
    <header className={s.head}>
      <div className={s.text}>
        {eyebrow ? <p className={s.eyebrow}>{eyebrow}</p> : null}
        <h1 className={s.title}>{title}</h1>
        {lede ? <p className={s.lede}>{lede}</p> : null}
      </div>
      {aside ? <div className={s.aside}>{aside}</div> : null}
    </header>
  );
}
