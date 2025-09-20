import { Suspense } from 'react'
import { getAllImages, getCategoriesWithCounts, getImageCount } from '@/lib/queries'
import { ImageGrid } from '@/features/gallery/components/ImageGrid'
import { CategorySidebar } from '@/features/gallery/components/CategorySidebar'

function LoadingGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {Array.from({ length: 9 }).map((_, i) => (
        <div key={i} className="aspect-[4/3] bg-gray-200 rounded-lg animate-pulse" />
      ))}
    </div>
  )
}

function LoadingSidebar() {
  return (
    <div className="w-64 bg-white border-r border-gray-200 p-6 h-full">
      <div className="h-6 bg-gray-200 rounded animate-pulse mb-4"></div>
      <div className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-100 rounded animate-pulse"></div>
        ))}
      </div>
    </div>
  )
}

async function Gallery({ categorySlug }: { categorySlug?: string }) {
  console.log('🎯 Gallery component: Starting to fetch images...')

  try {
    const images = await getAllImages()
    console.log(`🎯 Gallery component: Successfully got ${images.length} total images`)

    // Filter by category if specified
    let filteredImages = images
    if (categorySlug) {
      filteredImages = images.filter(img => img.category.slug === categorySlug)
      console.log(`🎯 Gallery component: Filtered to ${filteredImages.length} images for category: ${categorySlug}`)
    }

    console.log('🎯 First image:', filteredImages[0]?.title || 'No images found')

    return <ImageGrid images={filteredImages} />
  } catch (error) {
    console.error('🎯 Gallery component: Error fetching images:', error)
    return <div className="text-center py-12 text-red-500">Error loading images: {error instanceof Error ? error.message : 'Unknown error'}</div>
  }
}

async function Sidebar() {
  try {
    const [categories, totalImages] = await Promise.all([
      getCategoriesWithCounts(),
      getImageCount()
    ])

    return <CategorySidebar categories={categories} totalImages={totalImages} />
  } catch (error) {
    console.error('🎯 Sidebar component: Error fetching categories:', error)
    return <div className="w-64 bg-white border-r border-gray-200 p-6 text-red-500 text-sm">Error loading categories</div>
  }
}

export default function HomePage({ searchParams }: { searchParams: { category?: string } }) {
  const categorySlug = searchParams.category

  return (
    <main className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <Suspense fallback={<LoadingSidebar />}>
        <Sidebar />
      </Suspense>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Image Gallery with NextFaster Suspense boundaries */}
        <Suspense fallback={<LoadingGrid />}>
          <Gallery categorySlug={categorySlug} />
        </Suspense>

        {/* Footer */}
        <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-sm text-gray-500">
              <p>🚀 Powered by NextFaster optimization techniques</p>
              <p className="mt-1">📸 Images from Unsplash • ⚡ Built with Next.js 15</p>
              <div className="mt-2 text-xs text-gray-400">
                <p>✅ PPR • ✅ CSS Inlining • ✅ React Compiler • ✅ Smart Prefetching</p>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  )
}
