'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { meta } from '@/content/nanyang-r1';
import { tally } from '@/lib/keys';
import { useProgress } from '@/lib/progress';
import { ALL_KEYS, SECTIONS, SECTION_KEYS, activeSection } from '@/lib/sections';
import { useTheme } from '@/lib/theme';
import { CountdownCompact } from './Countdown';
import s from './AppShell.module.css';

/**
 * The frame.
 *
 * The rail is a spine with a node per section — the app's one signature element.
 * It is not decoration: each node's ring fills with that section's completion,
 * so the whole plan reads as a single vertical record at a glance. Same idea the
 * product he is interviewing for is built on, which is the point.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const active = activeSection(pathname);
  const { items, ready } = useProgress();
  const { theme, toggle, ready: themeReady } = useTheme();
  const [menu, setMenu] = useState(false);
  const closeMenu = useCallback(() => setMenu(false), []);

  const overall = tally(items, ALL_KEYS);

  // Escape closes it.
  useEffect(() => {
    if (!menu) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menu]);

  const nav = (
    <nav className={s.nav} aria-label="Các phần ôn tập">
      <span className={s.spine} aria-hidden="true" />
      <ul className={s.navList}>
        {SECTIONS.map((sec) => {
          const keys = SECTION_KEYS[sec.id];
          const t = tally(items, keys);
          const isActive = active?.id === sec.id;
          const complete = sec.tracked && t.total > 0 && t.done === t.total;
          return (
            <li key={sec.id}>
              <Link
                href={sec.href}
                className={`${s.navLink} ${isActive ? s.navLinkActive : ''}`}
                aria-current={isActive ? 'page' : undefined}
                // The mobile sheet closes here rather than in an effect on
                // `pathname`: a click is the actual cause, and closing at the
                // cause avoids a second render pass that lets the sheet sit
                // over the page it just opened.
                onClick={closeMenu}
              >
                <span
                  className={`${s.node} ${complete ? s.nodeDone : ''}`}
                  aria-hidden="true"
                >
                  <svg viewBox="0 0 24 24" className={s.icon}>
                    <path d={sec.icon} />
                  </svg>
                </span>
                <span className={s.navText}>
                  <span className={s.navLabel}>{sec.label}</span>
                  <span className={s.navBlurb}>{sec.blurb}</span>
                </span>
                {sec.tracked && t.total > 0 ? (
                  <span className={s.navCount}>
                    {ready ? `${t.done}/${t.total}` : ''}
                  </span>
                ) : null}
              </Link>
              {sec.tracked && t.total > 0 ? (
                <span className={s.meter} aria-hidden="true">
                  <span
                    className={s.meterFill}
                    style={{ width: `${ready ? t.pct : 0}%` }}
                  />
                </span>
              ) : null}
            </li>
          );
        })}
      </ul>
    </nav>
  );

  return (
    <div className={s.shell}>
      {/* Mobile bar */}
      <header className={s.bar}>
        <button
          type="button"
          className={s.burger}
          aria-expanded={menu}
          aria-controls="rail-nav"
          onClick={() => setMenu((v) => !v)}
        >
          <span className={s.burgerBars} aria-hidden="true" />
          <span className={s.srOnly}>{menu ? 'Đóng menu' : 'Mở menu'}</span>
        </button>
        <span className={s.barTitle}>{active?.label ?? 'Ôn phỏng vấn'}</span>
        <CountdownCompact startsAt={meta.startsAt} />
      </header>

      <aside
        id="rail-nav"
        className={`${s.rail} ${menu ? s.railOpen : ''}`}
        data-open={menu ? 'true' : 'false'}
      >
        <div className={s.brand}>
          <Link href="/" className={s.brandLink} onClick={closeMenu}>
            <span className={s.mark} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className={s.brandText}>
              <span className={s.brandCo}>{meta.company}</span>
              <span className={s.brandRole}>{meta.role}</span>
            </span>
          </Link>
          <p className={s.brandMeta}>
            {meta.round} · {meta.language} · {meta.dateLabel}
          </p>
        </div>

        <div className={s.clock}>
          <span className={s.clockLabel}>Còn lại</span>
          <CountdownCompact startsAt={meta.startsAt} />
        </div>

        {nav}

        <div className={s.foot}>
          <div className={s.overall}>
            <span className={s.overallLabel}>Đã xong</span>
            <span className={s.overallNum} suppressHydrationWarning>
              {ready ? `${overall.done}/${overall.total}` : '—'}
            </span>
            <span className={s.overallBar} aria-hidden="true">
              <span
                className={s.overallFill}
                style={{ width: `${ready ? overall.pct : 0}%` }}
              />
            </span>
          </div>
          <button type="button" className={s.themeBtn} onClick={toggle}>
            <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
            {themeReady ? (theme === 'dark' ? 'Nền sáng' : 'Nền tối') : 'Giao diện'}
          </button>
        </div>
      </aside>

      {menu ? (
        <button
          type="button"
          className={s.scrim}
          aria-label="Đóng menu"
          onClick={closeMenu}
        />
      ) : null}

      <main className={s.main}>
        <div className={s.inner}>{children}</div>
      </main>
    </div>
  );
}
