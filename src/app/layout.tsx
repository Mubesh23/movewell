import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { BRAND_NAME } from '@/lib/brand';
import { MotionProvider } from '@/components/providers/MotionProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: `${BRAND_NAME} — A calmer way through what comes next`,
  description: 'A warm, reassuring transition coordination platform for families supporting aging parents.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: BRAND_NAME,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1F4D45',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full ${inter.variable}`}>
      <body className="min-h-full flex flex-col antialiased text-[#183331] bg-[#F7F8F5] font-sans selection:bg-[#E8F1EA] selection:text-[#1F4D45] pb-20 md:pb-0">
        <MotionProvider>
          <main className="flex-1">{children}</main>
        </MotionProvider>
      </body>
    </html>
  );
}
