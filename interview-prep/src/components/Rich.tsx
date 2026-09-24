import type { ReactNode } from 'react';

/**
 * The narrow slice of inline markdown the content actually uses: `code`,
 * *emphasis*, **strong**.
 *
 * Deliberately a tokenizer returning React nodes, not `dangerouslySetInnerHTML`
 * with a regex — the bodies are full of Vietnamese prose, SQL and Cypher, and
 * anything that round-trips them through raw HTML is one stray `<` away from
 * silently eating a code sample.
 *
 * Code spans win over emphasis, so `SELECT *` inside backticks stays literal.
 */
const TOKEN = /`([^`]+)`|\*\*([^*]+)\*\*|\*([^*\n]+)\*/g;

export function Rich({ children }: { children: string }) {
  return <>{parse(children)}</>;
}

/** Same parse, for places that need the nodes without a fragment wrapper. */
export function parse(text: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let n = 0;

  TOKEN.lastIndex = 0;
  let m = TOKEN.exec(text);
  while (m !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      out.push(
        <code key={n++} className="inlineCode">
          {m[1]}
        </code>,
      );
    } else if (m[2] !== undefined) {
      out.push(<strong key={n++}>{m[2]}</strong>);
    } else {
      out.push(<em key={n++}>{m[3]}</em>);
    }
    last = m.index + m[0].length;
    m = TOKEN.exec(text);
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** A paragraph of rich text. Blank lines split into separate paragraphs. */
export function RichText({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  const paras = children.split(/\n{2,}/).filter((p) => p.trim().length > 0);
  return (
    <>
      {paras.map((p, i) => (
        <p key={i} className={className}>
          {parse(p)}
        </p>
      ))}
    </>
  );
}
