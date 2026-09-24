'use client';

import { useLayoutEffect, useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';
const KEY = 'nyb-prep-theme';

/** Runs before paint, from layout's <head>, so the first frame is never wrong. */
export const THEME_BOOT_SCRIPT = `(function(){try{var t=localStorage.getItem('${KEY}');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t}}catch(e){}})();`;

/**
 * localStorage first, then whatever the boot script stamped on <html>, then the
 * OS preference. Storage is the source of truth and the attribute is only the
 * paint, so this stays right even if it is read before the attribute is set.
 */
function current(): Theme {
  if (typeof document === 'undefined') return 'light';
  try {
    const saved = window.localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* private mode */
  }
  const stamped = document.documentElement.dataset.theme;
  if (stamped === 'light' || stamped === 'dark') return stamped;
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}

/* --- the store ------------------------------------------------------------ */

interface Snapshot {
  theme: Theme;
  /** False until the stored choice has been read — render neutral until then. */
  ready: boolean;
}

const SERVER_SNAPSHOT: Snapshot = { theme: 'light', ready: false };
let snapshot: Snapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): Snapshot {
  // Cached, because getSnapshot must return a stable object across calls.
  if (!snapshot.ready) snapshot = { theme: current(), ready: true };
  return snapshot;
}

function getServerSnapshot(): Snapshot {
  return SERVER_SNAPSHOT;
}

function apply(next: Theme) {
  document.documentElement.dataset.theme = next;
  try {
    window.localStorage.setItem(KEY, next);
  } catch {
    /* private mode — the toggle still works for this session */
  }
  snapshot = { theme: next, ready: true };
  for (const l of listeners) l();
}

function toggle() {
  apply(getSnapshot().theme === 'dark' ? 'light' : 'dark');
}

export function useTheme() {
  const { theme, ready } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  // React's dev-only Strict Mode remount resets <html> to the attributes it
  // manages from JSX, wiping the one THEME_BOOT_SCRIPT set during parsing.
  // Re-stamp it before paint. No-op in production.
  useLayoutEffect(() => {
    if (ready) document.documentElement.dataset.theme = theme;
  }, [ready, theme]);

  return { theme, toggle, ready };
}
