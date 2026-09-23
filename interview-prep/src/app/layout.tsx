import type { Metadata, Viewport } from 'next';
import { Source_Serif_4, Be_Vietnam_Pro, IBM_Plex_Mono } from 'next/font/google';
import { AppShell } from '@/components/AppShell';
import { meta } from '@/content/nanyang-r1';
import { ProgressProvider } from '@/lib/progress';
import { THEME_BOOT_SCRIPT } from '@/lib/theme';
import './globals.css';

/**
 * Three faces, each doing one job — and every one of them carries the
 * `vietnamese` subset, which is the actual constraint here. A display face
 * without it silently falls back mid-word and the diacritics go ragged.
 *
 * Source Serif 4  — headings and the big numbers. A serif is the deliberate
 *                   break from the default sans-on-white look; it also reads as
 *                   "document", which is what this is.
 * Be Vietnam Pro  — body. Drawn for Vietnamese, so the stacked diacritics sit
 *                   properly instead of colliding with the ascenders.
 * IBM Plex Mono   — code, clock digits, counts.
 */
const display = Source_Serif_4({
  variable: '--font-display',
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
});

const body = Be_Vietnam_Pro({
  variable: '--font-body',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const mono = IBM_Plex_Mono({
  variable: '--font-mono',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: `Ôn phỏng vấn · ${meta.company}`,
    template: `%s · Ôn phỏng vấn ${meta.company}`,
  },
  description: `Tài liệu ôn tập cho ${meta.role} — ${meta.round}, ${meta.dateLabel}.`,
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fbfcfd' },
    { media: '(prefers-color-scheme: dark)', color: '#161c21' },
  ],
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html
      lang="vi"
      className={`${display.variable} ${body.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        {/* Runs during parsing, before first paint — no flash of the wrong theme. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>
        <ProgressProvider>
          <AppShell>{children}</AppShell>
        </ProgressProvider>
      </body>
    </html>
  );
}
