import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { SearchBar } from '@/components/SearchBar';
import { Suspense } from 'react';

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
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">
                FasterSite Gallery
              </h1>

              {/* Search bar - wrapped in Suspense for client component */}
              <div className="flex-1 max-w-lg mx-8">
                <Suspense fallback={
                  <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
                }>
                  <SearchBar />
                </Suspense>
              </div>

              <div className="w-24"></div> {/* Spacer for balanced layout */}
            </div>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}