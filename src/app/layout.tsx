import type { Metadata, Viewport } from 'next';
import { Inter, Newsreader } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const newsreader = Newsreader({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  style: ['normal', 'italic'],
});

export const metadata: Metadata = {
  title: 'MoveWell - Housing Transition for Aging Parents',
  description: 'A calm, structured transition coordination service helping families navigate an aging parent’s housing change with confidence and clarity.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'MoveWell',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#183C32',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full ${inter.variable} ${newsreader.variable}`}>
      <body className="min-h-full flex flex-col antialiased text-charcoal bg-canvas font-sans selection:bg-forest/10 selection:text-forest-deep pb-20 md:pb-0">
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
