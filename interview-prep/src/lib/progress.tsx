'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import type { Conf, ItemState } from './keys';

/**
 * Local-only progress store.
 *
 * Everything he ticks, rates or marks as spoken lives in localStorage on his
 * own machine. Nothing is sent anywhere — this app has no backend and makes no
 * network calls at runtime.
 *
 * The store itself lives at module scope, outside React, and components read it
 * through `useSyncExternalStore`. localStorage is an external mutable source:
 * reading it in an effect and calling setState means the server-rendered markup
 * paints first and is corrected a frame later, and it gives a tearing window
 * where two subscribers can disagree mid-render. `getServerSnapshot` returns the
 * empty store, so SSR and hydration agree by construction and the real values
 * arrive in one pass after hydration — which is also why `ready` is part of the
 * snapshot rather than a second piece of state that can fall out of step.
 */

interface Store {
  v: number;
  items: Record<string, ItemState>;
}

/** What every subscriber sees. `ready` is false only before the first read. */
interface Snapshot {
  ready: boolean;
  items: Record<string, ItemState>;
}

const STORAGE_KEY = 'nyb-prep-v1';
const EMPTY_ITEMS: Record<string, ItemState> = {};
const EMPTY_ITEM: ItemState = Object.freeze({});
const SERVER_SNAPSHOT: Snapshot = { ready: false, items: EMPTY_ITEMS };

function read(): Record<string, ItemState> {
  if (typeof window === 'undefined') return EMPTY_ITEMS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_ITEMS;
    const parsed = JSON.parse(raw) as Store;
    if (!parsed || typeof parsed !== 'object' || !parsed.items) return EMPTY_ITEMS;
    return parsed.items;
  } catch {
    return EMPTY_ITEMS;
  }
}

/* --- the store ------------------------------------------------------------ */

let snapshot: Snapshot = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();

function emit() {
  for (const l of listeners) l();
}

function publish(items: Record<string, ItemState>) {
  snapshot = { ready: true, items };
  emit();
}

// Keep two open tabs in step. Bound once, while anything is subscribed.
function onStorage(e: StorageEvent) {
  if (e.key === STORAGE_KEY) publish(read());
}

function subscribe(listener: () => void) {
  if (listeners.size === 0) window.addEventListener('storage', onStorage);
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) window.removeEventListener('storage', onStorage);
  };
}

function getSnapshot(): Snapshot {
  // First call is the load. It must return the same object on every later call
  // or React re-renders forever, hence the cache rather than a fresh read().
  if (!snapshot.ready) snapshot = { ready: true, items: read() };
  return snapshot;
}

function getServerSnapshot(): Snapshot {
  return SERVER_SNAPSHOT;
}

/* --- writes --------------------------------------------------------------- */

let pending: number | null = null;

// Debounced write — rating a stack of flashcards should not hammer storage.
function persist(items: Record<string, ItemState>) {
  if (typeof window === 'undefined') return;
  if (pending !== null) window.clearTimeout(pending);
  pending = window.setTimeout(() => {
    pending = null;
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ v: 1, items } satisfies Store),
      );
    } catch {
      /* quota or private mode — progress is a convenience, not the product */
    }
  }, 180);
}

function update(fn: (prev: Record<string, ItemState>) => Record<string, ItemState>) {
  const next = fn(getSnapshot().items);
  publish(next);
  persist(next);
}

function set(key: string, patch: ItemState) {
  update((prev) => ({ ...prev, [key]: { ...prev[key], ...patch, ts: Date.now() } }));
}

function toggle(key: string, field: 'done' | 'spoken') {
  update((prev) => {
    const cur = prev[key] ?? EMPTY_ITEM;
    return { ...prev, [key]: { ...cur, [field]: !cur[field], ts: Date.now() } };
  });
}

function rate(key: string, conf: Conf) {
  set(key, { conf, done: true });
}

function clear(prefix?: string) {
  update((prev) =>
    prefix
      ? Object.fromEntries(
          Object.entries(prev).filter(([k]) => !k.startsWith(prefix)),
        )
      : {},
  );
}

/* --- React surface -------------------------------------------------------- */

interface Ctx {
  /** False until localStorage has been read — render neutral until then. */
  ready: boolean;
  items: Record<string, ItemState>;
  get: (key: string) => ItemState;
  set: (key: string, patch: ItemState) => void;
  toggle: (key: string, field: 'done' | 'spoken') => void;
  rate: (key: string, conf: Conf) => void;
  clear: (prefix?: string) => void;
}

const ProgressContext = createContext<Ctx | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const { ready, items } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const get = useCallback((key: string) => items[key] ?? EMPTY_ITEM, [items]);

  const value = useMemo<Ctx>(
    () => ({ ready, items, get, set, toggle, rate, clear }),
    [ready, items, get],
  );

  return (
    <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
  );
}

export function useProgress(): Ctx {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used inside <ProgressProvider>');
  return ctx;
}

/* Types only. `k` and `tally` are deliberately NOT re-exported here — a value
   re-exported from a 'use client' module reaches a Server Component as a client
   reference, not the function. Import those from '@/lib/keys'. */
export type { Conf, ItemState, Tally } from './keys';
