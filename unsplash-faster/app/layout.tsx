import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { SearchBar } from "@/features/search/components/SearchBar";
import Link from "next/link";

// NextFaster: Geist fonts with optimal loading (like original)
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "UnsplashFaster - NextFaster Optimized Gallery",
  description: "High-performance image gallery built with NextFaster optimization techniques",
  keywords: "nextfaster, next.js 15, performance, images, gallery, optimization",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to external domains for faster image loading */}
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen`}>
        {/* NextFaster: Header with Suspense boundaries for client components */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-blue-600 transition-colors">
                UnsplashFaster
              </Link>

              {/* Search bar - wrapped in Suspense for client component */}
              <div className="flex-1 max-w-lg mx-8">
                <Suspense fallback={
                  <div className="h-10 bg-gray-200 rounded-lg animate-pulse" />
                }>
                  <SearchBar />
                </Suspense>
              </div>

              <div className="text-sm text-gray-500 hidden sm:block">
                ⚡ NextFaster Demo
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main>{children}</main>
      </body>
    </html>
  );
}
