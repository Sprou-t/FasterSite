import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FasterSite - Optimized Image Gallery',
  description: 'A high-performance image gallery built with Next.js 15 and NextFaster optimizations',
  keywords: 'images, gallery, photography, fast, optimized',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900">
              FasterSite Gallery
            </h1>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}