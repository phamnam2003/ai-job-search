'use client';

import { useState } from 'react';
import s from './CodeBlock.module.css';

const LABEL: Record<string, string> = {
  cypher: 'Cypher',
  sql: 'SQL',
  go: 'Go',
  ts: 'TypeScript',
  tsx: 'TSX',
  js: 'JavaScript',
  json: 'JSON',
  yaml: 'YAML',
  bash: 'Shell',
  dockerfile: 'Dockerfile',
  text: '',
};

/**
 * A code sample.
 *
 * No syntax highlighter: a highlighter would paint tokens in colours that mean
 * nothing here, and this app spends its colour budget on encodings that do carry
 * meaning (stance, activity kind, progress). Monospace plus a language label is
 * enough to read SQL at 7am.
 */
export function CodeBlock({ code, lang }: { code: string; lang?: string }) {
  const [copied, setCopied] = useState(false);
  const label = lang ? (LABEL[lang] ?? lang) : '';

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      /* Clipboard blocked (file://, no permission) — the code is selectable. */
    }
  }

  return (
    <figure className={s.wrap}>
      <div className={s.bar}>
        <span className={s.lang}>{label}</span>
        <button type="button" className={s.copy} onClick={copy}>
          {copied ? 'Đã chép' : 'Chép'}
        </button>
      </div>
      <pre className={s.pre}>
        <code>{code}</code>
      </pre>
    </figure>
  );
}
