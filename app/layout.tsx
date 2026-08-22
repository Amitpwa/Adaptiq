import type { Metadata, Viewport } from 'next';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v16-appRouter';

import { bodyFont, displayFont } from '@/ui/fonts';
import { Providers } from '@/ui/providers';
import { GridBackground } from '@/ui/graphics/GridBackground';

import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Adaptiq — Adaptive Learning Intelligence',
    template: '%s · Adaptiq',
  },
  description:
    'Adaptiq models your evolving knowledge state and adapts what you learn next — diagnostics, personalised paths, and Socratic tutoring grounded in what you actually know.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1A5FD0',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${displayFont.variable} ${bodyFont.variable}`}>
      <body>
        {/* Skip link: the first thing a keyboard user reaches on every page. */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <Providers>
            <GridBackground />
            {children}
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
