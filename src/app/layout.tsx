import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navbar } from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'MoveWell - Housing Transition for Aging Parents',
  description: 'A responsive PWA helping families coordinate the housing transition of an aging parent with structured transition plans, task management, and cost estimates.',
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
  maximumScale: 1,
  themeColor: '#1B4D3E',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full bg-sand-100">
      <body className="min-h-full flex flex-col antialiased text-stone-900 bg-sand-100 pb-20 md:pb-0">
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
